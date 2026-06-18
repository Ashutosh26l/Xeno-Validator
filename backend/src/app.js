// src/app.js
// Express application entry point.
// Wires all middleware, routes, and global error handler exactly as
// specified in the implementation doc §19.

import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";

dotenv.config();

import { validateEnv, env } from "./config/env.js";

import uploadRoutes   from "./routes/upload.js";
import validateRoutes from "./routes/validate.js";
import reportRoutes   from "./routes/report.js";
import downloadRoutes from "./routes/download.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Crash fast if required env vars are missing
validateEnv();

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));         // restrict to EC2 domain in production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check (no auth) ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Xeno backend is running.", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api",          uploadRoutes);
app.use("/api",          validateRoutes);
app.use("/api",          reportRoutes);
app.use("/api/download", downloadRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found.", code: 404 });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`[app] Xeno backend running on port ${env.port} (${env.nodeEnv})`);
});
