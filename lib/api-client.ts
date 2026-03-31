import { getSafeSession } from '@/lib/supabase';

async function parseResponsePayload<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function authorizedApiJson<T>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await authorizedApiFetch(input, init);
  const payload = await parseResponsePayload<{ error?: string } & T>(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Nao foi possivel concluir a operacao.');
  }

  return (payload || {}) as T;
}

export async function authorizedApiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const session = await getSafeSession();

  if (!session?.access_token) {
    throw new Error('Sessao expirada. Faca login novamente.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);

  if (!headers.has('Content-Type') && init.body) {
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    if (!isFormData) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return fetch(input, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

export async function publicApiJson<T>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const payload = await parseResponsePayload<{ error?: string } & T>(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Nao foi possivel concluir a operacao.');
  }

  return (payload || {}) as T;
}
