import * as authService from "../services/authService.js";

export async function register(req, res) {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: { user, token } });
}

export async function login(req, res) {
  const { user, token } = await authService.loginUser(req.body);
  res.json({ success: true, data: { user, token } });
}

export async function getMe(req, res) {
  res.json({ success: true, data: req.user });
}