import { useState } from 'react';
import { LoaderFunctionArgs, json, redirect, TypedResponse } from '@remix-run/node';
import { useLoaderData, useNavigation, Form, useActionData } from '@remix-run/react';
import { ArrowRight, ArrowLeft, Package, MapPin, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { Layout } from '~/components/Layout';
import { Sample, User } from '~/lib/types';

type Step1Data = { step: 1 };
type Step2Data = { step: 2; sampleId: string };
type Step3Data = { step: 3; sampleId: string; targetCountry: string; testPurpose: string; expectedReturnDate: string };
type ActionData = Step1Data | Step2Data | Step3Data;

export async function loader({ request }: LoaderFunctionArgs) {
  const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';
  
  const [userRes, samplesRes] = await Promise.all([
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
    fetch(`${apiUrl}/api/samples/available`, {
      headers: { Cookie: request.headers.get('Cookie') || '' },
      credentials: 'include',
    }),
  ]);

  if (!userRes.ok) throw new Response('Unauthorized', { status: 401 });
  
  const user = await userRes.json();
  const samples = await samplesRes.json();

  return json({ user, samples });
}

export async function action({ request }: LoaderFunctionArgs): Promise<TypedResponse<ActionData> | Response> {
  const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';
  const formData = await request.formData();
  const step = Number(formData.get('step'));
  const cookie = request.headers.get('Cookie') || '';

  if (step === 1) {
    const sampleId = formData.get('sampleId') as string;
    return json({ step: 2, sampleId } as Step2Data);
  }

  if (step === 2) {
    const sampleId = formData.get('sampleId') as string;
    const targetCountry = formData.get('targetCountry') as string;
    const testPurpose = formData.get('testPurpose') as string;
    const expectedReturnDate = formData.get('expectedReturnDate') as string;
    return json({ step: 3, sampleId, targetCountry, testPurpose, expectedReturnDate } as Step3Data);
  }

  if (step === 3) {
    const sampleId = formData.get('sampleId') as string;
    const targetCountry = formData.get('targetCountry') as string;
    const testPurpose = formData.get('testPurpose') as string;
    const expectedReturnDate = formData.get('expectedReturnDate') as string;

    const createRes = await fetch(`${apiUrl}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      credentials: 'include',
      body: JSON.stringify({ sampleId, targetCountry, testPurpose, expectedReturnDate }),
    });

    const application = await createRes.json();

    if (formData.get('submitNow') === 'true') {
      await fetch(`${apiUrl}/api/applications/${application.id}/submit`, {
        method: 'POST',
        headers: { Cookie: cookie },
        credentials: 'include',
      });
    }

    return redirect('/customer/dashboard');
  }

  return json({ step: 1 } as Step1Data);
}

export default function NewApplication() {
  const { user, samples } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const currentStep = actionData?.step || 1;

  const [formData, setFormData] = useState({
    sampleId: (actionData as Step2Data | Step3Data)?.sampleId || '',
    targetCountry: (actionData as Step3Data)?.targetCountry || '',
    testPurpose: (actionData as Step3Data)?.testPurpose || '',
    expectedReturnDate: (actionData as Step3Data)?.expectedReturnDate || '',
  });

  const selectedSample = samples.find((s: Sample) => s.id === formData.sampleId);

  const steps = [
    { num: 1, title: '选择样机', icon: Package },
    { num: 2, title: '填写信息', icon: FileText },
    { num: 3, title: '确认提交', icon: CheckCircle2 },
  ];

  return (
    <Layout user={user}>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">新建样机申请</h1>

        <div className="flex items-center justify-center mb-12">
          {steps.map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex items-center gap-3 ${
                currentStep >= step.num ? 'text-primary-500' : 'text-slate-300'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.num 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-0.5 mx-4 ${
                  currentStep > step.num ? 'bg-primary-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Form method="post" className="card p-8">
          <input type="hidden" name="step" value={currentStep} />
          <input type="hidden" name="sampleId" value={formData.sampleId} />
          <input type="hidden" name="targetCountry" value={formData.targetCountry} />
          <input type="hidden" name="testPurpose" value={formData.testPurpose} />
          <input type="hidden" name="expectedReturnDate" value={formData.expectedReturnDate} />

          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">请选择要借用的样机</h2>
              <div className="grid gap-3">
                {samples.map((sample: Sample) => (
                  <label
                    key={sample.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.sampleId === sample.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sampleId"
                      value={sample.id}
                      checked={formData.sampleId === sample.id}
                      onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
                      className="hidden"
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{sample.name}</h3>
                        <p className="text-sm text-slate-500">{sample.model} · SN: {sample.serialNumber}</p>
                        {sample.description && (
                          <p className="text-sm text-slate-500 mt-1">{sample.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-primary-500">¥{Number(sample.depositAmount).toLocaleString()}</p>
                        <p className="text-xs text-slate-400">押金</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">请填写申请信息</h2>
              
              <div>
                <label className="label flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  目标国家
                </label>
                <input
                  type="text"
                  name="targetCountry"
                  value={formData.targetCountry}
                  onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
                  className="input"
                  placeholder="例如：新加坡、美国、德国"
                  required
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  测试用途
                </label>
                <textarea
                  name="testPurpose"
                  value={formData.testPurpose}
                  onChange={(e) => setFormData({ ...formData, testPurpose: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="请详细描述您的测试目的、测试场景和预期结果..."
                  required
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  预计归还日期
                </label>
                <input
                  type="date"
                  name="expectedReturnDate"
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="input"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && selectedSample && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">确认申请信息</h2>
              
              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">样机名称</span>
                  <span className="font-medium">{selectedSample.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">型号规格</span>
                  <span className="font-medium">{selectedSample.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">序列号</span>
                  <span className="font-mono">{selectedSample.serialNumber}</span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between">
                  <span className="text-slate-500">押金金额</span>
                  <span className="font-mono font-semibold text-primary-500 text-lg">
                    ¥{Number(selectedSample.depositAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">目标国家</span>
                  <span className="font-medium">{formData.targetCountry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">预计归还</span>
                  <span className="font-medium">{new Date(formData.expectedReturnDate).toLocaleDateString('zh-CN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-2">测试用途</span>
                  <p className="text-slate-700 bg-white p-3 rounded">{formData.testPurpose}</p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <input type="checkbox" name="submitNow" value="true" defaultChecked className="mt-1" />
                <span className="text-sm text-slate-600">
                  确认以上信息无误，立即提交审核。提交后将进入销售审核流程。
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="submit"
                name="step"
                value={currentStep - 1}
                className="btn-secondary"
                disabled={navigation.state === 'submitting'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                上一步
              </button>
            ) : (
              <div />
            )}
            
            {currentStep < 3 ? (
              <button
                type="submit"
                name="step"
                value={currentStep + 1}
                className="btn-primary"
                disabled={navigation.state === 'submitting' || (currentStep === 1 && !formData.sampleId)}
              >
                下一步
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={navigation.state === 'submitting'}
              >
                {navigation.state === 'submitting' ? '提交中...' : '提交申请'}
              </button>
            )}
          </div>
        </Form>
      </div>
    </Layout>
  );
}
