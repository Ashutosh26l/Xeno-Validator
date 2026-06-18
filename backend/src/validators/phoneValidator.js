// src/validators/phoneValidator.js
// Country-based phone number validation per spec §8.2.
// Strips formatting, removes country code prefix, then checks digit count.

const COUNTRY_PHONE_RULES = {
  "india":     { digits: 10, code: "91"  },
  "singapore": { digits: 8,  code: "65"  },
  "usa":       { digits: 10, code: "1"   },
  "uk":        { digits: 10, code: "44"  },
  "australia": { digits: 9,  code: "61"  },
  "uae":       { digits: 9,  code: "971" },
  "germany":   { digits: 10, code: "49"  },
  "france":    { digits: 9,  code: "33"  },
};

/**
 * Validates a phone number for a given country.
 *
 * @param {string} phone   — raw phone value from CSV
 * @param {string} country — country value from same row (already normalised)
 * @param {number} rowNumber — 1-indexed row for error reporting
 * @returns {{ valid: boolean, corrected?: string, error?: object }}
 */
export function validatePhone(phone, country, rowNumber) {
  const countryKey = (country || "").trim().toLowerCase();
  const rules = COUNTRY_PHONE_RULES[countryKey];

  // If country not in our rules → skip phone validation
  if (!rules) {
    return { valid: true };
  }

  // Step 0: Handle Excel scientific notation (e.g., 1.42E+10 → 14200000000)
  let rawPhone = (phone || "").trim();
  if (/^[\d.]+[eE][+\-]?\d+$/.test(rawPhone)) {
    const num = Number(rawPhone);
    if (Number.isFinite(num) && num > 0) {
      rawPhone = num.toFixed(0);
    }
  }

  // Step 1: Strip all spaces, dashes, dots, parentheses
  let cleaned = rawPhone.replace(/[\s\-.\(\)]/g, "");

  // Step 2: Remove leading +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  // Track if we modified the phone (for auto-correction logging)
  const wasModified = cleaned !== (phone || "").trim();

  // Step 3: Strip country code prefix if present
  if (cleaned.startsWith(rules.code)) {
    cleaned = cleaned.slice(rules.code.length);
  }

  // Step 4: Count digits
  const digitCount = cleaned.replace(/\D/g, "").length;

  // Step 5: Compare against expected
  if (digitCount !== rules.digits) {
    return {
      valid: false,
      error: {
        row_number: rowNumber,
        field_name: "phone",
        error_type: "phone",
        error_message: `Invalid phone number for ${country}. Expected ${rules.digits} digits, got ${digitCount}.`,
        original_value: phone,
        suggestion: `Ensure phone number has exactly ${rules.digits} digits without country code.`,
      },
    };
  }

  // Valid — return cleaned version as correction if formatting was different
  if (wasModified || (phone || "").trim() !== cleaned) {
    return {
      valid: true,
      corrected: cleaned,
      correction: {
        row_number: rowNumber,
        field_name: "phone",
        error_type: "corrected",
        error_message: `Phone number reformatted for ${country}.`,
        original_value: phone,
        suggestion: cleaned,
      },
    };
  }

  return { valid: true };
}

export { COUNTRY_PHONE_RULES };
