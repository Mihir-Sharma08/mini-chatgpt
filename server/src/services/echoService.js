export async function buildEcho(message) {
  if (message.toLowerCase() === "boom") {
    throw new Error("Simulated server crash");
  }

  return {
    original: message,
    reversed: [...message].reverse().join(""),
    length: message.length,
    receivedAt: new Date().toISOString(),
  };
}