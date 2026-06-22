import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { ArrowLeft, FileText, User, MapPin, Calendar, Package, Printer, Download } from 'lucide-react';
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

export default function LegalContract() {
  const { user, application } = useLoaderData<typeof loader>();
  const app = application as Application;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <div className="mb-6">
          <a href="/legal/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回合同审核
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">合同详情</h1>
              <p className="text-slate-500 mt-1">样机借用合同</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePrint} className="btn">
                <Printer className="w-4 h-4 mr-2" />
                打印
              </button>
              <button className="btn">
                <Download className="w-4 h-4 mr-2" />
                下载
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">合同状态</h2>
                <StatusBadge status={app.status} />
              </div>

              {app.contract && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-500">合同状态：</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      app.contract.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : app.contract.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {app.contract.status === 'approved' ? '已通过' : app.contract.status === 'rejected' ? '已驳回' : '待审核'}
                    </span>
                  </div>
                  {app.contract.signedAt && (
                    <p className="text-sm text-slate-500">
                      签署日期：{new Date(app.contract.signedAt).toLocaleDateString('zh-CN')}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">申请编号</p>
                  <p className="font-mono font-semibold">{app.applicationNo}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">签署日期</p>
                  <p>{new Date(app.createdAt).toLocaleDateString('zh-CN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">甲方（出借方）</p>
                  <p className="font-medium">公司名称</p>
                  <p className="text-slate-500">地址：中国</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">乙方（借入方）</p>
                  <p className="font-medium">{app.customer?.name}</p>
                  {app.customer?.company && (
                    <p className="text-slate-500">{app.customer.company}</p>
                  )}
                  {app.customer?.phone && (
                    <p className="text-slate-500">联系电话：{app.customer.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                <FileText className="w-5 h-5 inline mr-2" />
                合同内容
              </h2>
              
              <div className="prose prose-sm max-w-none bg-slate-50 p-6 rounded-lg border border-slate-200">
                {app.contract?.content ? (
                  <div className="whitespace-pre-wrap font-mono text-sm text-slate-700">
                    {app.contract.content}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>合同正在生成中...</p>
                  </div>
                )}
              </div>
            </div>

            {app.status === 'pending_legal_review' && (
              <div className="flex gap-4">
                <a href={`/legal/applications/${app.id}/compliance`} className="btn-primary flex-1 justify-center">
                  前往合规审核
                </a>
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
                <div className="flex justify-between">
                  <span className="text-slate-500">押金</span>
                  <span className="font-mono">¥{Number(app.deposit?.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">借用信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">客户：</span>
                  <span>{app.customer?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">目的地：</span>
                  <span>{app.targetCountry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">借期：</span>
                  <span>{new Date(app.createdAt).toLocaleDateString('zh-CN')} ~ {new Date(app.expectedReturnDate).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-primary-50 border-primary-100">
              <h3 className="font-semibold text-primary-900 mb-2">合同要点</h3>
              <ul className="space-y-2 text-sm text-primary-800">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>乙方应妥善保管样机，不得转借、转租、抵押</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>乙方应按约定用途使用，不得用于军事、核生化等敏感领域</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>乙方应遵守出口管制和目的地国家法律法规</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>乙方应按期归还，逾期将产生额外费用</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>如有损坏或丢失，乙方应照价赔偿</span>
                </li>
              </ul>
            </div>

            {app.salesReviewComment && (
              <div className="card p-6 bg-blue-50 border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">销售审核意见</h3>
                <p className="text-sm text-blue-800">{app.salesReviewComment}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
