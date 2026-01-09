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
    const maxSize = 50 * 1024 * 1024;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File quá lớn. Giới hạn tối đa là 50MB. Hãy nén video hoặc cắt thành đoạn ngắn hơn.' },
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
        { error: 'Định dạng không hỗ trợ. Chỉ chấp nhận: MP3, WAV, M4A, MP4, WebM, MOV' },
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

    // Create signed upload URL
    const adminClient = createAdminClient();
    
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
