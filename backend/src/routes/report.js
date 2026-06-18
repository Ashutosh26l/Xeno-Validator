// src/routes/report.js
// GET /api/report/:uploadId    — full report JSON
// GET /api/errors/:uploadId    — paginated errors with type filter
// GET /api/uploads             — all uploads for current user
// GET /api/uploads/:uploadId   — single upload detail

import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ── GET /api/report/:uploadId ────────────────────────────────────────────────

router.get("/report/:uploadId", authMiddleware, async (req, res, next) => {
  try {
    const { uploadId } = req.params;

    const { data: upload, error: uploadErr } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .maybeSingle();

    if (uploadErr) throw uploadErr;
    if (!upload) return res.status(404).json({ success: false, error: "Upload not found.", code: 404 });
    if (upload.user_id !== req.user.id) return res.status(403).json({ success: false, error: "Access denied.", code: 403 });

    // Fetch AI report
    const { data: aiReport } = await supabase
      .from("ai_reports")
      .select("summary, recommendations")
      .eq("upload_id", uploadId)
      .maybeSingle();

    // Fetch error breakdown counts
    const { data: errors } = await supabase
      .from("errors")
      .select("error_type")
      .eq("upload_id", uploadId);

    const errorBreakdown = {
      phoneErrors: 0, dateErrors: 0, paymentErrors: 0,
      integrityErrors: 0, duplicateErrors: 0, missingErrors: 0, correctedCount: 0,
    };

    if (errors) {
      for (const e of errors) {
        switch (e.error_type) {
          case "phone":     errorBreakdown.phoneErrors++; break;
          case "date":      errorBreakdown.dateErrors++; break;
          case "payment":   errorBreakdown.paymentErrors++; break;
          case "integrity": errorBreakdown.integrityErrors++; break;
          case "duplicate": errorBreakdown.duplicateErrors++; break;
          case "missing":   errorBreakdown.missingErrors++; break;
          case "corrected": errorBreakdown.correctedCount++; break;
        }
      }
    }

    // Compute quality breakdown from the stored data
    const totalRows = upload.total_rows || 1;
    const qualityBreakdown = {
      completeness: Math.round(((totalRows - errorBreakdown.missingErrors) / totalRows) * 100),
      accuracy:     Math.round(((totalRows - errorBreakdown.phoneErrors - errorBreakdown.dateErrors - errorBreakdown.paymentErrors) / totalRows) * 100),
      consistency:  Math.round(((totalRows - errorBreakdown.duplicateErrors - errorBreakdown.integrityErrors) / totalRows) * 100),
    };

    let recommendations = [];
    try {
      if (aiReport?.recommendations) {
        recommendations = typeof aiReport.recommendations === "string"
          ? JSON.parse(aiReport.recommendations)
          : aiReport.recommendations;
      }
    } catch { /* ignore parse errors */ }

    return res.status(200).json({
      success: true,
      data: {
        uploadId:        upload.id,
        originalFilename: upload.original_filename,
        uploadedAt:      upload.uploaded_at,
        status:          upload.status,
        totalRows:       upload.total_rows,
        validRows:       upload.valid_rows,
        invalidRows:     upload.invalid_rows,
        qualityScore:    upload.quality_score,
        isChunked:       upload.is_chunked,
        chunkCount:      upload.chunk_count,
        errorBreakdown,
        qualityBreakdown,
        aiSummary: {
          summary:         aiReport?.summary || null,
          recommendations,
          topIssue:        null, // computed from errorBreakdown in frontend
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/errors/:uploadId ────────────────────────────────────────────────

router.get("/errors/:uploadId", authMiddleware, async (req, res, next) => {
  try {
    const { uploadId } = req.params;
    const type  = req.query.type || "all";
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    // Verify ownership
    const { data: upload } = await supabase
      .from("uploads")
      .select("user_id")
      .eq("id", uploadId)
      .maybeSingle();

    if (!upload) return res.status(404).json({ success: false, error: "Upload not found.", code: 404 });
    if (upload.user_id !== req.user.id) return res.status(403).json({ success: false, error: "Access denied.", code: 403 });

    let query = supabase
      .from("errors")
      .select("*", { count: "exact" })
      .eq("upload_id", uploadId)
      .order("row_number", { ascending: true })
      .range(offset, offset + limit - 1);

    if (type !== "all") {
      query = query.eq("error_type", type);
    }

    const { data: errors, count, error: qErr } = await query;
    if (qErr) throw qErr;

    return res.status(200).json({
      success: true,
      data: {
        errors: errors || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/uploads ─────────────────────────────────────────────────────────

router.get("/uploads", authMiddleware, async (req, res, next) => {
  try {
    const { data: uploads, error } = await supabase
      .from("uploads")
      .select("id, original_filename, total_rows, valid_rows, invalid_rows, quality_score, status, is_chunked, chunk_count, uploaded_at")
      .eq("user_id", req.user.id)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: uploads || [],
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/uploads/:uploadId ───────────────────────────────────────────────

router.get("/uploads/:uploadId", authMiddleware, async (req, res, next) => {
  try {
    const { data: upload, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", req.params.uploadId)
      .maybeSingle();

    if (error) throw error;
    if (!upload) return res.status(404).json({ success: false, error: "Upload not found.", code: 404 });
    if (upload.user_id !== req.user.id) return res.status(403).json({ success: false, error: "Access denied.", code: 403 });

    return res.status(200).json({
      success: true,
      data: upload,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
