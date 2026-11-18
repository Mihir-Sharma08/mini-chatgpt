const API_URL = import.meta.env.VITE_API_URL ?? "";

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
 

export async function streamChat({ messages, onToken, signal }) {
  let response;

  try {
    response = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) {
    let message = `Request failed (status ${response.status})`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      // Body wasn't JSON; keep the default message.
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop();

    for (const frame of frames) {
      const { event, data } = parseFrame(frame);

      if (event === "token") {
        fullText += data.text;
        onToken(data.text);
      } else if (event === "error") {
        throw new Error(data.message || "The AI response failed.");
      } else if (event === "done") {
        return fullText;
      }
    }
  }

  return fullText;
}