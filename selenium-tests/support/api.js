import { config } from './config.js';

async function request(method, path, { token, body } = {}) {
  const url = `${config.apiUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, body: parsed };
}

export async function registerViaApi(email, password, name) {
  const { status, body } = await request('POST', '/auth/register', {
    body: { email, password, name },
  });
  if (status >= 400) {
    throw new Error(`Register failed: ${status} ${JSON.stringify(body)}`);
  }
  return body;
}

export async function loginViaApi(email, password) {
  const { status, body } = await request('POST', '/auth/login', {
    body: { email, password },
  });
  if (status >= 400) {
    throw new Error(`Login failed: ${status} ${JSON.stringify(body)}`);
  }
  return body;
}

export async function createSupplierViaApi(token, payload) {
  const { status, body } = await request('POST', '/suppliers', { token, body: payload });
  if (status >= 400) {
    throw new Error(`Create supplier failed: ${status} ${JSON.stringify(body)}`);
  }
  return body;
}

export async function deleteSupplierViaApi(token, id) {
  await request('DELETE', `/suppliers/${id}`, { token });
}

export async function listSuppliersViaApi(token) {
  const { body } = await request('GET', '/suppliers', { token });
  return body;
}
