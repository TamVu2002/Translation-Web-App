import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGroqClient, DEFAULT_TRANSCRIPTION_MODEL } from '@/lib/ai/groq';
import { whisperSegmentsToVTT, type WhisperSegment } from '@/lib/vtt/format';
import { parseVTT } from '@/lib/vtt/parse';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 300; // 5 minutes timeout for long files

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, mediaFileId } = body;

  if (!projectId || !mediaFileId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Create job record
  const jobId = uuidv4();
  
  try {
    // Verify ownership and get project/media info
    const { data: mediaFile, error: mediaError } = await supabase
      .from('media_files')
      .select('*, projects(*)')
      .eq('id', mediaFileId)
      .eq('owner_id', user.id)
      .single();

    if (mediaError || !mediaFile) {
      return NextResponse.json(
        { error: 'Media file not found or access denied' },
        { status: 404 }
      );
    }

    const project = mediaFile.projects as { source_language: string };

    // Create processing job
    await adminClient
      .from('processing_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        media_file_id: mediaFileId,
        owner_id: user.id,
        job_type: 'transcribe',
        status: 'queued',
        progress: 0,
      });

    // Start background processing (in real app, use a queue like BullMQ or Supabase Edge Functions)
    // For MVP, we'll process inline but return immediately
    processTranscription(
      adminClient,
      jobId,
      user.id,
      projectId,
      mediaFile,
      project.source_language
    ).catch(console.error);

    return NextResponse.json({
      jobId,
      status: 'queued',
      message: 'Transcription started',
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Update job status to failed
    await adminClient
      .from('processing_jobs')
      .update({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      .eq('id', jobId);

    return NextResponse.json(
      { error: 'Failed to start transcription' },
      { status: 500 }
    );
  }
}

async function processTranscription(
  adminClient: ReturnType<typeof createAdminClient>,
  jobId: string,
  userId: string,
  projectId: string,
  mediaFile: {
    id: string;
    storage_bucket: string;
    storage_path: string;
    original_filename: string;
  },
  sourceLanguage: string
) {
  try {
    // Update job status to running
    await adminClient
      .from('processing_jobs')
      .update({ status: 'running', progress: 0.1 })
      .eq('id', jobId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await adminClient
      .storage
      .from(mediaFile.storage_bucket)
      .download(mediaFile.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Update progress
    await adminClient
      .from('processing_jobs')
      .update({ progress: 0.2 })
      .eq('id', jobId);

    // Convert to File object for Groq
    const file = new File([fileData], mediaFile.original_filename, {
      type: fileData.type,
    });

    // Call Groq Whisper API
    const groq = getGroqClient();
    
    const transcriptionOptions: {
      file: File;
      model: string;
      response_format: 'verbose_json';
      language?: string;
    } = {
      file,
      model: DEFAULT_TRANSCRIPTION_MODEL,
      response_format: 'verbose_json',
    };

    // Only set language if not auto-detect
    if (sourceLanguage && sourceLanguage !== 'auto') {
      transcriptionOptions.language = sourceLanguage;
    }

    const transcription = await groq.audio.transcriptions.create(transcriptionOptions);

    // Update progress
    await adminClient
      .from('processing_jobs')
      .update({ progress: 0.7 })
      .eq('id', jobId);

    // Convert to VTT
    const segments = (transcription as unknown as { segments: WhisperSegment[] }).segments || [];
    const detectedLanguage = (transcription as unknown as { language: string }).language || sourceLanguage || 'en';
    
    const vttContent = whisperSegmentsToVTT(segments);
    const cues = parseVTT(vttContent);

    // Save VTT to storage
    const trackId = uuidv4();
    const vttPath = `${userId}/${projectId}/${trackId}.vtt`;
    
    const { error: uploadError } = await adminClient
      .storage
      .from('subtitles')
      .upload(vttPath, vttContent, {
        contentType: 'text/vtt',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload VTT: ${uploadError.message}`);
    }

    // Update progress
    await adminClient
      .from('processing_jobs')
      .update({ progress: 0.9 })
      .eq('id', jobId);

    // Create subtitle track record
    const { error: trackError } = await adminClient
      .from('subtitle_tracks')
      .insert({
        id: trackId,
        project_id: projectId,
        media_file_id: mediaFile.id,
        owner_id: userId,
        track_type: 'original',
        language: detectedLanguage,
        format: 'vtt',
        storage_bucket: 'subtitles',
        storage_path: vttPath,
        cue_count: cues.length,
      });

    if (trackError) {
      throw new Error(`Failed to create track record: ${trackError.message}`);
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
    console.error('Transcription processing error:', error);
    
    await adminClient
      .from('processing_jobs')
      .update({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', jobId);
  }
}
