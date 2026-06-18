// src/routes/validate.js
// POST /api/validate/:uploadId — runs the full validation pipeline.
// Per spec §12 "Validation" section.

import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import archiver from "archiver";
import { PassThrough } from "stream";
import { supabase } from "../config/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { runValidation } from "../services/validationService.js";
import { calculateScore, calculateBreakdown } from "../services/qualityService.js";
import { chunkRows } from "../services/chunkingService.js";
import { uploadFile, downloadFile } from "../services/storageService.js";

import { generatePdf } from "../services/pdfService.js";

const router = Router();

router.post("/validate/:uploadId", authMiddleware, async (req, res, next) => {
  try {
    const { uploadId } = req.params;

    // ── 1. Fetch upload record & verify ownership ───────────────────────────
    const { data: upload, error: fetchErr } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!upload) {
      return res.status(404).json({ success: false, error: "Upload not found.", code: 404 });
    }
    if (upload.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied.", code: 403 });
    }
    if (upload.status === "completed") {
      return res.status(400).json({ success: false, error: "This upload has already been validated.", code: 400 });
    }

    // Mark as processing
    await supabase.from("uploads").update({ status: "processing" }).eq("id", uploadId);

    // ── 2. Fetch CSV from Supabase Storage ──────────────────────────────────
    const csvBuffer = await downloadFile(upload.clean_csv_storage_path);

    // ── 3. Run validation pipeline ──────────────────────────────────────────
    const { totalRows, cleanRows, invalidRows, errorLog } = runValidation(
      csvBuffer,
      upload.column_mapping || null
    );

    const validRows = cleanRows.length;
    const qualityScore = calculateScore(totalRows, validRows);
    const breakdown = calculateBreakdown(totalRows, errorLog);

    // ── 4. Generate output CSVs in memory ───────────────────────────────────
    const cleanCsv   = cleanRows.length > 0 ? stringify(cleanRows, { header: true }) : "";
    const invalidCsv = invalidRows.length > 0 ? stringify(invalidRows, { header: true }) : "";
    const errorCsv   = errorLog.length > 0
      ? stringify(errorLog, {
          header: true,
          columns: ["row_number", "field_name", "error_type", "error_message", "original_value", "suggestion"],
        })
      : "";



    // ── 6. Generate PDF ─────────────────────────────────────────────────────
    const pdfBuffer = await generatePdf({
      filename: upload.original_filename,
      stats: { totalRows, validRows, invalidRows: invalidRows.length, qualityScore, correctedCount: breakdown.correctedCount },
      breakdown,
    });

    // ── 7. Chunking ─────────────────────────────────────────────────────────
    const chunks = chunkRows(cleanRows);
    const isChunked = chunks !== null;
    const chunkCount = isChunked ? chunks.length : 0;

    // ── 8. Build ZIP in memory ──────────────────────────────────────────────
    const zipBuffer = await new Promise((resolve, reject) => {
      const passThrough = new PassThrough();
      const buffers = [];
      passThrough.on("data", (chunk) => buffers.push(chunk));
      passThrough.on("end", () => resolve(Buffer.concat(buffers)));
      passThrough.on("error", reject);

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(passThrough);

      if (isChunked) {
        for (let i = 0; i < chunks.length; i++) {
          const chunkCsv = stringify(chunks[i], { header: true });
          archive.append(chunkCsv, { name: `chunk_${i + 1}.csv` });
        }
      } else if (cleanCsv) {
        archive.append(cleanCsv, { name: "clean_data.csv" });
      }

      if (invalidCsv) archive.append(invalidCsv, { name: "invalid_rows.csv" });
      if (errorCsv)   archive.append(errorCsv,   { name: "error_report.csv" });
      archive.append(pdfBuffer, { name: "summary_report.pdf" });

      archive.finalize();
    });

    // ── 9. Upload all files to Supabase Storage ─────────────────────────────
    const basePath = `uploads/${uploadId}`;

    const zipPath     = await uploadFile(`${basePath}/output.zip`, zipBuffer, "application/zip");
    const invalidPath = invalidCsv
      ? await uploadFile(`${basePath}/invalid_rows.csv`, Buffer.from(invalidCsv), "text/csv")
      : null;
    const errorPath   = errorCsv
      ? await uploadFile(`${basePath}/error_report.csv`, Buffer.from(errorCsv), "text/csv")
      : null;
    const pdfPath     = await uploadFile(`${basePath}/summary_report.pdf`, pdfBuffer, "application/pdf");

    let cleanPath = null;
    if (!isChunked && cleanCsv) {
      cleanPath = await uploadFile(`${basePath}/clean_data.csv`, Buffer.from(cleanCsv), "text/csv");
    }

    // ── 10. Save errors to DB ───────────────────────────────────────────────
    // Insert in batches of 500 to avoid payload limits
    const realErrors = errorLog.filter((e) => e.error_type !== "corrected");
    for (let i = 0; i < realErrors.length; i += 500) {
      const batch = realErrors.slice(i, i + 500).map((e) => ({
        upload_id:     uploadId,
        row_number:    e.row_number,
        field_name:    e.field_name,
        error_type:    e.error_type,
        error_message: e.error_message,
        original_value: e.original_value,
        suggestion:    e.suggestion,
      }));
      const { error: insertErr } = await supabase.from("errors").insert(batch);
      if (insertErr) console.error("[validate] Error inserting error batch:", insertErr.message);
    }

    // Also insert corrections as "corrected" type
    const corrections = errorLog.filter((e) => e.error_type === "corrected");
    for (let i = 0; i < corrections.length; i += 500) {
      const batch = corrections.slice(i, i + 500).map((e) => ({
        upload_id:     uploadId,
        row_number:    e.row_number,
        field_name:    e.field_name,
        error_type:    e.error_type,
        error_message: e.error_message,
        original_value: e.original_value,
        suggestion:    e.suggestion,
      }));
      const { error: insertErr } = await supabase.from("errors").insert(batch);
      if (insertErr) console.error("[validate] Error inserting correction batch:", insertErr.message);
    }



    // ── 12. Update uploads record ───────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from("uploads")
      .update({
        total_rows:               totalRows,
        valid_rows:               validRows,
        invalid_rows:             invalidRows.length,
        quality_score:            qualityScore,
        status:                   "completed",
        is_chunked:               isChunked,
        chunk_count:              chunkCount,
        zip_storage_path:         zipPath,
        clean_csv_storage_path:   cleanPath,
        invalid_csv_storage_path: invalidPath,
        error_report_storage_path: errorPath,
        ai_summary_storage_path:  pdfPath,
      })
      .eq("id", uploadId);

    if (updateErr) throw updateErr;

    // ── 13. Return result ───────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Validation complete.",
      data: {
        uploadId,
        totalRows,
        validRows,
        invalidRows: invalidRows.length,
        qualityScore,
        isChunked,
        chunkCount,
        errorBreakdown: breakdown.errorBreakdown,
        qualityBreakdown: {
          completeness: breakdown.completeness,
          accuracy: breakdown.accuracy,
          consistency: breakdown.consistency,
        },
        correctedCount: breakdown.correctedCount
      },
    });
  } catch (err) {
    // Mark as failed on error
    try {
      await supabase
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", req.params.uploadId);
    } catch {
      // ignore secondary errors
    }
    next(err);
  }
});

export default router;
