import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  redirect,
} from '@remix-run/react';
import tailwindStylesheet from './styles/tailwind.css?url';

if (typeof process !== 'undefined') {
  process.env.NO_PROXY = process.env.NO_PROXY ?? 'localhost,127.0.0.1';
  process.env.no_proxy = process.env.no_proxy ?? 'localhost,127.0.0.1';
}

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwindStylesheet },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = request.headers.get('Cookie')?.includes('token=');
  
  if (!token && url.pathname !== '/login') {
    return redirect('/login');
  }
  
  return null;
}

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
