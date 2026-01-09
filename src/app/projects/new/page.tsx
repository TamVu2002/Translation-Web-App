import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { NewProjectForm } from './NewProjectForm';

export default async function NewProjectPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login?redirectTo=/projects/new');
  }

  return (
    <AppShell user={user} showSidebar={false}>
      <NewProjectForm />
    </AppShell>
  );
}
