let cachedToken: string | null = null;

// Initialize token from session endpoint or localStorage
export async function initAuth(): Promise<string | null> {
  if (cachedToken) return cachedToken;

  try {
    const saved = localStorage.getItem('musik_private_token');
    if (saved) {
      cachedToken = saved;
    }

    const res = await fetch('/api/auth/session', {
      credentials: 'same-origin',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        cachedToken = data.token;
        localStorage.setItem('musik_private_token', data.token);
      }
    }
  } catch (err) {
    console.warn('Could not initialize auth session:', err);
  }

  return cachedToken;
}

export function getAuthToken(): string | null {
  if (!cachedToken) {
    cachedToken = localStorage.getItem('musik_private_token');
  }
  return cachedToken;
}

export function setAuthToken(token: string) {
  cachedToken = token;
  localStorage.setItem('musik_private_token', token);
}

// Owner specific auth tokens
export function getOwnerToken(): string | null {
  return localStorage.getItem('musik_owner_token');
}

export function setOwnerToken(token: string | null) {
  if (token) {
    localStorage.setItem('musik_owner_token', token);
  } else {
    localStorage.removeItem('musik_owner_token');
  }
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const ownerToken = getOwnerToken();
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (ownerToken) {
    headers.set('x-owner-token', ownerToken);
  }

  // Ensure credentials are sent for same-origin session
  const config: RequestInit = {
    ...init,
    headers,
    credentials: 'same-origin',
  };

  let response = await fetch(input, config);

  // If 401, try initializing session once and retry
  if (response.status === 401 && !init?.headers) {
    const freshToken = await initAuth();
    if (freshToken) {
      headers.set('Authorization', `Bearer ${freshToken}`);
      response = await fetch(input, {
        ...init,
        headers,
        credentials: 'same-origin',
      });
    }
  }

  return response;
}
