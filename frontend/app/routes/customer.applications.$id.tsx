import { useState } from 'react';
import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, useNavigation, Form } from '@remix-run/react';
import { MapPin, Calendar, Package, User, FileText, Truck, CreditCard, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
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
  const action = formData.get('action') as string;
  const cookie = request.headers.get('Cookie') || '';

  const endpoint = {
    confirmDelivery: 'confirm-delivery',
    payDeposit: null,
    submitFeedback: 'feedback',
    initiateReturn: 'initiate-return',
    confirmReturnShip: 'confirm-return-ship',
  }[action];

  if (action === 'payDeposit') {
    const depositId = formData.get('depositId') as string;
    await fetch(`${apiUrl}/api/deposits/${depositId}/pay`, {
      method: 'POST',
      headers: { Cookie: cookie },
      credentials: 'include',
    });
  } else if (action === 'submitFeedback') {
    const content = formData.get('content') as string;
    const testResult = formData.get('testResult') as string;
    await fetch(`${apiUrl}/api/applications/${params.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      credentials: 'include',
      body: JSON.stringify({ content, testResult }),
    });
  } else if (action === 'confirmReturnShip') {
    const courier = formData.get('courier') as string;
    const trackingNo = formData.get('trackingNo') as string;
    await fetch(`${apiUrl}/api/applications/${params.id}/confirm-return-ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      credentials: 'include',
      body: JSON.stringify({ courier, trackingNo }),
    });
  } else if (endpoint) {
    await fetch(`${apiUrl}/api/applications/${params.id}/${endpoint}`, {
      method: 'POST',
      headers: { Cookie: cookie },
      credentials: 'include',
    });
  }

  return redirect(`/customer/applications/${params.id}`);
}

