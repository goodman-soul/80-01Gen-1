import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { ClipboardList, Clock, CheckCircle, FilePlus, AlertCircle } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { StatCard } from '~/components/StatCard';
import { ApplicationCard } from '~/components/ApplicationCard';
import { Application, User } from '~/lib/types';

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

export default function CustomerDashboard() {
  const { user, applications } = useLoaderData<typeof loader>();

  const stats = {
    total: applications.length,
    pending: applications.filter((a: Application) => 
      ['pending_sales_review', 'pending_legal_review', 'pending_shipment'].includes(a.status)
    ).length,
    active: applications.filter((a: Application) => 
      ['shipped', 'in_testing', 'pending_return', 'returning'].includes(a.status)
    ).length,
    completed: applications.filter((a: Application) => a.status === 'completed').length,
  };

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">我的申请</h1>
            <p className="text-slate-500 mt-1">管理您的样机申请和追踪进度</p>
          </div>
          <Link to="/customer/applications/new" className="btn-primary">
            <FilePlus className="w-4 h-4 mr-2" />
            新建申请
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="全部申请" value={stats.total} icon={ClipboardList} />
          <StatCard title="待处理" value={stats.pending} icon={Clock} color="warning" />
          <StatCard title="进行中" value={stats.active} icon={AlertCircle} color="default" />
          <StatCard title="已完成" value={stats.completed} icon={CheckCircle} color="success" />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">申请列表</h2>
          {applications.length === 0 ? (
            <div className="card p-12 text-center">
              <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">还没有申请记录</p>
              <Link to="/customer/applications/new" className="btn-primary">
                提交第一个申请
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app: Application) => (
                <ApplicationCard key={app.id} application={app} userRole="customer" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
