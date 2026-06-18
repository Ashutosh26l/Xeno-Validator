// src/services/validationService.js
// Orchestrates all validators against the parsed CSV rows.
// Returns clean_rows, invalid_rows, error_log, and correction_log.

import { parse } from "csv-parse/sync";
import { validatePhone } from "../validators/phoneValidator.js";
import { validateDate } from "../validators/dateValidator.js";
import { validatePaymentMode, validatePaymentStatus } from "../validators/paymentValidator.js";
import {
  checkMissing,
  checkTypesAndRanges,
  createDuplicateChecker,
  correctCountry,
} from "../validators/integrityValidator.js";
import { EXPECTED_COLUMNS } from "../validators/columnValidator.js";

/**
 * Run the full validation pipeline on a CSV buffer.
 *
 * @param {Buffer} csvBuffer — raw CSV file
 * @param {object|null} columnMapping — { "extra_col": "expected_col" | null }
 * @returns {{
 *   totalRows: number,
 *   cleanRows: object[],
 *   invalidRows: object[],
 *   errorLog: object[],
 *   correctionLog: object[],
 * }}
 */
export function runValidation(csvBuffer, columnMapping = null) {
  // ── Parse CSV ──────────────────────────────────────────────────────────────
  const records = parse(csvBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  // ── Apply column mapping (rename extra cols → expected cols) ────────────────
  if (columnMapping) {
    for (const record of records) {
      for (const [expectedCol, extraCol] of Object.entries(columnMapping)) {
        if (extraCol && extraCol in record) {
          record[expectedCol] = record[extraCol];
          delete record[extraCol];
        }
      }
    }
  }

  // Normalise header keys to lowercase
  const normalisedRecords = records.map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      out[k.toLowerCase().trim()] = v;
    }
    return out;
  });

  const totalRows = normalisedRecords.length;
  const cleanRows = [];
  const invalidRows = [];
  const errorLog = [];
  const correctionLog = [];

  const dupeChecker = createDuplicateChecker();

  // ── Row-level validation ───────────────────────────────────────────────────
  for (let i = 0; i < normalisedRecords.length; i++) {
    const row = { ...normalisedRecords[i] }; // mutable copy
    const rowNumber = i + 1; // 1-indexed (first data row after header)
    const rowErrors = [];
    const rowCorrections = [];

    // 1. Missing / null checks
    const missingErrs = checkMissing(row, rowNumber);
    rowErrors.push(...missingErrs);

    // 2. Duplicate order_id
    const dupeErr = dupeChecker.check(row.order_id, rowNumber);
    if (dupeErr) rowErrors.push(dupeErr);

    // 3. Type and range checks (quantity, price)
    const { errors: typeErrs } = checkTypesAndRanges(row, rowNumber);
    rowErrors.push(...typeErrs);

    // 4. Country auto-correction
    const { corrected: correctedCountry, correction: countryCorr } =
      correctCountry(row.country, rowNumber);
    if (correctedCountry) {
      row.country = correctedCountry;
      if (countryCorr) rowCorrections.push(countryCorr);
    }

    // 5. Phone validation (uses possibly-corrected country)
    const phoneResult = validatePhone(row.phone, row.country, rowNumber);
    if (!phoneResult.valid) {
      rowErrors.push(phoneResult.error);
    } else if (phoneResult.corrected) {
      row.phone = phoneResult.corrected;
      if (phoneResult.correction) rowCorrections.push(phoneResult.correction);
    }

    // 6. Date validation
    const dateResult = validateDate(row.order_date, rowNumber);
    if (!dateResult.valid) {
      rowErrors.push(dateResult.error);
    } else if (dateResult.corrected) {
      row.order_date = dateResult.corrected;
      if (dateResult.correction) rowCorrections.push(dateResult.correction);
    }

    // 7. Payment mode validation
    const modeResult = validatePaymentMode(row.payment_mode, rowNumber);
    if (!modeResult.valid) {
      rowErrors.push(modeResult.error);
    } else if (modeResult.corrected) {
      row.payment_mode = modeResult.corrected;
      if (modeResult.correction) rowCorrections.push(modeResult.correction);
    }

    // 8. Payment status validation
    const statusResult = validatePaymentStatus(row.payment_status, rowNumber);
    if (!statusResult.valid) {
      rowErrors.push(statusResult.error);
    } else if (statusResult.corrected) {
      row.payment_status = statusResult.corrected;
      if (statusResult.correction) rowCorrections.push(statusResult.correction);
    }

    // ── Categorise row ─────────────────────────────────────────────────────
    if (rowErrors.length > 0) {
      // Row has unfixable errors → invalid
      invalidRows.push(normalisedRecords[i]); // original row
      errorLog.push(...rowErrors);
    } else {
      // Row is clean (possibly with auto-corrections applied)
      // Build output row with only expected columns
      const cleanRow = {};
      for (const col of EXPECTED_COLUMNS) {
        cleanRow[col] = row[col] ?? "";
      }
      cleanRows.push(cleanRow);
    }

    // Always log corrections (even for invalid rows)
    correctionLog.push(...rowCorrections);
  }

  // Corrections are also added to errorLog for tracking (spec: "All corrections
  // are recorded in the error log with error_type: 'corrected'")
  errorLog.push(...correctionLog);

  return {
    totalRows,
    cleanRows,
    invalidRows,
    errorLog,
    correctionLog,
  };
}
