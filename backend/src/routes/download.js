// src/routes/download.js
// All download routes — generate signed URLs from Supabase Storage.
//
// GET /api/download/zip/:uploadId
// GET /api/download/clean/:uploadId
// GET /api/download/invalid/:uploadId
// GET /api/download/errors/:uploadId
// GET /api/download/summary/:uploadId

import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { getSignedUrl } from "../services/storageService.js";

const router = Router();

/**
 * Helper — returns the storage path for the requested file type.
 */
async function getStoragePath(uploadId, fileType) {
  const { data: upload, error } = await supabase
    .from("uploads")
    .select("zip_storage_path, clean_csv_storage_path, invalid_csv_storage_path, error_report_storage_path, ai_summary_storage_path, status")
    .eq("id", uploadId)
    .maybeSingle();

  if (error) throw error;

  if (!upload) {
    return { error: { status: 404, message: "Upload not found." } };
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
      const result = await getStoragePath(uploadId, fileType);

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

router.get("/zip/:uploadId",     downloadHandler("zip"));
router.get("/clean/:uploadId",   downloadHandler("clean"));
router.get("/invalid/:uploadId", downloadHandler("invalid"));
router.get("/errors/:uploadId",  downloadHandler("errors"));
router.get("/summary/:uploadId", downloadHandler("summary"));

export default router;
