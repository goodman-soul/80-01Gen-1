const API_BASE_URL = process.env.API_URL || 'http://127.0.0.1:3001';

export async function serverFetch(
  path: string,
  request: Request,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const cookie = request.headers.get('Cookie') || '';

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      ...options.headers,
    },
    credentials: 'include',
  });
}

export async function serverApiRequest<T>(
  path: string,
  request: Request,
  options: RequestInit = {}
): Promise<T> {
  const response = await serverFetch(path, request, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export function getApiUrl(): string {
  return API_BASE_URL;
}
