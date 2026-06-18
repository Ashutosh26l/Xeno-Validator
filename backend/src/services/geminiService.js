// src/services/geminiService.js
// AI summary generation via Google Gemini API per spec §14.
// Always wrapped in try/catch — returns placeholder if API fails.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

let genAI;
try {
  genAI = new GoogleGenerativeAI(env.geminiApiKey);
} catch {
  console.warn("[gemini] Failed to initialise Gemini client. AI summaries will be placeholders.");
}

/**
 * Generate an AI-powered data quality summary.
 *
 * @param {object} stats — { totalRows, validRows, invalidRows, qualityScore,
 *                           correctedCount, phoneErrors, dateErrors,
 *                           paymentErrors, integrityErrors, duplicateErrors }
 * @returns {{ summary: string, recommendations: string[], topIssue: string }}
 */
export async function generateSummary(stats) {
  if (!genAI) {
    return fallback(stats);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
You are a data quality analyst. Analyze this transaction dataset validation report.

Stats:
- Total Rows: ${stats.totalRows}
- Valid Rows: ${stats.validRows}
- Invalid Rows: ${stats.invalidRows}
- Quality Score: ${stats.qualityScore}%
- Auto-Corrected Rows: ${stats.correctedCount}
- Phone Errors: ${stats.phoneErrors}
- Date Errors: ${stats.dateErrors}
- Payment Errors: ${stats.paymentErrors}
- Integrity Errors: ${stats.integrityErrors}
- Duplicate Order IDs: ${stats.duplicateErrors}

Generate a JSON response ONLY with this exact structure:
{
  "summary": "3-4 sentence executive summary of data quality",
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ],
  "topIssue": "Name of the single biggest data quality issue"
}
`;

    const result  = await model.generateContent(prompt);
    const text    = result.response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[gemini] API call failed, returning fallback:", err.message);
    return fallback(stats);
  }
}

/**
 * Fallback summary when Gemini API is unavailable.
 */
function fallback(stats) {
  const { totalRows, validRows, invalidRows, qualityScore } = stats;

  // Find the top issue
  const issues = [
    { name: "Phone Errors", count: stats.phoneErrors || 0 },
    { name: "Date Errors", count: stats.dateErrors || 0 },
    { name: "Payment Errors", count: stats.paymentErrors || 0 },
    { name: "Integrity Errors", count: stats.integrityErrors || 0 },
    { name: "Duplicate Order IDs", count: stats.duplicateErrors || 0 },
  ];
  issues.sort((a, b) => b.count - a.count);
  const topIssue = issues[0].count > 0 ? issues[0].name : "None";

  return {
    summary: `Dataset contains ${totalRows} rows with a quality score of ${qualityScore}%. ${validRows} rows passed validation and ${invalidRows} rows had unfixable errors. ${stats.correctedCount || 0} rows were auto-corrected.`,
    recommendations: [
      "Review invalid rows in the error report CSV for specific issues.",
      "Standardise date formats to YYYY-MM-DD before upload.",
      "Verify phone numbers match the expected digit count for each country.",
    ],
    topIssue,
  };
}