export default function ApplicationDetail() {
  const { user, application } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const canConfirmDelivery = application.status === 'shipped' && !application.logistics?.[0]?.deliveredAt;
  const canPayDeposit = application.deposit?.status === 'pending';
  const canSubmitFeedback = application.status === 'in_testing' && !application.feedback;
  const canInitiateReturn = application.status === 'in_testing' && !!application.feedback;
  const canConfirmReturnShip = application.status === 'pending_return';

  return (
    <Layout user={user}>
      <div className="animate-fade-in">
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
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-500" />
                物流信息
              </h2>
              {application.logistics && application.logistics.length > 0 ? (
                <div className="space-y-4">
                  {application.logistics.map((log: any) => (
                    <div key={log.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge-info">{log.type === 'outbound' ? '发货' : '归还'}</span>
                        <span className="text-sm text-slate-500">{log.courier}</span>
                      </div>
                      <p className="font-mono text-sm">运单号: {log.trackingNo}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        状态: {log.status === 'shipped' ? '运输中' : '已签收'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">暂无物流信息</p>
              )}
            </div>

            {application.feedback && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-500" />
                  试用反馈
                </h2>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge ${
                      application.feedback.testResult === 'pass' ? 'badge-success' :
                      application.feedback.testResult === 'fail' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {application.feedback.testResult === 'pass' ? '测试通过' :
                       application.feedback.testResult === 'fail' ? '测试未通过' : '部分通过'}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(application.feedback.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-slate-700">{application.feedback.content}</p>
                </div>
              </div>
            )}

            {application.returnInspection && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-500" />
                  归还检查报告
                </h2>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge ${
                      application.returnInspection.condition === 'good' ? 'badge-success' :
                      application.returnInspection.condition === 'damaged' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {application.returnInspection.condition === 'good' ? '完好' :
                       application.returnInspection.condition === 'damaged' ? '损坏' : '配件缺失'}
                    </span>
                    <span className="text-sm text-slate-400">
                      检查员: {application.returnInspection.inspector?.name}
                    </span>
                  </div>
                  <p className="text-slate-700">{application.returnInspection.description}</p>
                  {application.returnInspection.hasDamage && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm">
                        损坏说明: {application.returnInspection.damageDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {application.contract && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  合同信息
                </h2>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${
                      application.contract.status === 'approved' ? 'badge-success' :
                      application.contract.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {application.contract.status === 'approved' ? '已审核' :
                       application.contract.status === 'rejected' ? '已驳回' : '待审核'}
                    </span>
                    {application.contract.signedAt && (
                      <span className="text-sm text-slate-400">
                        签署日期: {new Date(application.contract.signedAt).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                审核记录
              </h2>
              <div className="space-y-4">
                {application.salesReviewer && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium">销售审核: {application.salesReviewer.name}</p>
                    {application.salesReviewComment && (
                      <p className="text-sm text-slate-600 mt-1">意见: {application.salesReviewComment}</p>
                    )}
                  </div>
                )}
                {application.legalReviewer && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium">合规审核: {application.legalReviewer.name}</p>
                    {application.legalReviewComment && (
                      <p className="text-sm text-slate-600 mt-1">意见: {application.legalReviewComment}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">流程进度</h2>
              <Timeline currentStatus={application.status} createdAt={application.createdAt} />
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                押金信息
              </h2>
              {application.deposit ? (
                <div>
                  <p className="text-3xl font-bold text-slate-900 mb-2">
                    ¥{Number(application.deposit.amount).toLocaleString()}
                  </p>
                  <span className={`badge ${
                    application.deposit.status === 'paid' || application.deposit.status === 'refunded' 
                      ? 'badge-success' 
                      : application.deposit.status === 'refunding' || application.deposit.status === 'deducted'
                      ? application.deposit.status === 'deducted' ? 'badge-danger' : 'badge-warning'
                      : 'badge-warning'
                  }`}>
                    {{
                      pending: '待支付',
                      paid: '已支付',
                      refunding: '退款中',
                      refunded: '已退还',
                      deducted: '已扣除',
                    }[application.deposit.status as 'pending' | 'paid' | 'refunding' | 'refunded' | 'deducted']}
                  </span>
                </div>
              ) : (
                <p className="text-slate-400">押金信息待生成</p>
              )}
            </div>

            <div className="card p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-4">可用操作</h2>
              <Form method="post">
                {canPayDeposit && (
                  <input type="hidden" name="depositId" value={application.deposit?.id} />
                )}
                
                {canPayDeposit && (
                  <button type="submit" name="action" value="payDeposit" className="btn-primary w-full mb-3">
                    <CreditCard className="w-4 h-4 mr-2" />
                    支付押金
                  </button>
                )}
                
                {canConfirmDelivery && (
                  <button type="submit" name="action" value="confirmDelivery" className="btn-primary w-full mb-3">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    确认收货
                  </button>
                )}
                
                {canSubmitFeedback && !showFeedbackForm && (
                  <button 
                    type="button" 
                    onClick={() => setShowFeedbackForm(true)}
                    className="btn-secondary w-full mb-3"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    提交试用反馈
                  </button>
                )}
                
                {canInitiateReturn && !showReturnForm && (
                  <button type="submit" name="action" value="initiateReturn" className="btn-secondary w-full mb-3">
                    <Truck className="w-4 h-4 mr-2" />
                    发起归还
                  </button>
                )}
              </Form>

              {showFeedbackForm && (
                <Form method="post" className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <input type="hidden" name="action" value="submitFeedback" />
                  <div>
                    <label className="label">测试结果</label>
                    <select name="testResult" className="input" required>
                      <option value="">请选择</option>
                      <option value="pass">测试通过</option>
                      <option value="partial">部分通过</option>
                      <option value="fail">测试未通过</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">反馈内容</label>
                    <textarea name="content" className="input min-h-[100px]" required placeholder="请详细描述测试结果和发现的问题..." />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">提交反馈</button>
                    <button type="button" onClick={() => setShowFeedbackForm(false)} className="btn-ghost">取消</button>
                  </div>
                </Form>
              )}

              {canConfirmReturnShip && (
                <Form method="post" className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <input type="hidden" name="action" value="confirmReturnShip" />
                  <div>
                    <label className="label">快递公司</label>
                    <input type="text" name="courier" className="input" required placeholder="例如：顺丰、DHL" />
                  </div>
                  <div>
                    <label className="label">运单号</label>
                    <input type="text" name="trackingNo" className="input" required placeholder="请输入运单号" />
                  </div>
                  <button type="submit" className="btn-primary w-full">确认已寄出</button>
                </Form>
              )}

              {!canPayDeposit && !canConfirmDelivery && !canSubmitFeedback && !canInitiateReturn && !canConfirmReturnShip && (
                <p className="text-sm text-slate-400 text-center py-2">暂无可执行操作</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
