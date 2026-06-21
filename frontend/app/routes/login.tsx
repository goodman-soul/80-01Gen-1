import { useState } from 'react';
import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { Package, Loader2 } from 'lucide-react';
import { authApi } from '~/lib/api';
import { UserRole } from '~/lib/types';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      const cookie = response.headers.get('set-cookie');
      const role = data.user.role as UserRole;
      
      const dashboardPath = {
        customer: '/customer/dashboard',
        sales: '/sales/dashboard',
        warehouse: '/warehouse/dashboard',
        legal: '/legal/dashboard',
      }[role] || '/customer/dashboard';

      return redirect(dashboardPath, {
          headers: cookie ? { 'Set-Cookie': cookie } : undefined,
        });
    } else {
      return json({ error: '邮箱或密码错误' }, { status: 401 });
    }
  } catch (e) {
    return json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">跨境样品借测系统</h1>
          <p className="text-white/70">请登录以继续</p>
        </div>

        <div className="card p-8 animate-slide-up">
          <Form method="post" className="space-y-5">
            <div>
              <label className="label">邮箱</label>
              <input
                type="email"
                name="email"
                required
                className="input"
                placeholder="your@email.com"
                defaultValue="customer@example.com"
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                name="password"
                required
                className="input"
                placeholder="请输入密码"
                defaultValue="password123"
              />
            </div>

            {actionData?.error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {actionData.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </Form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">测试账号：</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <p className="font-medium">客户</p>
                <p className="text-slate-500">customer@example.com</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="font-medium">销售</p>
                <p className="text-slate-500">sales@example.com</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="font-medium">仓库</p>
                <p className="text-slate-500">warehouse@example.com</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="font-medium">法务</p>
                <p className="text-slate-500">legal@example.com</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">密码统一：password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
