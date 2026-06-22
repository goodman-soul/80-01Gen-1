import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { ArrowLeft, ArrowUpRight, Package, User, MapPin, Calendar, Truck, Hash } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { StatusBadge } from '~/components/StatusBadge';
import { Application } from '~/lib/types';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';
  const { id } = params;

  const [userRes, appRes] = await Promise.all([
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
    fetch(`${apiUrl}/api/applications/${id}`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
  ]);

  if (!userRes.ok) throw new Response('Unauthorized', { status: 401 });
  if (!appRes.ok) throw new Response('Not Found', { status: 404 });

  const user = await userRes.json();
  const application = await appRes.json();

  return json({ user, application });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';
  const { id } = params;
  const formData = await request.formData();
  const courier = formData.get('courier') as string;
  const trackingNo = formData.get('trackingNo') as string;
  const cookie = request.headers.get('Cookie') || '';

  const response = await fetch(`${apiUrl}/api/applications/${id}/ship`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    credentials: 'include',
    body: JSON.stringify({ courier, trackingNo }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '发货失败' }));
    return json({ error: error.error }, { status: 400 });
  }

  return redirect('/warehouse/dashboard');
}

export default function WarehouseShip() {
  const { user, application } = useLoaderData<typeof loader>();
  const app = application as Application;

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="mb-6">
          <a href="/warehouse/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回仓库管理
          </a>
          <h1 className="text-2xl font-bold text-slate-900">样机出库发货</h1>
          <p className="text-slate-500 mt-1">录入物流信息并确认发货</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">申请信息</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">申请编号</p>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="font-mono font-semibold">{app.applicationNo}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">当前状态</p>
                  <StatusBadge status={app.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">客户</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{app.customer?.name}</span>
                    {app.customer?.company && (
                      <span className="text-slate-400">({app.customer.company})</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">目的地国家</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{app.targetCountry}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">测试用途</p>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700">{app.testPurpose}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">样机信息</h2>
              
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-10 h-10 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{app.sample?.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{app.sample?.model}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-slate-500">序列号</p>
                      <p className="font-mono">{app.sample?.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">价值</p>
                      <p className="font-mono">¥{Number(app.sample?.value || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">物流信息</h2>
              
              <Form method="post" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Truck className="w-4 h-4 inline mr-1" />
                    物流公司
                  </label>
                  <select name="courier" className="input" required>
                    <option value="">请选择物流公司</option>
                    <option value="DHL">DHL</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="顺丰国际">顺丰国际</option>
                    <option value="EMS">EMS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    物流单号
                  </label>
                  <input
                    type="text"
                    name="trackingNo"
                    className="input"
                    placeholder="请输入物流单号"
                    required
                  />
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-700">
                    <strong>注意：</strong>请仔细核对样机信息和物流信息，确认无误后再点击发货。发货后状态将自动更新为"已发货"。
                  </p>
                </div>

                <div className="flex gap-4">
                  <a href="/warehouse/dashboard" className="btn flex-1 justify-center">
                    取消
                  </a>
                  <button type="submit" className="btn-success flex-1 justify-center">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    确认发货
                  </button>
                </div>
              </Form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">重要信息</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">预计归还日期</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(app.expectedReturnDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">押金金额</span>
                  <span className="font-mono font-semibold">¥{Number(app.deposit?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">押金状态</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    app.deposit?.status === 'paid' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {app.deposit?.status === 'paid' ? '已支付' : '待支付'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-primary-50 border-primary-100">
              <h3 className="font-semibold text-primary-900 mb-2">出库检查清单</h3>
              <ul className="space-y-2 text-sm text-primary-800">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <span>核对样机序列号与申请单一致</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <span>检查样机外观是否完好</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <span>确认配件齐全（充电器、数据线等）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">4</span>
                  <span>妥善包装，填写运单信息</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">5</span>
                  <span>拍照留底，录入物流单号</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
