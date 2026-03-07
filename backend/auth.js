import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET;

export function generateToken(user) {
  return jwt.sign({ user }, SECRET, { expiresIn: "12h" });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
