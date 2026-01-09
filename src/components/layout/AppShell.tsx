import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
  showSidebar?: boolean;
}

export function AppShell({ children, user, showSidebar = true }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <div className="flex flex-1">
        {showSidebar && user && <Sidebar />}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
