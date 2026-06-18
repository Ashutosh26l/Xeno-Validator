// src/validators/dateValidator.js
// Multi-format date parsing + logical validation per spec §8.3.
// Auto-corrects to YYYY-MM-DD when a non-primary format matches.

const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function maxDay(month, year) {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month];
}

/**
 * Tries to parse a date string against the accepted formats.
 * Returns { year, month, day } on success or null on failure.
 */
function tryParse(value) {
  const v = (value || "").trim();
  if (!v) return null;

  // YYYY-MM-DD  (primary)
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3], format: "YYYY-MM-DD" };

  // YYYY/MM/DD
  m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3], format: "YYYY/MM/DD" };

  // DD-MM-YYYY
  m = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return { year: +m[3], month: +m[2], day: +m[1], format: "DD-MM-YYYY" };

  // DD/MM/YYYY
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return { year: +m[3], month: +m[2], day: +m[1], format: "DD/MM/YYYY" };

  // DD-MM-YY (2-digit year)
  m = v.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
  if (m) {
    const shortYear = +m[3];
    const fullYear = shortYear <= 30 ? 2000 + shortYear : 1900 + shortYear;
    return { year: fullYear, month: +m[2], day: +m[1], format: "DD-MM-YY" };
  }

  // DD/MM/YY (2-digit year)
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (m) {
    const shortYear = +m[3];
    const fullYear = shortYear <= 30 ? 2000 + shortYear : 1900 + shortYear;
    return { year: fullYear, month: +m[2], day: +m[1], format: "DD/MM/YY" };
  }

  // MM/DD/YYYY — try this ONLY if day <= 12 would also be valid for DD/MM,
  // but since DD/MM is matched above, this only catches MM > 12 in first slot
  // which would fail DD/MM anyway. We handle ambiguity by preferring DD/MM first.
  // Actually we need a separate pass: if the DD/MM/YYYY parse above fails logical
  // checks, we try MM/DD/YYYY. Handled in validateDate below.

  // DD MMM YYYY  (e.g., "15 Apr 2025")
  m = v.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (m) {
    const monthNum = MONTH_MAP[m[2].toLowerCase()];
    if (monthNum) return { year: +m[3], month: monthNum, day: +m[1], format: "DD MMM YYYY" };
  }

  return null;
}

/**
 * Validate logical constraints on a parsed date.
 */
function logicalCheck(parsed) {
  if (!parsed) return false;
  const { year, month, day } = parsed;
  if (year < 2000 || year > 2030) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > maxDay(month, year)) return false;
  return true;
}

/**
 * Formats a parsed date as YYYY-MM-DD.
 */
function toISO(parsed) {
  const y = String(parsed.year);
  const m = String(parsed.month).padStart(2, "0");
  const d = String(parsed.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Validates and optionally auto-corrects a date value.
 *
 * @param {string} dateValue — raw date string from CSV
 * @param {number} rowNumber — 1-indexed row
 * @returns {{ valid: boolean, corrected?: string, error?: object, correction?: object }}
 */
export function validateDate(dateValue, rowNumber) {
  let parsed = tryParse(dateValue);

  // If DD/MM/YYYY parse failed logical check, try MM/DD/YYYY interpretation
  if (parsed && !logicalCheck(parsed) && parsed.format === "DD/MM/YYYY") {
    // Swap month and day for MM/DD/YYYY interpretation
    const swapped = { year: parsed.year, month: parsed.day, day: parsed.month, format: "MM/DD/YYYY" };
    if (logicalCheck(swapped)) {
      parsed = swapped;
    }
  }

  if (!parsed || !logicalCheck(parsed)) {
    return {
      valid: false,
      error: {
        row_number: rowNumber,
        field_name: "order_date",
        error_type: "date",
        error_message: `Invalid date format. Got '${dateValue}'.`,
        original_value: dateValue,
        suggestion: "Use YYYY-MM-DD format (e.g. 2025-04-15).",
      },
    };
  }

  const iso = toISO(parsed);

  // If already in primary format → valid, no correction needed
  if (parsed.format === "YYYY-MM-DD") {
    return { valid: true };
  }

  // Non-primary format → silently standardize
  return {
    valid: true,
    corrected: iso,
  };
}
