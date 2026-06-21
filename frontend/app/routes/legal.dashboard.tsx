import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { FileCheck, Clock, CheckCircle, XCircle, User, MapPin, FileText, ShieldAlert } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { StatCard } from '~/components/StatCard';
import { StatusBadge } from '~/components/StatusBadge';
import { Application } from '~/lib/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';

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

export default function LegalDashboard() {
  const { user, applications } = useLoaderData<typeof loader>();

  const pendingLegalReview = applications.filter(
    (a: Application) => a.status === 'pending_legal_review'
  );

  const stats = {
    total: applications.length,
    pendingReview: pendingLegalReview.length,
    approved: applications.filter((a: Application) => 
      a.contract?.status === 'approved'
    ).length,
    rejected: applications.filter((a: Application) => 
      ['legal_rejected'].includes(a.status) || a.contract?.status === 'rejected'
    ).length,
  };

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">合同合规审核</h1>
          <p className="text-slate-500 mt-1">审核样机借用合同和出口合规内容</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="全部申请" value={stats.total} icon={FileText} />
          <StatCard title="待审核" value={stats.pendingReview} icon={Clock} color="warning" />
          <StatCard title="已通过" value={stats.approved} icon={CheckCircle} color="success" />
          <StatCard title="已驳回" value={stats.rejected} icon={XCircle} color="danger" />
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">待合规审核</h2>
          {pendingLegalReview.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
              <p className="text-slate-500">暂无待审核的申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLegalReview.map((app: Application) => (
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

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{app.customer?.name}</span>
                      {app.customer?.company && (
                        <span className="text-slate-400">({app.customer.company})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{app.targetCountry}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">押金: </span>
                      <span className="font-mono font-semibold">¥{Number(app.deposit?.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg mb-4">
                    <p className="text-sm text-slate-500 mb-1">测试用途</p>
                    <p className="text-slate-700">{app.testPurpose}</p>
                  </div>

                  {app.salesReviewComment && (
                    <div className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-100">
                      <p className="text-sm text-blue-700">
                        <strong>销售审核意见：</strong>{app.salesReviewComment}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <a
                      href={`/legal/applications/${app.id}/contract`}
                      className="btn flex-1 justify-center"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      查看合同
                    </a>
                    <a
                      href={`/legal/applications/${app.id}/compliance`}
                      className="btn-primary flex-1 justify-center"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      合规审核
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-lg font-semibold text-slate-900 mt-8">全部申请</h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">申请编号</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">客户</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">样机</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">国家</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">合同状态</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">状态</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app: Application) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-sm">{app.applicationNo}</td>
                    <td className="p-4 text-sm">{app.customer?.name}</td>
                    <td className="p-4 text-sm">{app.sample?.name}</td>
                    <td className="p-4 text-sm">{app.targetCountry}</td>
                    <td className="p-4">
                      {app.contract ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.contract.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : app.contract.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {app.contract.status === 'approved' ? '已通过' : app.contract.status === 'rejected' ? '已驳回' : '待审核'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4"><StatusBadge status={app.status} /></td>
                    <td className="p-4">
                      {app.status === 'pending_legal_review' ? (
                        <div className="flex gap-2">
                          <a href={`/legal/applications/${app.id}/contract`} className="text-sm text-primary-500 hover:underline">
                            合同
                          </a>
                          <span className="text-slate-300">|</span>
                          <a href={`/legal/applications/${app.id}/compliance`} className="text-sm text-primary-500 hover:underline">
                            审核
                          </a>
                        </div>
                      ) : app.contract ? (
                        <a href={`/legal/applications/${app.id}/contract`} className="text-sm text-primary-500 hover:underline">
                          查看合同
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
