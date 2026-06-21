import { useState } from 'react';
import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Form, useNavigation } from '@remix-run/react';
import { Package, Plus, Edit2, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { Sample, User } from '~/lib/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  const [userRes, samplesRes] = await Promise.all([
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
    fetch(`${apiUrl}/api/samples`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
  ]);

  if (!userRes.ok) throw new Response('Unauthorized', { status: 401 });
  
  const user = await userRes.json();
  const samples = await samplesRes.json();

  return json({ user, samples });
}

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  const formData = await request.formData();
  const cookie = request.headers.get('Cookie') || '';

  const data = {
    name: formData.get('name') as string,
    model: formData.get('model') as string,
    serialNumber: formData.get('serialNumber') as string,
    description: formData.get('description') as string,
    value: Number(formData.get('value')),
    depositAmount: Number(formData.get('depositAmount')),
  };

  await fetch(`${apiUrl}/api/samples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return redirect('/sales/samples');
}

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  available: { label: '可用', class: 'badge-success', icon: CheckCircle },
  borrowed: { label: '借出中', class: 'badge-warning', icon: Package },
  maintenance: { label: '维修中', class: 'badge-danger', icon: Wrench },
};

export default function SamplesManagement() {
  const { user, samples } = useLoaderData<typeof loader>();
  const [showForm, setShowForm] = useState(false);
  const navigation = useNavigation();

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">样机管理</h1>
            <p className="text-slate-500 mt-1">管理可出借的样机设备</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            添加样机
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-8 animate-slide-up">
            <h2 className="text-lg font-semibold mb-4">添加新样机</h2>
            <Form method="post" className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">样机名称</label>
                <input type="text" name="name" className="input" required placeholder="例如：智能路由器 Pro" />
              </div>
              <div>
                <label className="label">型号</label>
                <input type="text" name="model" className="input" required placeholder="例如：RT-Pro-2024" />
              </div>
              <div>
                <label className="label">序列号</label>
                <input type="text" name="serialNumber" className="input" required placeholder="例如：SN001" />
              </div>
              <div>
                <label className="label">设备价值 (元)</label>
                <input type="number" name="value" className="input" required placeholder="5000" />
              </div>
              <div>
                <label className="label">押金金额 (元)</label>
                <input type="number" name="depositAmount" className="input" required placeholder="5000" />
              </div>
              <div className="col-span-2">
                <label className="label">描述</label>
                <textarea name="description" className="input" rows={2} placeholder="设备功能描述..." />
              </div>
              <div className="col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={navigation.state === 'submitting'}>
                  {navigation.state === 'submitting' ? '添加中...' : '添加样机'}
                </button>
              </div>
            </Form>
          </div>
        )}

        <div className="grid gap-4">
          {samples.map((sample: Sample & { _count?: { applications: number } }) => {
            const config = statusConfig[sample.status] || statusConfig.available;
            const Icon = config.icon;
            return (
              <div key={sample.id} className="card-hover p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-7 h-7 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{sample.name}</h3>
                      <p className="text-sm text-slate-500">
                        {sample.model} · SN: {sample.serialNumber}
                      </p>
                      {sample.description && (
                        <p className="text-sm text-slate-500 mt-2">{sample.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={config.class}>
                      <Icon className="w-3 h-3 mr-1 inline" />
                      {config.label}
                    </span>
                    <p className="mt-2 font-mono font-semibold text-slate-900">
                      ¥{Number(sample.value).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">押金: ¥{Number(sample.depositAmount).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      已借用 {sample._count?.applications || 0} 次
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
