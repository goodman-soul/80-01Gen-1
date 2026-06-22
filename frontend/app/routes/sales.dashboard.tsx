import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { ClipboardList, Clock, CheckCircle, XCircle, User, MapPin } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { StatCard } from '~/components/StatCard';
import { StatusBadge } from '~/components/StatusBadge';
import { Application, User as UserType } from '~/lib/types';

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

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';
  const formData = await request.formData();
  const applicationId = formData.get('applicationId') as string;
  const approved = formData.get('approved') === 'true';
  const comment = formData.get('comment') as string;
  const cookie = request.headers.get('Cookie') || '';

  await fetch(`${apiUrl}/api/applications/${applicationId}/sales-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    credentials: 'include',
    body: JSON.stringify({ approved, comment }),
  });

  return redirect('/sales/dashboard');
}

export default function SalesDashboard() {
  const { user, applications } = useLoaderData<typeof loader>();

  const pendingReview = applications.filter((a: Application) => a.status === 'pending_sales_review');
  
  const stats = {
    total: applications.length,
    pending: pendingReview.length,
    approved: applications.filter((a: Application) => 
      ['approved', 'pending_shipment', 'shipped', 'in_testing', 'pending_return', 'returning', 'completed'].includes(a.status)
    ).length,
    rejected: applications.filter((a: Application) => 
      ['sales_rejected', 'legal_rejected'].includes(a.status)
    ).length,
  };

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">销售审核</h1>
          <p className="text-slate-500 mt-1">审核客户的样机申请</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="全部申请" value={stats.total} icon={ClipboardList} />
          <StatCard title="待审核" value={stats.pending} icon={Clock} color="warning" />
          <StatCard title="已通过" value={stats.approved} icon={CheckCircle} color="success" />
          <StatCard title="已驳回" value={stats.rejected} icon={XCircle} color="danger" />
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">待审核申请</h2>
          {pendingReview.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
              <p className="text-slate-500">暂无待审核的申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReview.map((app: Application) => (
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

                  <Form method="post" className="flex gap-3">
                    <input type="hidden" name="applicationId" value={app.id} />
                    <div className="flex-1">
                      <input
                        type="text"
                        name="comment"
                        className="input"
                        placeholder="审核意见（可选）"
                      />
                    </div>
                    <button
                      type="submit"
                      name="approved"
                      value="false"
                      className="btn-danger"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      驳回
                    </button>
                    <button
                      type="submit"
                      name="approved"
                      value="true"
                      className="btn-success"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      通过
                    </button>
                  </Form>
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
                    <td className="p-4"><StatusBadge status={app.status} /></td>
                    <td className="p-4">
                      {app.status === 'pending_sales_review' ? (
                        <span className="text-sm text-primary-500">待审核</span>
                      ) : (
                        <a href={`/sales/applications/${app.id}/review`} className="text-sm text-primary-500 hover:underline">
                          查看
                        </a>
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
