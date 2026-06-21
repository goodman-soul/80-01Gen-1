import { NavLink, useNavigate } from '@remix-run/react';
import {
  LayoutDashboard,
  FilePlus,
  Package,
  ClipboardList,
  FileCheck,
  LogOut,
  User,
} from 'lucide-react';
import { UserRole, roleLabels } from '~/lib/types';
import { authApi } from '~/lib/api';

interface SidebarProps {
  user: { role: UserRole; name: string; email: string };
}

const navItems: Record<UserRole, Array<{ to: string; label: string; icon: React.ElementType }>> = {
  customer: [
    { to: '/customer/dashboard', label: '我的申请', icon: LayoutDashboard },
    { to: '/customer/applications/new', label: '新建申请', icon: FilePlus },
  ],
  sales: [
    { to: '/sales/dashboard', label: '待审核', icon: ClipboardList },
    { to: '/sales/samples', label: '样机管理', icon: Package },
  ],
  warehouse: [
    { to: '/warehouse/dashboard', label: '出入库', icon: Package },
  ],
  legal: [
    { to: '/legal/dashboard', label: '合同合规', icon: FileCheck },
  ],
};

export function Sidebar({ user }: SidebarProps) {
  const navigate = useNavigate();
  const items = navItems[user.role];

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary-500 text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">跨境样品借测系统</h1>
        <p className="text-sm text-slate-300 mt-1">Cross-Border Sample System</p>
      </div>

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-300">{roleLabels[user.role]}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-red-300 hover:text-red-200 hover:bg-red-500/20"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
