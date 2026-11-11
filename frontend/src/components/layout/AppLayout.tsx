import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, HardDrive, Wrench, Search, FileBarChart, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils';
import type { RoleName } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: RoleName[]; // omit = visible to all authenticated roles
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assets', label: 'Assets', icon: HardDrive },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-primary text-primary-foreground">
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-accent font-mono text-xs font-bold text-brandMaroon">
            IT
          </div>
          <span className="text-sm font-semibold">ICT Inventory</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-accent bg-white/10 text-white'
                    : 'border-transparent text-white/70 hover:border-accent/50 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-brandMaroon/40 p-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-white/60">{user?.role.replace(/_/g, ' ')}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  );
}
