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
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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