import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGroqClient, DEFAULT_TRANSLATION_MODEL } from '@/lib/ai/groq';
import { parseVTT, extractCueTexts } from '@/lib/vtt/parse';
import { buildTranslatedVTT } from '@/lib/vtt/format';
import { LANGUAGE_NAMES_EN } from '@/lib/constants';
import type { VTTCue } from '@/lib/db/types';
import { v4 as uuidv4 } from 'uuid';
import type Groq from 'groq-sdk';

export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, originalTrackId, targetLanguage } = body;

  if (!projectId || !originalTrackId || !targetLanguage) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const jobId = uuidv4();

  try {
    // Verify ownership and get track info
    const { data: track, error: trackError } = await supabase
      .from('subtitle_tracks')
      .select('*')
      .eq('id', originalTrackId)
      .eq('owner_id', user.id)
      .single();

    if (trackError || !track) {
      return NextResponse.json(
        { error: 'Subtitle track not found or access denied' },
        { status: 404 }
      );
    }

    // Create processing job
    await adminClient
      .from('processing_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        media_file_id: track.media_file_id,
        owner_id: user.id,
        job_type: 'translate',
        status: 'queued',
        progress: 0,
      });

    // Start background processing
    processTranslation(
      adminClient,
      jobId,
      user.id,
      projectId,
      track,
      targetLanguage
    ).catch(console.error);

    return NextResponse.json({
      jobId,
      status: 'queued',
      message: 'Translation started',
    });

  } catch (error) {
    console.error('Translation error:', error);
    
    await adminClient
      .from('processing_jobs')
      .update({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      .eq('id', jobId);

    return NextResponse.json(
      { error: 'Failed to start translation' },
      { status: 500 }
    );
  }
}

async function processTranslation(
  adminClient: ReturnType<typeof createAdminClient>,
  jobId: string,
  userId: string,
  projectId: string,
  originalTrack: {
    id: string;
    media_file_id: string;
    storage_bucket: string;
    storage_path: string;
    language: string;
  },
  targetLanguage: string
) {
  try {
    // Update job status to running
    await adminClient
      .from('processing_jobs')
      .update({ status: 'running', progress: 0.1 })
      .eq('id', jobId);

    // Download original VTT
    const { data: vttData, error: downloadError } = await adminClient
      .storage
      .from(originalTrack.storage_bucket)
      .download(originalTrack.storage_path);

    if (downloadError || !vttData) {
      throw new Error(`Failed to download VTT: ${downloadError?.message}`);
    }

    const vttContent = await vttData.text();
    const cues = parseVTT(vttContent);
    
    if (cues.length === 0) {
      throw new Error('No subtitle cues found in the original track');
    }

    // Update progress
    await adminClient
      .from('processing_jobs')
      .update({ progress: 0.2 })
      .eq('id', jobId);

    // Translate cues in batches
    const cueTexts = extractCueTexts(cues);
    const translatedTexts = await translateCueTexts(
      cueTexts,
      originalTrack.language,
      targetLanguage,
      async (progress) => {
        await adminClient
          .from('processing_jobs')
          .update({ progress: 0.2 + progress * 0.6 })
          .eq('id', jobId);
      }
    );

    // Build translated VTT
    const translatedVtt = buildTranslatedVTT(cues, translatedTexts);

    // Update progress
    await adminClient
      .from('processing_jobs')
      .update({ progress: 0.85 })
      .eq('id', jobId);

    // Save translated VTT to storage
    const trackId = uuidv4();
    const vttPath = `${userId}/${projectId}/${trackId}.vtt`;
    
    const { error: uploadError } = await adminClient
      .storage
      .from('subtitles')
      .upload(vttPath, translatedVtt, {
        contentType: 'text/vtt',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload translated VTT: ${uploadError.message}`);
    }

    // Create translated track record
    const { error: trackError } = await adminClient
      .from('subtitle_tracks')
      .insert({
        id: trackId,
        project_id: projectId,
        media_file_id: originalTrack.media_file_id,
        owner_id: userId,
        track_type: 'translated',
        language: targetLanguage,
        format: 'vtt',
        storage_bucket: 'subtitles',
        storage_path: vttPath,
        cue_count: cues.length,
      });

    if (trackError) {
      throw new Error(`Failed to create translated track record: ${trackError.message}`);
    }

    // Update job status to succeeded
    await adminClient
      .from('processing_jobs')
      .update({ 
        status: 'succeeded', 
        progress: 1,
        result_track_id: trackId,
      })
      .eq('id', jobId);

  } catch (error) {
    console.error('Translation processing error:', error);
    
    await adminClient
      .from('processing_jobs')
      .update({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', jobId);
  }
}

async function translateCueTexts(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string,
  onProgress: (progress: number) => Promise<void>
): Promise<string[]> {
  const groq = getGroqClient();
  const batchSize = 20; // Process 20 cues at a time
  const results: string[] = [];
  
  const sourceLangName = LANGUAGE_NAMES_EN[sourceLanguage] || sourceLanguage;
  const targetLangName = LANGUAGE_NAMES_EN[targetLanguage] || targetLanguage;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchIndex = i / batchSize;
    const totalBatches = Math.ceil(texts.length / batchSize);
    
    // Translate batch
    const translatedBatch = await translateBatch(
      groq,
      batch,
      sourceLangName,
      targetLangName
    );
    
    results.push(...translatedBatch);
    
    // Update progress
    await onProgress((batchIndex + 1) / totalBatches);
  }

  return results;
}

async function translateBatch(
  groq: Groq,
  texts: string[],
  sourceLangName: string,
  targetLangName: string,
  retryCount = 0
): Promise<string[]> {
  const maxRetries = 2;
  
  const systemPrompt = `You are a professional subtitle translator. Translate the following subtitle texts from ${sourceLangName} to ${targetLangName}.

CRITICAL RULES:
1. Return ONLY a JSON array of translated strings
2. The array MUST have EXACTLY ${texts.length} elements
3. Maintain the same order as input
4. Keep translations concise (subtitles should be short)
5. Preserve meaning and tone
6. Do not add or remove any lines
7. Do not merge or split cues
8. If a line is empty or just punctuation, return it as-is

Example input: ["Hello world", "How are you?"]
Example output: ["Xin chào thế giới", "Bạn khỏe không?"]`;

  const userPrompt = JSON.stringify(texts);

  try {
    const response = await groq.chat.completions.create({
      model: DEFAULT_TRANSLATION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from GPT');
    }

    // Parse response - handle both array and object with array
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON response from GPT');
    }

    let translations: string[];
    
    if (Array.isArray(parsed)) {
      translations = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // GPT might return { translations: [...] } or { result: [...] }
      const obj = parsed as Record<string, unknown>;
      const arrayValue = Object.values(obj).find(v => Array.isArray(v));
      if (arrayValue) {
        translations = arrayValue as string[];
      } else {
        throw new Error('Could not find translations array in response');
      }
    } else {
      throw new Error('Unexpected response format from GPT');
    }

    // Validate length
    if (translations.length !== texts.length) {
      if (retryCount < maxRetries) {
        console.warn(`Translation count mismatch (${translations.length} vs ${texts.length}), retrying...`);
        return translateBatch(groq, texts, sourceLangName, targetLangName, retryCount + 1);
      }
      throw new Error(`Translation count mismatch: expected ${texts.length}, got ${translations.length}`);
    }

    // Ensure all items are strings
    return translations.map(t => String(t || ''));

  } catch (error) {
    if (retryCount < maxRetries) {
      console.warn('Translation error, retrying...', error);
      return translateBatch(groq, texts, sourceLangName, targetLangName, retryCount + 1);
    }
    throw error;
  }
}
