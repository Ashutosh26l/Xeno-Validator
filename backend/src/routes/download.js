// src/routes/download.js
// All download routes — generate signed URLs from Supabase Storage.
// Per spec §12 "Downloads" section.
//
// GET /api/download/zip/:uploadId
// GET /api/download/clean/:uploadId
// GET /api/download/invalid/:uploadId
// GET /api/download/errors/:uploadId
// GET /api/download/summary/:uploadId

import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { getSignedUrl } from "../services/storageService.js";

const router = Router();

/**
 * Helper — verifies upload ownership and returns the storage path
 * for the requested file type.
 */
async function getStoragePath(uploadId, userId, fileType) {
  const { data: upload, error } = await supabase
    .from("uploads")
    .select("user_id, zip_storage_path, clean_csv_storage_path, invalid_csv_storage_path, error_report_storage_path, ai_summary_storage_path, status")
    .eq("id", uploadId)
    .maybeSingle();

  if (error) throw error;

  if (!upload) {
    return { error: { status: 404, message: "Upload not found." } };
  }
  if (upload.user_id !== userId) {
    return { error: { status: 403, message: "Access denied." } };
  }
  if (upload.status !== "completed") {
    return { error: { status: 400, message: "Upload has not been validated yet." } };
  }

  const pathMap = {
    zip:     upload.zip_storage_path,
    clean:   upload.clean_csv_storage_path,
    invalid: upload.invalid_csv_storage_path,
    errors:  upload.error_report_storage_path,
    summary: upload.ai_summary_storage_path,
  };

  const path = pathMap[fileType];
  if (!path) {
    return { error: { status: 404, message: `No ${fileType} file available for this upload.` } };
  }

  return { path };
}

/**
 * Factory for download route handlers.
 */
function downloadHandler(fileType) {
  return async (req, res, next) => {
    try {
      const { uploadId } = req.params;
      const result = await getStoragePath(uploadId, req.user.id, fileType);

      if (result.error) {
        return res.status(result.error.status).json({
          success: false,
          error: result.error.message,
          code: result.error.status,
        });
      }

      const downloadUrl = await getSignedUrl(result.path);

      return res.status(200).json({
        success: true,
        data: { downloadUrl },
      });
    } catch (err) {
      next(err);
    }
  };
}

router.get("/zip/:uploadId",     authMiddleware, downloadHandler("zip"));
router.get("/clean/:uploadId",   authMiddleware, downloadHandler("clean"));
router.get("/invalid/:uploadId", authMiddleware, downloadHandler("invalid"));
router.get("/errors/:uploadId",  authMiddleware, downloadHandler("errors"));
router.get("/summary/:uploadId", authMiddleware, downloadHandler("summary"));

export default router;
