export const API_URL = import.meta.env.VITE_API_URL ?? "";

export function wakeServer() {
  if (!API_URL) return;

  fetch(`${API_URL}/api/health`).catch(() => {
    // Ignore errors: this is only a warm-up ping.
  });
}

let authToken = null;
let unauthorizedHandler = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

// If the server says 401 while we HAVE a token, the session is dead: log out.
export function notifyIfUnauthorized(response) {
  if (response.status === 401 && authToken && unauthorizedHandler) {
    unauthorizedHandler();
  }
}

export async function readErrorMessage(response) {
  let message = `Request failed (status ${response.status})`;
  try {
    const body = await response.json();
    if (body.message) message = body.message;
    if (Array.isArray(body.details) && body.details.length > 0) {
      message = `${message}: ${body.details.join("; ")}`;
    }
  } catch {
    // The body wasn't JSON; keep the default message.
  }
  return message;
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers },
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) {
    notifyIfUnauthorized(response);
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) return null;

  const body = await response.json();
  return body.data;
}

export const registerUser = (details) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(details) });

export const loginUser = (credentials) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });

export const fetchMe = () => request("/api/auth/me");

export const fetchConversations = () => request("/api/conversations");

export const fetchConversation = (id) => request(`/api/conversations/${id}`);

export const renameConversation = (id, title) =>
  request(`/api/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });

export const deleteConversation = (id) => request(`/api/conversations/${id}`, { method: "DELETE" });