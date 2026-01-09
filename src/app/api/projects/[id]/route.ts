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
    const deletedMedia: string[] = [];
    const failedMedia: string[] = [];
    
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        if (file.storage_bucket && file.storage_path) {
          const { error } = await adminClient.storage
            .from(file.storage_bucket)
            .remove([file.storage_path]);
          
          if (error) {
            console.error('Failed to delete media file:', file.storage_path, error);
            failedMedia.push(file.storage_path);
          } else {
            deletedMedia.push(file.storage_path);
          }
        }
      }
    }

    // 5. Delete subtitle files from storage
    const deletedSubtitles: string[] = [];
    const failedSubtitles: string[] = [];
    
    if (subtitleTracks && subtitleTracks.length > 0) {
      for (const track of subtitleTracks) {
        if (track.storage_bucket && track.storage_path) {
          const { error } = await adminClient.storage
            .from(track.storage_bucket)
            .remove([track.storage_path]);
          
          if (error) {
            console.error('Failed to delete subtitle file:', track.storage_path, error);
            failedSubtitles.push(track.storage_path);
          } else {
            deletedSubtitles.push(track.storage_path);
          }
        }
      }
    }
    
    // 6. Also try to delete the project folder in storage
    const folderPath = `${user.id}/${projectId}`;
    try {
      const { data: folderContents } = await adminClient.storage
        .from('media')
        .list(folderPath);
      
      if (folderContents && folderContents.length > 0) {
        const filesToDelete = folderContents.map(f => `${folderPath}/${f.name}`);
        await adminClient.storage.from('media').remove(filesToDelete);
      }
    } catch (e) {
      console.warn('Could not clean up folder:', e);
    }

    // 7. Delete project (CASCADE will delete related records)
    const { error: deleteError } = await adminClient
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project and all associated files deleted successfully',
      deletedFiles: {
        media: deletedMedia.length,
        subtitles: deletedSubtitles.length,
        failedMedia: failedMedia.length,
        failedSubtitles: failedSubtitles.length,
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
