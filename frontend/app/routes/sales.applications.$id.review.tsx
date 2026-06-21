import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, Form, Link } from '@remix-run/react';
import { ArrowLeft, CheckCircle, XCircle, MapPin, Calendar, Package, User, FileText } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { StatusBadge } from '~/components/StatusBadge';
import { Timeline } from '~/components/Timeline';
import { Application, User as UserType } from '~/lib/types';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  const [userRes, appRes] = await Promise.all([
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
    fetch(`${apiUrl}/api/applications/${params.id}`, {
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
  const formData = await request.formData();
  const approved = formData.get('approved') === 'true';
  const comment = formData.get('comment') as string;
  const cookie = request.headers.get('Cookie') || '';

  await fetch(`${apiUrl}/api/applications/${params.id}/sales-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    credentials: 'include',
    body: JSON.stringify({ approved, comment }),
  });

  return redirect('/sales/dashboard');
}

export default function SalesReview() {
  const { user, application } = useLoaderData<typeof loader>();
  const canReview = application.status === 'pending_sales_review';

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
        <Link to="/sales/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Link>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{application.applicationNo}</h1>
              <p className="text-slate-500 mt-1">
                创建于 {new Date(application.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                客户信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">客户名称</p>
                  <p className="font-medium">{application.customer?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">公司</p>
                  <p className="font-medium">{application.customer?.company || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">邮箱</p>
                  <p className="font-medium">{application.customer?.email}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                申请信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">目标国家</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {application.targetCountry}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">预计归还日期</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(application.expectedReturnDate).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 mb-2">测试用途</p>
                  <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{application.testPurpose}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" />
                样机信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">样机名称</p>
                  <p className="font-medium">{application.sample?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">型号</p>
                  <p className="font-medium">{application.sample?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">序列号</p>
                  <p className="font-mono">{application.sample?.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">设备价值</p>
                  <p className="font-mono font-semibold">¥{Number(application.sample?.value).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">押金金额</p>
                  <p className="font-mono font-semibold text-primary-500">¥{Number(application.sample?.depositAmount).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {application.contract && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  合同预览
                </h2>
                <pre className="bg-slate-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {application.contract.content}
                </pre>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">流程进度</h2>
              <Timeline currentStatus={application.status} createdAt={application.createdAt} />
            </div>

            {canReview && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">销售审核</h2>
                <Form method="post" className="space-y-4">
                  <div>
                    <label className="label">审核意见</label>
                    <textarea
                      name="comment"
                      className="input min-h-[100px]"
                      placeholder="请输入审核意见（可选）"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" name="approved" value="false" className="btn-danger flex-1">
                      <XCircle className="w-4 h-4 mr-2" />
                      驳回申请
                    </button>
                    <button type="submit" name="approved" value="true" className="btn-success flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      通过审核
                    </button>
                  </div>
                </Form>
              </div>
            )}

            {!canReview && application.salesReviewer && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">审核结果</h2>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium">审核人: {application.salesReviewer.name}</p>
                  {application.salesReviewComment && (
                    <p className="text-sm text-slate-600 mt-2">
                      意见: {application.salesReviewComment}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
