import AsyncStorage from '@react-native-async-storage/async-storage';

const REQUEST_TIMEOUT_MS = 15000;
const API_BASE_URL = 'http://kk0g84k04ow0cgs8owsckgwg.38.242.148.212.sslip.io';

export type ApiRecord = Record<string, unknown>;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

function buildQuery(params?: ApiRecord) {
  if (!params) return '';

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
}

function unwrapResponse<T>(json: unknown): T {
  if (Array.isArray(json)) return json as T;
  if (json && typeof json === 'object') {
    const record = json as ApiRecord;
    if ('data' in record) return record.data as T;
    if ('batch' in record) return record.batch as T;
  }
  return json as T;
}

export async function adminRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: ApiRecord;
    query?: ApiRecord;
  } = {},
) {
  const token = await AsyncStorage.getItem('authToken');
  const url = `${getApiBaseUrl()}${path}${buildQuery(options.query)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  console.log('[Admin API] Request:', {
    method: options.method || 'GET',
    url,
    body: options.body,
  });

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : '';
      if (message.includes("Failed to construct 'Response'") || message.includes('status provided (0)')) {
        throw new Error('Unable to reach the backend. Check that the API server is running and the mobile app is using the correct backend URL.');
      }
      throw fetchError;
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.multiRemove(['authToken', 'authUser', 'portalSession']);
      }

      const message =
        (json && typeof json === 'object' && 'error' in json && String(json.error)) ||
        (json && typeof json === 'object' && 'message' in json && String(json.message)) ||
        `Request failed with status ${response.status}`;

      console.log('[Admin API] Error:', { status: response.status, message, json });
      throw new Error(message);
    }

    return unwrapResponse<T>(json);
  } catch (error) {
    console.log('[Admin API] Network failure:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Check WiFi and backend connection.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
