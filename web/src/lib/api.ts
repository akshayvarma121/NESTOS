const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `API Error: ${res.statusText}`);
  }
  const data = await res.json();
  
  // FR-10.1 Milestone Detection
  if (data && data.milestone_reached) {
    window.dispatchEvent(new CustomEvent('milestone_reached'));
  }
  
  return data;
}

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`);
    return handleResponse(res);
  },
  post: async (path: string, body?: any) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },
  patch: async (path: string, body: any) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    return handleResponse(res);
  }
};
