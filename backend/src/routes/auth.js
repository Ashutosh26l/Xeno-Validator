// src/routes/auth.js
// POST /api/auth/register  — create account, return JWT
// POST /api/auth/login     — verify credentials, return JWT
// GET  /api/auth/me        — return profile for authenticated user

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

// ── POST /api/auth/register ──────────────────────────────────────────────────

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "name, email, and password are required.",
        code: 400,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
        code: 400,
      });
    }

    // Check if email already taken
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists.",
        code: 409,
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from("users")
      .insert({ name, email: email.toLowerCase(), password_hash })
      .select("id, name, email, created_at")
      .single();

    if (error) throw error;

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { token, user: { id: user.id, name: user.name, email: user.email } },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "email and password are required.",
        code: 400,
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, password_hash")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
        code: 401,
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
        code: 401,
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { token, user: { id: user.id, name: user.name, email: user.email } },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
