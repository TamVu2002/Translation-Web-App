import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const mediaFileId = searchParams.get('mediaFileId');

    if (!projectId || !mediaFileId) {
      return NextResponse.json(
        { error: 'Missing projectId or mediaFileId' },
        { status: 400 }
      );
    }

    // Verify ownership and get media file info
    const { data: mediaFile, error: mediaError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', mediaFileId)
      .eq('owner_id', user.id)
      .single();

    if (mediaError || !mediaFile) {
      return NextResponse.json(
        { error: 'Media file not found or access denied' },
        { status: 404 }
      );
    }

    // Get subtitle tracks
    const { data: tracks } = await supabase
      .from('subtitle_tracks')
      .select('*')
      .eq('media_file_id', mediaFileId)
      .eq('owner_id', user.id);

    const originalTrack = tracks?.find(t => t.track_type === 'original');
    const translatedTrack = tracks?.find(t => t.track_type === 'translated');

    const adminClient = createAdminClient();
    const expiresIn = 3600; // 1 hour

    // Media URL - check storage provider
    let mediaUrl = null;
    if (mediaFile.storage_bucket === 'uploadthing') {
      // Use Uploadthing - construct URL from key
      // Uploadthing URLs are public and don't need signing
      mediaUrl = `https://utfs.io/f/${mediaFile.storage_path}`;
    } else {
      // Use Supabase Storage (legacy)
      const { data: mediaUrlData } = await adminClient
        .storage
        .from(mediaFile.storage_bucket)
        .createSignedUrl(mediaFile.storage_path, expiresIn);
      mediaUrl = mediaUrlData?.signedUrl || null;
    }

    // Original track URL (subtitles still in Supabase)
    let originalTrackUrl = null;
    if (originalTrack) {
      const { data: originalUrlData } = await adminClient
        .storage
        .from(originalTrack.storage_bucket)
        .createSignedUrl(originalTrack.storage_path, expiresIn);
      originalTrackUrl = originalUrlData?.signedUrl || null;
    }

    // Translated track URL (subtitles still in Supabase)
    let translatedTrackUrl = null;
    if (translatedTrack) {
      const { data: translatedUrlData } = await adminClient
        .storage
        .from(translatedTrack.storage_bucket)
        .createSignedUrl(translatedTrack.storage_path, expiresIn);
      translatedTrackUrl = translatedUrlData?.signedUrl || null;
    }

    return NextResponse.json({
      mediaUrl,
      originalTrackUrl,
      translatedTrackUrl,
    });

  } catch (error) {
    console.error('Player URLs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
