import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'clic_token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// El token vive en memoria para que apiFetch sea síncrono respecto al header
// (SecureStore es async). Se hidrata una vez en el bootstrap con loadToken().
let currentToken: string | null = null;

export function getToken(): string | null {
  return currentToken;
}

/** Hidrata el token desde SecureStore. Llamar una vez al abrir la app. */
export async function loadToken(): Promise<string | null> {
  try {
    currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    currentToken = null;
  }
  return currentToken;
}

export function setToken(token: string) {
  currentToken = token;
  SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
}

export function clearToken() {
  currentToken = null;
  SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

function buildUrl(path: string, query?: Options['query']): string {
  let url = API_BASE_URL + path;
  if (query) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
    }
    if (parts.length) url += `?${parts.join('&')}`;
  }
  return url;
}

export async function apiFetch<T = unknown>(
  path: string,
  { method = 'GET', body, auth = true, query }: Options = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Sin conexion a internet', 0);
  }

  if (res.status === 204) return undefined as T;

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (res.ok) return data as T;

  // Errores
  if (res.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
    throw new ApiError(
      'Tu sesion expiro. Inicia sesion de nuevo.',
      401
    );
  }
  if (res.status === 429) {
    throw new ApiError('Demasiados intentos. Espera unos minutos.', 429);
  }
  if (res.status >= 500) {
    throw new ApiError('Error del servidor. Intenta mas tarde.', res.status);
  }

  const msg =
    (data && (data.error || data.message)) ||
    `Error ${res.status}`;
  throw new ApiError(msg, res.status);
}
