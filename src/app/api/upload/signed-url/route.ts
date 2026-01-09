import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, filename, contentType, fileSize } = body;

    // Validate input
    if (!projectId || !filename || !contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max for Supabase Free tier)
    // Upgrade to Pro tier for up to 5GB per file
    const maxSize = 50 * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File quá lớn. Giới hạn tối đa là 50MB (Supabase Free tier). Nâng cấp lên Pro để upload file đến 5GB.' },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/x-m4a',
      'audio/m4a',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];
    
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP3, WAV, M4A, MP4, WebM, MOV' },
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

    // Generate storage path
    const mediaFileId = uuidv4();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${projectId}/${mediaFileId}-${sanitizedFilename}`;

    // Create signed upload URL using admin client
    const adminClient = createAdminClient();
    
    // For large files (>50MB), use resumable upload
    const isLargeFile = fileSize > 50 * 1024 * 1024;
    
    if (isLargeFile) {
      // Create resumable upload URL with longer expiration (2 hours)
      const { data: uploadData, error: uploadError } = await adminClient
        .storage
        .from('media')
        .createSignedUploadUrl(storagePath, {
          upsert: false,
        });

      if (uploadError || !uploadData) {
        console.error('Resumable upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to create upload URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        signedUrl: uploadData.signedUrl,
        storagePath,
        mediaFileId,
        token: uploadData.token,
        isResumable: true,
        bucket: 'media',
      });
    }
    
    // For smaller files, use regular signed URL
    const { data: signedUrlData, error: signedUrlError } = await adminClient
      .storage
      .from('media')
      .createSignedUploadUrl(storagePath, {
        upsert: false,
      });

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      storagePath,
      mediaFileId,
      token: signedUrlData.token,
    });

  } catch (error) {
    console.error('Upload signed URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
