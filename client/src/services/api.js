export const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function readErrorMessage(response) {
  let message = `Request failed (status ${response.status})`;
  try {
    const body = await response.json();
    if (body.message) message = body.message;
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
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) return null;

  const body = await response.json();
  return body.data;
}

export const fetchConversations = () => request("/api/conversations");

export const fetchConversation = (id) => request(`/api/conversations/${id}`);

export const renameConversation = (id, title) =>
  request(`/api/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });

export const deleteConversation = (id) => request(`/api/conversations/${id}`, { method: "DELETE" });