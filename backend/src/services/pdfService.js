// src/services/pdfService.js
// Generates a PDF summary report using PDFKit (streaming API → Buffer).
// Per spec §11 item 7 / note §24-9.

import PDFDocument from "pdfkit";

/**
 * Generates a PDF buffer from the AI summary and stats.
 *
 * @param {object} params
 * @param {string} params.filename — original upload filename
 * @param {object} params.stats   — { totalRows, validRows, invalidRows, qualityScore, ... }
 * @param {object} params.breakdown — { completeness, accuracy, consistency, errorBreakdown }
 * @returns {Promise<Buffer>}
 */
export async function generatePdf({ filename, stats, breakdown }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ── Title ─────────────────────────────────────────────────────────────
    doc
      .fontSize(22)
      .fillColor("#1a1a2e")
      .text("Data Quality Report", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor("#555")
      .text(`File: ${filename}`, { align: "center" });
    doc
      .text(`Generated: ${new Date().toISOString().split("T")[0]}`, { align: "center" });
    doc.moveDown(1.5);

    // ── Summary Stats ─────────────────────────────────────────────────────
    doc.fontSize(16).fillColor("#1a1a2e").text("Summary Statistics");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#333");
    doc.text(`Total Rows:      ${stats.totalRows}`);
    doc.text(`Valid Rows:      ${stats.validRows}`);
    doc.text(`Invalid Rows:    ${stats.invalidRows}`);
    doc.text(`Quality Score:   ${stats.qualityScore}%`);
    doc.text(`Auto-Corrected:  ${stats.correctedCount || 0}`);
    doc.moveDown(1);

    // ── Quality Breakdown ─────────────────────────────────────────────────
    if (breakdown) {
      doc.fontSize(16).fillColor("#1a1a2e").text("Quality Breakdown");
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor("#333");
      doc.text(`Completeness:  ${breakdown.completeness}%`);
      doc.text(`Accuracy:      ${breakdown.accuracy}%`);
      doc.text(`Consistency:   ${breakdown.consistency}%`);
      doc.moveDown(0.5);

      const eb = breakdown.errorBreakdown;
      doc.text(`Phone Errors:     ${eb.phoneErrors}`);
      doc.text(`Date Errors:      ${eb.dateErrors}`);
      doc.text(`Payment Errors:   ${eb.paymentErrors}`);
      doc.text(`Integrity Errors: ${eb.integrityErrors}`);
      doc.text(`Duplicate Errors: ${eb.duplicateErrors}`);
      doc.text(`Missing Fields:   ${eb.missingErrors}`);
      doc.moveDown(1);
    }



    doc.end();
  });
}
