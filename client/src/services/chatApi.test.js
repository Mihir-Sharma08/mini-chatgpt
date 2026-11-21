import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMessage } from "./chatApi";
import { setAuthToken, setUnauthorizedHandler } from "./api";

function streamResponse(chunks) {
  const encoder = new TextEncoder();
  let index = 0;

  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () =>
          index < chunks.length
            ? { done: false, value: encoder.encode(chunks[index++]) }
            : { done: true, value: undefined },
      }),
    },
  };
}

function errorResponse(status, message) {
  return { ok: false, status, json: async () => ({ success: false, message }) };
}

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setAuthToken(null);
  setUnauthorizedHandler(null);
});

describe("sendMessage (streaming client)", () => {
  it("reassembles events that arrive split across network chunks", async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        'event: meta\ndata: {"conversationId":"c1","title":"Hi"}\n\nevent: tok',
        'en\ndata: {"text":"Hel"}\n\nevent: token\ndata: {"text":"lo"}\n\n',
        "event: done\ndata: {}\n\n",
      ]),
    );
    const onMeta = vi.fn();
    const onToken = vi.fn();

    await sendMessage({ message: "hi", onMeta, onToken });

    expect(onMeta).toHaveBeenCalledWith({ conversationId: "c1", title: "Hi" });
    expect(onToken.mock.calls.map(([text]) => text)).toEqual(["Hel", "lo"]);
  });

  it("sends the message and the auth token to the server", async () => {
    setAuthToken("abc123");
    fetchMock.mockResolvedValue(streamResponse(["event: done\ndata: {}\n\n"]));

    await sendMessage({ message: "hi", conversationId: "c9", onToken: vi.fn() });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat/stream");
    expect(options.headers.Authorization).toBe("Bearer abc123");
    expect(JSON.parse(options.body)).toEqual({ conversationId: "c9", message: "hi" });
  });

  it("throws the message from an error event", async () => {
    fetchMock.mockResolvedValue(
      streamResponse(['event: error\ndata: {"message":"boom"}\n\n']),
    );

    await expect(sendMessage({ message: "hi", onToken: vi.fn() })).rejects.toThrow("boom");
  });

  it("uses the server's message for HTTP errors", async () => {
    fetchMock.mockResolvedValue(errorResponse(429, "Too many requests"));

    await expect(sendMessage({ message: "hi", onToken: vi.fn() })).rejects.toThrow(
      "Too many requests",
    );
  });

  it("reports a friendly message when the server is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(sendMessage({ message: "hi", onToken: vi.fn() })).rejects.toThrow(
      "Cannot reach the server",
    );
  });

  it("re-throws an abort so the UI can tell it apart from a real error", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

    await expect(sendMessage({ message: "hi", onToken: vi.fn() })).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("logs the user out when the server answers 401 to an authenticated request", async () => {
    const onUnauthorized = vi.fn();
    setAuthToken("expired-token");
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValue(errorResponse(401, "Your session has expired."));

    await expect(sendMessage({ message: "hi", onToken: vi.fn() })).rejects.toThrow();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});