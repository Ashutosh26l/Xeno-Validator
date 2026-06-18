// src/validators/columnValidator.js
// Phase 1: parses headers from the first line of the CSV buffer and
// checks for missing / extra columns.

import { parse } from "csv-parse/sync";

// Canonical column list from spec §7
export const EXPECTED_COLUMNS = [
  "order_id",
  "order_date",
  "customer_name",
  "phone",
  "country",
  "product_name",
  "quantity",
  "price",
  "payment_mode",
  "payment_status",
];

function guessMapping(missingColumns, extraColumns, sampleRows) {
  const suggestedMappings = {};
  
  const extraValues = {};
  for (const extraCol of extraColumns) {
    extraValues[extraCol] = sampleRows.map(row => row[extraCol]).filter(v => v);
  }

  for (const missingCol of missingColumns) {
    for (const extraCol of extraColumns) {
      if (suggestedMappings[missingCol] || Object.values(suggestedMappings).includes(extraCol)) continue;

      const vals = extraValues[extraCol];
      if (vals.length === 0) continue;

      // Lexical similarity first
      if (extraCol.includes(missingCol) || missingCol.includes(extraCol) || 
         (missingCol === 'price' && extraCol.includes('cost')) ||
         (missingCol === 'phone' && extraCol.includes('contact'))) {
         suggestedMappings[missingCol] = extraCol;
         continue;
      }

      // Value-based heuristics
      if (missingCol === "price" || missingCol === "quantity") {
        const allNumeric = vals.every(v => !isNaN(parseFloat(v)));
        if (allNumeric) suggestedMappings[missingCol] = extraCol;
      } 
      else if (missingCol === "phone") {
        const allPhoneLike = vals.every(v => /^[\+\d\-\s()]{8,20}$/.test(v));
        if (allPhoneLike) suggestedMappings[missingCol] = extraCol;
      }
      else if (missingCol === "order_date") {
        const allDateLike = vals.every(v => /^[\d\/\-\.]{6,14}$/.test(v));
        if (allDateLike) suggestedMappings[missingCol] = extraCol;
      }
    }
  }

  return suggestedMappings;
}

/**
 * Parses the header row and first 10 data rows from a CSV buffer.
 *
 * Returns one of:
 *   { valid: false, reason, missingColumns }          — reject the file
 *   { valid: true, needsMapping: true, extraColumns, missingColumns, suggestedMappings } — prompt user
 *   { valid: true, needsMapping: false }              — proceed to row validation
 *
 * @param {Buffer} csvBuffer  — raw CSV file buffer
 */
export function validateColumns(csvBuffer) {
  let records = [];
  try {
    records = parse(csvBuffer, {
      to_line: 10,
      columns: headers => headers.map(h => h.trim().toLowerCase().replace(/^"|"$/g, "")),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    return { valid: false, reason: "CSV file is empty or invalid format.", missingColumns: EXPECTED_COLUMNS };
  }

  if (records.length === 0) {
    return { valid: false, reason: "CSV file is empty or missing headers.", missingColumns: EXPECTED_COLUMNS };
  }

  const headers = Object.keys(records[0]);
  const missingColumns = EXPECTED_COLUMNS.filter((col) => !headers.includes(col));
  const extraColumns   = headers.filter((col) => !EXPECTED_COLUMNS.includes(col));

  if (missingColumns.length > 0) {
    if (extraColumns.length > 0) {
       // We have missing columns AND extra columns -> suggest mappings
       const suggestedMappings = guessMapping(missingColumns, extraColumns, records);
       return {
         valid: true,
         needsMapping: true,
         extraColumns,
         missingColumns,
         suggestedMappings
       };
    } else {
       // Missing columns but NO extra columns to map from -> reject
       return {
         valid: false,
         reason: `Missing required columns: ${missingColumns.join(", ")}`,
         missingColumns,
       };
    }
  }

  if (extraColumns.length > 0) {
    return {
      valid: true,
      needsMapping: true,
      extraColumns,
      missingColumns: [],
      suggestedMappings: {}
    };
  }

  return { valid: true, needsMapping: false };
}
