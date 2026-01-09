import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardClient } from './DashboardClient';
import { getUser } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Project, MediaFile } from '@/lib/db/types';

export default async function DashboardPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const supabase = await createServerSupabaseClient();
  
  // Fetch user's projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  // Fetch media files for all projects
  const projectIds = (projects || []).map(p => p.id);
  const mediaFilesMap: Record<string, MediaFile[]> = {};
  
  if (projectIds.length > 0) {
    const { data: mediaFiles } = await supabase
      .from('media_files')
      .select('*')
      .in('project_id', projectIds);
    
    // Group by project_id
    (mediaFiles || []).forEach((mf: MediaFile) => {
      if (!mediaFilesMap[mf.project_id]) {
        mediaFilesMap[mf.project_id] = [];
      }
      mediaFilesMap[mf.project_id].push(mf);
    });
  }

  const typedProjects = (projects || []).map(p => ({
    ...p,
    media_files: mediaFilesMap[p.id] || [],
  })) as (Project & { media_files: MediaFile[] })[];

  return (
    <AppShell user={user}>
      <DashboardClient initialProjects={typedProjects} />
    </AppShell>
  );
}
