import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { ArrowLeft, ArrowDownLeft, Package, User, MapPin, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
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
  const condition = formData.get('condition') as 'good' | 'damaged' | 'missing_parts';
  const description = formData.get('description') as string;
  const hasDamage = formData.get('hasDamage') === 'true';
  const damageDescription = formData.get('damageDescription') as string;
  const cookie = request.headers.get('Cookie') || '';

  const response = await fetch(`${apiUrl}/api/applications/${id}/inspect-return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    credentials: 'include',
    body: JSON.stringify({ condition, description, hasDamage, damageDescription }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '验收失败' }));
    return json({ error: error.error }, { status: 400 });
  }

  return redirect('/warehouse/dashboard');
}

export default function WarehouseReturn() {
  const { user, application } = useLoaderData<typeof loader>();
  const app = application as Application;
  const [hasDamage, setHasDamage] = useState(false);
  const [condition, setCondition] = useState<'good' | 'damaged' | 'missing_parts'>('good');

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="mb-6">
          <a href="/warehouse/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回仓库管理
          </a>
          <h1 className="text-2xl font-bold text-slate-900">样机归还验收</h1>
          <p className="text-slate-500 mt-1">检查样机状况并完成验收</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">申请信息</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">申请编号</p>
                  <span className="font-mono font-semibold">{app.applicationNo}</span>
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

            {app.feedback && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">客户试用反馈</h2>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-slate-500">测试结果：</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.feedback.testResult === 'pass' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : app.feedback.testResult === 'fail'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {app.feedback.testResult === 'pass' ? '通过' : app.feedback.testResult === 'fail' ? '未通过' : '部分通过'}
                    </span>
                  </div>
                  <p className="text-slate-700">{app.feedback.content}</p>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">归还检查</h2>
              
              <Form method="post" className="space-y-6">
                <input type="hidden" name="hasDamage" value={hasDamage.toString()} />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    样机整体状况
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <label className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      condition === 'good' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="condition"
                        value="good"
                        checked={condition === 'good'}
                        onChange={() => setCondition('good')}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${condition === 'good' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <p className={`font-medium ${condition === 'good' ? 'text-emerald-700' : 'text-slate-700'}`}>完好</p>
                        <p className="text-xs text-slate-500 mt-1">无损坏，配件齐全</p>
                      </div>
                    </label>

                    <label className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      condition === 'damaged' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="condition"
                        value="damaged"
                        checked={condition === 'damaged'}
                        onChange={() => {
                          setCondition('damaged');
                          setHasDamage(true);
                        }}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${condition === 'damaged' ? 'text-amber-500' : 'text-slate-400'}`} />
                        <p className={`font-medium ${condition === 'damaged' ? 'text-amber-700' : 'text-slate-700'}`}>有损坏</p>
                        <p className="text-xs text-slate-500 mt-1">外观或功能损坏</p>
                      </div>
                    </label>

                    <label className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      condition === 'missing_parts' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="condition"
                        value="missing_parts"
                        checked={condition === 'missing_parts'}
                        onChange={() => {
                          setCondition('missing_parts');
                          setHasDamage(true);
                        }}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <XCircle className={`w-8 h-8 mx-auto mb-2 ${condition === 'missing_parts' ? 'text-red-500' : 'text-slate-400'}`} />
                        <p className={`font-medium ${condition === 'missing_parts' ? 'text-red-700' : 'text-slate-700'}`}>配件缺失</p>
                        <p className="text-xs text-slate-500 mt-1">配件不齐全</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    检查描述
                  </label>
                  <textarea
                    name="description"
                    className="input min-h-[100px]"
                    placeholder="请详细描述样机归还时的状况..."
                    required
                  />
                </div>

                {hasDamage && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      损坏详情
                    </label>
                    <textarea
                      name="damageDescription"
                      className="input min-h-[80px] bg-white"
                      placeholder="请详细描述损坏情况，包括位置、程度等..."
                      required={hasDamage}
                    />
                    <p className="text-xs text-amber-600 mt-2">
                      注意：如有损坏或配件缺失，押金将根据情况进行扣除
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <a href="/warehouse/dashboard" className="btn flex-1 justify-center">
                    取消
                  </a>
                  <button type="submit" className="btn-success flex-1 justify-center">
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    完成验收
                  </button>
                </div>
              </Form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">押金信息</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">押金金额</span>
                  <span className="font-mono font-semibold text-lg">¥{Number(app.deposit?.amount || 0).toLocaleString()}</span>
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
              {hasDamage && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs text-amber-700">
                    <strong>提示：</strong>由于样机存在损坏/配件缺失，系统将自动扣除部分或全部押金
                  </p>
                </div>
              )}
            </div>

            <div className="card p-6 bg-primary-50 border-primary-100">
              <h3 className="font-semibold text-primary-900 mb-2">归还检查清单</h3>
              <ul className="space-y-2 text-sm text-primary-800">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <span>核对样机序列号是否一致</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <span>检查外观是否有划痕、磕碰</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <span>开机检查功能是否正常</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">4</span>
                  <span>核对配件是否齐全</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">5</span>
                  <span>拍照留底，记录损坏情况</span>
                </li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">时间线</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">借出日期</span>
                  <span>{new Date(app.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">预计归还</span>
                  <span>{new Date(app.expectedReturnDate).toLocaleDateString('zh-CN')}</span>
                </div>
                {app.actualReturnDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">实际归还</span>
                    <span>{new Date(app.actualReturnDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
