// src/middleware/auth.js
// JWT verification middleware.
// Extracts the token from "Authorization: Bearer <token>",
// verifies it, and attaches decoded payload to req.user.

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Provide Authorization: Bearer <token>.",
      code: 401,
    });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded; // { id, email, name, iat, exp }
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Token expired. Please log in again."
        : "Invalid token.";

    return res.status(401).json({
      success: false,
      error: message,
      code: 401,
    });
  }
}
