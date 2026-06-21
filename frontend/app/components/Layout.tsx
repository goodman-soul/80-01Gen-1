import { User } from '~/lib/types';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
}

export function Layout({ user, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
