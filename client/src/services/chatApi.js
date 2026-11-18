import { API_URL, readErrorMessage } from "./api";

function parseFrame(frame) {
  let event = "message";
  let dataText = "";

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataText += line.slice(5).trim();
    }
  }

  let data = {};
  try {
    data = dataText ? JSON.parse(dataText) : {};
  } catch {
    // Ignore malformed data; treat it as an empty payload.
  }

  return { event, data };
}

export async function streamChat({ conversationId, message, onMeta, onToken, signal }) {
  let response;

  try {
    response = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, message }),
      signal,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop();

    for (const frame of frames) {
      const { event, data } = parseFrame(frame);

      if (event === "meta") {
        onMeta?.(data);
      } else if (event === "token") {
        onToken(data.text);
      } else if (event === "error") {
        throw new Error(data.message || "The AI response failed.");
      } else if (event === "done") {
        return;
      }
    }
  }
}