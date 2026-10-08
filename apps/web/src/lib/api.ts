export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// On the server: call NestJS directly. In the browser: use the same origin (proxy).
const BASE = typeof window === 'undefined' ? (process.env.API_URL ?? 'http://localhost:4000') : '';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // File uploads (FormData) must NOT get a JSON content type: the browser adds the right one
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers as Record<string, string> | undefined),
    },
    credentials: 'include',
    cache: init.cache ?? 'no-store', // always fresh data (admin edits show instantly)
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}