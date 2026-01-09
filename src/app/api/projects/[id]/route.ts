import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  try {
    // 1. Verify ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // 2. Get all media files to delete from storage
    const { data: mediaFiles } = await supabase
      .from('media_files')
      .select('storage_bucket, storage_path')
      .eq('project_id', projectId);

    // 3. Get all subtitle tracks to delete from storage
    const { data: subtitleTracks } = await supabase
      .from('subtitle_tracks')
      .select('storage_bucket, storage_path')
      .eq('project_id', projectId);

    // 4. Delete media files from storage
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        try {
          await adminClient.storage
            .from(file.storage_bucket)
            .remove([file.storage_path]);
        } catch (e) {
          console.warn('Failed to delete media file from storage:', e);
        }
      }
    }

    // 5. Delete subtitle files from storage
    if (subtitleTracks && subtitleTracks.length > 0) {
      for (const track of subtitleTracks) {
        try {
          await adminClient.storage
            .from(track.storage_bucket)
            .remove([track.storage_path]);
        } catch (e) {
          console.warn('Failed to delete subtitle file from storage:', e);
        }
      }
    }

    // 6. Delete project (CASCADE will delete related records)
    const { error: deleteError } = await adminClient
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      throw deleteError;
    }

    // 7. Clear any server-side cache if needed
    // In Next.js, we can use revalidatePath or revalidateTag
    // For now, we'll just return success and let client handle refresh

    return NextResponse.json({ 
      success: true, 
      message: 'Project and all associated files deleted successfully',
      deletedFiles: {
        media: mediaFiles?.length || 0,
        subtitles: subtitleTracks?.length || 0,
      }
    });

  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
