// src/routes/upload.js
// POST /api/upload                            — accepts CSV, runs column validation
// POST /api/upload/:uploadId/confirm-mapping  — saves user's column mapping decision

import { Router } from "express";
import { supabase } from "../config/supabase.js";
import uploadMiddleware from "../middleware/upload.js";
import { validateColumns } from "../validators/columnValidator.js";
import { env } from "../config/env.js";

const router = Router();

// ── POST /api/upload ─────────────────────────────────────────────────────────

router.post(
  "/upload",
  uploadMiddleware.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded. Send a CSV as multipart/form-data with key 'file'.",
          code: 400,
        });
      }

      const { buffer, originalname } = req.file;

      // ── Column validation ──────────────────────────────────────────────────
      const colCheck = validateColumns(buffer);

      if (!colCheck.valid) {
        return res.status(400).json({
          success: false,
          error: colCheck.reason,
          missingColumns: colCheck.missingColumns,
          code: 400,
        });
      }

      // ── Persist upload record to DB ───────────────────────────────────────
      const storagePath = `uploads/${Date.now()}_${originalname}`;

      const { error: storageError } = await supabase.storage
        .from(env.supabaseStorageBucket)
        .upload(storagePath, buffer, { contentType: "text/csv", upsert: false });

      if (storageError) {
        throw new Error(`Failed to store CSV: ${storageError.message}`);
      }

      const { data: upload, error: dbError } = await supabase
        .from("uploads")
        .insert({
          original_filename: originalname,
          status:            "pending",
          clean_csv_storage_path: storagePath,
        })
        .select("id, status, original_filename, uploaded_at")
        .single();

      if (dbError) throw dbError;

      // ── Extra columns — ask user to map them ──────────────────────────────
      if (colCheck.needsMapping) {
        return res.status(200).json({
          success: true,
          message: "Columns need mapping. Please map extra columns to missing required columns.",
          data: {
            needsMapping: true,
            uploadId:     upload.id,
            extraColumns: colCheck.extraColumns,
            missingColumns: colCheck.missingColumns || [],
            suggestedMappings: colCheck.suggestedMappings || {}
          },
        });
      }

      // ── All columns match — ready to validate ─────────────────────────────
      return res.status(201).json({
        success: true,
        message: "File uploaded successfully. Ready to validate.",
        data: {
          uploadId: upload.id,
          status:   "pending",
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/upload/:uploadId/confirm-mapping ────────────────────────────────
// Body: { mapping: { "extra_col": "expected_col" | null } }
// Stores the mapping in the uploads row and marks the upload "ready".

router.post(
  "/upload/:uploadId/confirm-mapping",
  async (req, res, next) => {
    try {
      const { uploadId } = req.params;
      const { mapping }  = req.body;

      if (!mapping || typeof mapping !== "object") {
        return res.status(400).json({
          success: false,
          error: "mapping must be a JSON object.",
          code: 400,
        });
      }

      const { data: upload, error: fetchError } = await supabase
        .from("uploads")
        .select("id, status")
        .eq("id", uploadId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!upload) {
        return res.status(404).json({
          success: false,
          error: "Upload not found.",
          code: 404,
        });
      }

      // Persist mapping and set status to "pending" (ready for validation)
      const { error: updateError } = await supabase
        .from("uploads")
        .update({ column_mapping: mapping, status: "pending" })
        .eq("id", uploadId);

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        message: "Column mapping saved. Ready to validate.",
        data: { uploadId, status: "pending" },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
