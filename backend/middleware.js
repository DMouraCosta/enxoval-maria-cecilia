import { verifyToken } from "./auth.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token ausente" });
  }

  try {
    const token = header.replace("Bearer ", "");

    verifyToken(token);

    next();
  } catch {
    res.status(403).json({ error: "Token inválido" });
  }
}
