import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, uploadthingKey, uploadthingUrl, filename, mimeType, fileSize } = body;

    // Validate input
    if (!projectId || !uploadthingKey || !uploadthingUrl || !filename || !mimeType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Determine media kind
    const kind = mimeType.startsWith('video/') ? 'video' : 'audio';

    // Generate a unique ID for this media file
    const mediaFileId = uuidv4();

    // Insert media file record (storage_bucket = 'uploadthing')
    const { data: mediaFile, error: insertError } = await supabase
      .from('media_files')
      .insert({
        id: mediaFileId,
        project_id: projectId,
        owner_id: user.id,
        kind,
        original_filename: filename,
        mime_type: mimeType,
        size_bytes: fileSize,
        storage_bucket: 'uploadthing',
        storage_path: uploadthingKey, // Store the uploadthing key
        // Store the full URL in a custom field or we can reconstruct it later
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save file record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mediaFileId,
      mediaFile,
    });

  } catch (error) {
    console.error('Upload confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
