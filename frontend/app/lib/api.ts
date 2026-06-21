export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    apiRequest('/api/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/api/auth/me'),
};

export const applicationApi = {
  list: () => apiRequest('/api/applications'),
  get: (id: string) => apiRequest(`/api/applications/${id}`),
  create: (data: { sampleId: string; targetCountry: string; testPurpose: string; expectedReturnDate: string }) =>
    apiRequest('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submit: (id: string) =>
    apiRequest(`/api/applications/${id}/submit`, { method: 'POST' }),
  salesReview: (id: string, approved: boolean, comment?: string) =>
    apiRequest(`/api/applications/${id}/sales-review`, {
      method: 'POST',
      body: JSON.stringify({ approved, comment }),
    }),
  legalReview: (id: string, approved: boolean, comment?: string) =>
    apiRequest(`/api/applications/${id}/legal-review`, {
      method: 'POST',
      body: JSON.stringify({ approved, comment }),
    }),
  ship: (id: string, courier: string, trackingNo: string) =>
    apiRequest(`/api/applications/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify({ courier, trackingNo }),
    }),
  confirmDelivery: (id: string) =>
    apiRequest(`/api/applications/${id}/confirm-delivery`, { method: 'POST' }),
  feedback: (id: string, content: string, testResult: 'pass' | 'fail' | 'partial') =>
    apiRequest(`/api/applications/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ content, testResult }),
    }),
  initiateReturn: (id: string) =>
    apiRequest(`/api/applications/${id}/initiate-return`, { method: 'POST' }),
  confirmReturnShip: (id: string, courier: string, trackingNo: string) =>
    apiRequest(`/api/applications/${id}/confirm-return-ship`, {
      method: 'POST',
      body: JSON.stringify({ courier, trackingNo }),
    }),
  inspectReturn: (id: string, data: {
    condition: 'good' | 'damaged' | 'missing_parts';
    description: string;
    hasDamage: boolean;
    damageDescription?: string;
  }) =>
    apiRequest(`/api/applications/${id}/inspect-return`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const sampleApi = {
  list: () => apiRequest('/api/samples'),
  available: () => apiRequest('/api/samples/available'),
  get: (id: string) => apiRequest(`/api/samples/${id}`),
  create: (data: { name: string; model: string; serialNumber: string; description?: string; value: number; depositAmount: number }) =>
    apiRequest('/api/samples', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const depositApi = {
  list: () => apiRequest('/api/deposits'),
  pay: (id: string) => apiRequest(`/api/deposits/${id}/pay`, { method: 'POST' }),
  refund: (id: string) => apiRequest(`/api/deposits/${id}/refund`, { method: 'POST' }),
};

export const contractApi = {
  list: () => apiRequest('/api/contracts'),
  get: (id: string) => apiRequest(`/api/contracts/${id}`),
  approve: (id: string) => apiRequest(`/api/contracts/${id}/approve`, { method: 'POST' }),
  reject: (id: string) => apiRequest(`/api/contracts/${id}/reject`, { method: 'POST' }),
};

export const logisticsApi = {
  track: (id: string) => apiRequest(`/api/logistics/${id}/track`),
};
