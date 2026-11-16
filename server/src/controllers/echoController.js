import { buildEcho } from "../services/echoService.js";

export async function createEcho(req, res) {
  const { message } = req.body;
  const result = await buildEcho(message);
  res.status(200).json({ success: true, data: result });
}