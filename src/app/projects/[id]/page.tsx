import { redirect, notFound } from 'next/navigation';
import { getUser, createServerSupabaseClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { ProjectDetailClient } from './ProjectDetailClient';
import type { Project, MediaFile, SubtitleTrack, ProcessingJob } from '@/lib/db/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const supabase = await createServerSupabaseClient();
  
  // Fetch project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !project) {
    console.log('Project not found:', error);
    notFound();
  }

  // Fetch media files separately
  const { data: mediaFiles } = await supabase
    .from('media_files')
    .select('*')
    .eq('project_id', id);

  // Fetch processing jobs separately
  const { data: processingJobs } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('project_id', id);

  // Fetch subtitle tracks
  const mediaFileIds = (mediaFiles || []).map((mf: MediaFile) => mf.id);
  
  let subtitleTracks: SubtitleTrack[] = [];
  if (mediaFileIds.length > 0) {
    const { data: tracks } = await supabase
      .from('subtitle_tracks')
      .select('*')
      .in('media_file_id', mediaFileIds);
    
    subtitleTracks = tracks || [];
  }

  const typedProject = {
    ...project,
    media_files: mediaFiles || [],
    processing_jobs: processingJobs || [],
  } as Project & { 
    media_files: MediaFile[];
    processing_jobs: ProcessingJob[];
  };

  return (
    <AppShell user={user}>
      <ProjectDetailClient 
        project={typedProject}
        subtitleTracks={subtitleTracks}
        userId={user.id}
      />
    </AppShell>
  );
}
