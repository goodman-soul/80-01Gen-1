import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

const colorClasses = {
  default: 'from-blue-50 to-blue-100 text-blue-600',
  success: 'from-emerald-50 to-emerald-100 text-emerald-600',
  warning: 'from-amber-50 to-amber-100 text-amber-600',
  danger: 'from-red-50 to-red-100 text-red-600',
};

export function StatCard({ title, value, icon: Icon, color = 'default' }: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}
