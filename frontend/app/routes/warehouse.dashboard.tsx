import { LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Package, Clock, ArrowUpRight, ArrowDownLeft, User, MapPin } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { StatCard } from '~/components/StatCard';
import { StatusBadge } from '~/components/StatusBadge';
import { Application } from '~/lib/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';

  const [userRes, appsRes] = await Promise.all([
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
    fetch(`${apiUrl}/api/applications`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
  ]);

  if (!userRes.ok) throw new Response('Unauthorized', { status: 401 });

  const user = await userRes.json();
  const applications = await appsRes.json();

  return json({ user, applications });
}

export default function WarehouseDashboard() {
  const { user, applications } = useLoaderData<typeof loader>();

  const pendingShipment = applications.filter(
    (a: Application) => a.status === 'pending_shipment'
  );
  const pendingReturn = applications.filter(
    (a: Application) => a.status === 'returning'
  );

  const stats = {
    total: applications.length,
    pendingShipment: pendingShipment.length,
    pendingReturn: pendingReturn.length,
    completed: applications.filter((a: Application) => a.status === 'completed').length,
  };

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">仓库管理</h1>
          <p className="text-slate-500 mt-1">处理样机的出库和入库</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="全部申请" value={stats.total} icon={Package} />
          <StatCard title="待发货" value={stats.pendingShipment} icon={ArrowUpRight} color="warning" />
          <StatCard title="待验收" value={stats.pendingReturn} icon={ArrowDownLeft} color="warning" />
          <StatCard title="已完成" value={stats.completed} icon={Clock} color="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">待发货申请</h2>
            {pendingShipment.length === 0 ? (
              <div className="card p-12 text-center">
                <ArrowUpRight className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                <p className="text-slate-500">暂无待发货的申请</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingShipment.map((app: Application) => (
                  <div key={app.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{app.applicationNo}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {app.sample?.name} · {app.sample?.model}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{app.customer?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{app.targetCountry}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg mb-4 border border-amber-100">
                      <p className="text-sm text-amber-700">
                        请确认样机 {app.sample?.serialNumber} 已准备好并发货
                      </p>
                    </div>

                    <a
                      href={`/warehouse/applications/${app.id}/ship`}
                      className="btn-primary w-full justify-center"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      录入物流信息并发货
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">待验收归还</h2>
            {pendingReturn.length === 0 ? (
              <div className="card p-12 text-center">
                <ArrowDownLeft className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                <p className="text-slate-500">暂无待验收的归还</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReturn.map((app: Application) => (
                  <div key={app.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{app.applicationNo}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {app.sample?.name} · {app.sample?.model}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{app.customer?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{app.targetCountry}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-100">
                      <p className="text-sm text-blue-700">
                        客户已归还，请检查样机状况
                      </p>
                    </div>

                    <a
                      href={`/warehouse/applications/${app.id}/return`}
                      className="btn-primary w-full justify-center"
                    >
                      <ArrowDownLeft className="w-4 h-4 mr-2" />
                      进行归还检查
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">全部出入库记录</h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">申请编号</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">样机</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">客户</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">国家</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">状态</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app: Application) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-sm">{app.applicationNo}</td>
                    <td className="p-4 text-sm">{app.sample?.name}</td>
                    <td className="p-4 text-sm">{app.customer?.name}</td>
                    <td className="p-4 text-sm">{app.targetCountry}</td>
                    <td className="p-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-4">
                      {app.status === 'pending_shipment' ? (
                        <a href={`/warehouse/applications/${app.id}/ship`} className="text-sm text-primary-500 hover:underline">
                          发货
                        </a>
                      ) : app.status === 'returning' ? (
                        <a href={`/warehouse/applications/${app.id}/return`} className="text-sm text-primary-500 hover:underline">
                          验收
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
