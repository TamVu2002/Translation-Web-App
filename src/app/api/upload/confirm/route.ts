import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, mediaFileId, storagePath, filename, mimeType, fileSize } = body;

    // Validate input
    if (!projectId || !mediaFileId || !storagePath || !filename || !mimeType || !fileSize) {
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

    // Insert media file record (storage_bucket = 'r2' for Cloudflare R2)
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
        storage_bucket: 'r2',
        storage_path: storagePath,
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
