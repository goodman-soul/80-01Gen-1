import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { UserRole } from '~/lib/types';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/auth/me`, {
      headers: {
        Cookie: request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });

    if (response.ok) {
      const user = await response.json();
      const role = user.role as UserRole;
      const dashboardPath = {
        customer: '/customer/dashboard',
        sales: '/sales/dashboard',
        warehouse: '/warehouse/dashboard',
        legal: '/legal/dashboard',
      }[role] || '/customer/dashboard';
      
      return redirect(dashboardPath);
    }
  } catch (e) {
    // fall through
  }
  
  return redirect('/login');
}

export default function Index() {
  return null;
}
