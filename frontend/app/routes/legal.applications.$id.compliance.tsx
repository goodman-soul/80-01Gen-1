import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { ArrowLeft, ShieldAlert, User, MapPin, Calendar, Package, AlertTriangle, CheckCircle, XCircle, FileCheck } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { StatusBadge } from '~/components/StatusBadge';
import { Application } from '~/lib/types';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
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
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  const { id } = params;
  const formData = await request.formData();
  const approved = formData.get('approved') === 'true';
  const comment = formData.get('comment') as string;
  const cookie = request.headers.get('Cookie') || '';

  const response = await fetch(`${apiUrl}/api/applications/${id}/legal-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    credentials: 'include',
    body: JSON.stringify({ approved, comment }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '审核失败' }));
    return json({ error: error.error }, { status: 400 });
  }

  return redirect('/legal/dashboard');
}

const highRiskCountries = ['朝鲜', '伊朗', '叙利亚', '古巴', '委内瑞拉', '阿富汗', '伊拉克', '利比亚', '索马里', '也门', '南苏丹', '厄立特里亚'];
const sensitiveUses = ['军事', '武器', '核', '生化', '导弹', '航天', '雷达', '加密', '监听', '侦察'];

export default function LegalCompliance() {
  const { user, application } = useLoaderData<typeof loader>();
  const app = application as Application;

  const isHighRiskCountry = highRiskCountries.some(c => app.targetCountry.includes(c));
  const hasSensitiveUse = sensitiveUses.some(u => app.testPurpose.toLowerCase().includes(u.toLowerCase()));
  const complianceRisks = [];
  
  if (isHighRiskCountry) {
    complianceRisks.push({ type: 'danger', message: `目的地国家 "${app.targetCountry}" 属于高风险国家/受制裁地区，需要特别审批` });
  }
  if (hasSensitiveUse) {
    complianceRisks.push({ type: 'danger', message: '测试用途涉及敏感领域，需要进行出口管制合规审查' });
  }
  if (complianceRisks.length === 0) {
    complianceRisks.push({ type: 'success', message: '初步合规检查通过，未发现明显风险' });
  }

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="mb-6">
          <a href="/legal/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回合同审核
          </a>
          <h1 className="text-2xl font-bold text-slate-900">合规审核</h1>
          <p className="text-slate-500 mt-1">审核出口合规和合同内容</p>
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
                    {app.customer?.company && (
                      <span className="text-slate-400">({app.customer.company})</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">目的地国家</p>
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${isHighRiskCountry ? 'text-red-500' : 'text-slate-400'}`} />
                    <span className={isHighRiskCountry ? 'text-red-600 font-medium' : ''}>{app.targetCountry}</span>
                    {isHighRiskCountry && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">高风险</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">测试用途</p>
                <div className={`p-4 rounded-lg border ${hasSensitiveUse ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={hasSensitiveUse ? 'text-red-700' : 'text-slate-700'}>{app.testPurpose}</p>
                  {hasSensitiveUse && (
                    <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">包含敏感关键词，请仔细审查</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                <ShieldAlert className="w-5 h-5 inline mr-2" />
                合规风险评估
              </h2>
              
              <div className="space-y-3 mb-6">
                {complianceRisks.map((risk, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      risk.type === 'danger'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {risk.type === 'danger' ? (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={risk.type === 'danger' ? 'text-red-700' : 'text-emerald-700'}>
                        {risk.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 mb-1">出口管制检查</p>
                  <p className={isHighRiskCountry ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
                    {isHighRiskCountry ? '需要额外审批' : '正常'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 mb-1">最终用途审查</p>
                  <p className={hasSensitiveUse ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
                    {hasSensitiveUse ? '需要详细审查' : '正常'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                <FileCheck className="w-5 h-5 inline mr-2" />
                合同审核
              </h2>
              
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                <p className="text-sm text-slate-500 mb-2">合同状态</p>
                {app.contract ? (
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      app.contract.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : app.contract.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {app.contract.status === 'approved' ? '已通过' : app.contract.status === 'rejected' ? '已驳回' : '待审核'}
                    </span>
                    <a
                      href={`/legal/applications/${app.id}/contract`}
                      className="text-sm text-primary-500 hover:underline"
                      target="_blank"
                    >
                      查看完整合同 →
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-400">合同未生成</span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">押金金额</span>
                  <span className="font-mono font-semibold">¥{Number(app.deposit?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">样机价值</span>
                  <span className="font-mono">¥{Number(app.sample?.value || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">借用期限</span>
                  <span>{new Date(app.expectedReturnDate).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>

            {app.salesReviewComment && (
              <div className="card p-6 bg-blue-50 border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">销售审核意见</h3>
                <p className="text-sm text-blue-800">{app.salesReviewComment}</p>
              </div>
            )}

            {app.status === 'pending_legal_review' && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">审核操作</h2>
                
                <Form method="post" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      审核意见
                    </label>
                    <textarea
                      name="comment"
                      className="input min-h-[100px]"
                      placeholder="请输入合规审核意见..."
                    />
                  </div>

                  {complianceRisks.some(r => r.type === 'danger') && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-800 font-medium">存在合规风险</p>
                          <p className="text-sm text-amber-700 mt-1">
                            本次申请存在合规风险，请谨慎评估。如通过审核，请在审核意见中说明风险控制措施。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <a href="/legal/dashboard" className="btn flex-1 justify-center">
                      取消
                    </a>
                    <button
                      type="submit"
                      name="approved"
                      value="false"
                      className="btn-danger flex-1 justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      驳回
                    </button>
                    <button
                      type="submit"
                      name="approved"
                      value="true"
                      className="btn-success flex-1 justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      通过
                    </button>
                  </div>
                </Form>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">样机信息</h3>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium">{app.sample?.name}</p>
                  <p className="text-sm text-slate-500">{app.sample?.model}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">序列号</span>
                  <span className="font-mono">{app.sample?.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">价值</span>
                  <span className="font-mono">¥{Number(app.sample?.value || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-primary-50 border-primary-100">
              <h3 className="font-semibold text-primary-900 mb-3">合规检查清单</h3>
              <ul className="space-y-2 text-sm text-primary-800">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <span>核实客户身份和背景信息</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <span>检查目的地国家是否受制裁</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <span>评估最终用途是否涉及敏感领域</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">4</span>
                  <span>确认产品是否需要出口许可证</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">5</span>
                  <span>审核合同条款的合规性</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0 text-xs">6</span>
                  <span>确认押金金额覆盖风险</span>
                </li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">时间线</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">申请日期</span>
                  <span>{new Date(app.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">预计归还</span>
                  <span>{new Date(app.expectedReturnDate).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
