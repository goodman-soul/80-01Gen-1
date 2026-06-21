import { Link } from '@remix-run/react';
import { MapPin, Calendar, Package } from 'lucide-react';
import { Application, UserRole } from '~/lib/types';
import { StatusBadge } from './StatusBadge';

interface ApplicationCardProps {
  application: Application;
  userRole: UserRole;
}

export function ApplicationCard({ application, userRole }: ApplicationCardProps) {
  const detailPath = () => {
    switch (userRole) {
      case 'customer':
        return `/customer/applications/${application.id}`;
      case 'sales':
        return `/sales/applications/${application.id}/review`;
      case 'warehouse':
        return application.status === 'pending_shipment'
          ? `/warehouse/applications/${application.id}/ship`
          : application.status === 'returning'
          ? `/warehouse/applications/${application.id}/return`
          : `/customer/applications/${application.id}`;
      case 'legal':
        return `/legal/applications/${application.id}/contract`;
      default:
        return `/customer/applications/${application.id}`;
    }
  };

  return (
    <Link to={detailPath()} className="block">
      <div className="card-hover p-6 animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {application.applicationNo}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {application.sample?.name} · {application.sample?.model}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{application.targetCountry}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>预计归还: {new Date(application.expectedReturnDate).toLocaleDateString('zh-CN')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Package className="w-4 h-4 text-slate-400" />
            <span>押金: ¥{Number(application.deposit?.amount || 0).toLocaleString()}</span>
          </div>
        </div>

        {application.customer && userRole !== 'customer' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              申请人: <span className="font-medium">{application.customer.name}</span>
              {application.customer.company && (
                <span className="text-slate-400 ml-2">({application.customer.company})</span>
              )}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
