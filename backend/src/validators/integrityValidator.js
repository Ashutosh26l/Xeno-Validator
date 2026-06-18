// src/validators/integrityValidator.js
// Data integrity checks per spec §8.5:
//   1. Null / empty check on required fields
//   2. Duplicate order_id detection
//   3. Data type checks (quantity = int, price = float)
//   4. Range checks (quantity > 0, price > 0)

const REQUIRED_FIELDS = [
  "order_id",
  "customer_name",
  "phone",
  "country",
  "product_name",
];

// Known country names for auto-correction (case normalisation)
const COUNTRY_CORRECTIONS = {
  "india": "India", "INDIA": "India",
  "singapore": "Singapore", "SINGAPORE": "Singapore",
  "usa": "USA",
  "uk": "UK",
  "australia": "Australia", "AUSTRALIA": "Australia",
  "uae": "UAE",
  "germany": "Germany", "GERMANY": "Germany",
  "france": "France", "FRANCE": "France",
};

/**
 * Checks a single row for null/empty required fields.
 * @returns {object[]} array of error objects (may be empty)
 */
export function checkMissing(row, rowNumber) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const val = (row[field] || "").toString().trim();
    if (!val) {
      errors.push({
        row_number: rowNumber,
        field_name: field,
        error_type: "missing",
        error_message: `Missing required field: ${field}`,
        original_value: row[field] ?? "",
        suggestion: `Provide a valid ${field}.`,
      });
    }
  }
  return errors;
}

/**
 * Checks quantity and price for correct types and positive ranges.
 * @returns {{ errors: object[], correctedRow: object }}
 */
export function checkTypesAndRanges(row, rowNumber) {
  const errors = [];

  // Quantity — must be parseable as integer, > 0
  const qtyRaw = (row.quantity || "").toString().trim();
  const qty = parseInt(qtyRaw, 10);
  if (isNaN(qty)) {
    errors.push({
      row_number: rowNumber,
      field_name: "quantity",
      error_type: "integrity",
      error_message: `Invalid type for quantity. Expected integer, got '${qtyRaw}'.`,
      original_value: qtyRaw,
      suggestion: "Ensure quantity is a positive whole number.",
    });
  } else if (qty <= 0) {
    errors.push({
      row_number: rowNumber,
      field_name: "quantity",
      error_type: "integrity",
      error_message: `Invalid value for quantity: ${qty}. Must be greater than 0.`,
      original_value: qtyRaw,
      suggestion: "Ensure quantity is a positive whole number.",
    });
  }

  // Price — must be parseable as float, > 0
  const priceRaw = (row.price || "").toString().trim();
  const price = parseFloat(priceRaw);
  if (isNaN(price)) {
    errors.push({
      row_number: rowNumber,
      field_name: "price",
      error_type: "integrity",
      error_message: `Invalid type for price. Expected number, got '${priceRaw}'.`,
      original_value: priceRaw,
      suggestion: "Ensure price is a positive number.",
    });
  } else if (price <= 0) {
    errors.push({
      row_number: rowNumber,
      field_name: "price",
      error_type: "integrity",
      error_message: `Invalid value for price: ${price}. Must be greater than 0.`,
      original_value: priceRaw,
      suggestion: "Ensure price is a positive number.",
    });
  }

  return { errors };
}

/**
 * Builds a Set-based duplicate detector.
 * Call once before the row loop, then call `check(orderId, rowNumber)` per row.
 */
export function createDuplicateChecker() {
  const seen = new Map(); // order_id → first row number

  return {
    /**
     * @returns {object|null} error object if duplicate, null otherwise
     */
    check(orderId, rowNumber) {
      const id = (orderId || "").toString().trim();
      if (!id) return null; // missing-field check handles this

      if (seen.has(id)) {
        return {
          row_number: rowNumber,
          field_name: "order_id",
          error_type: "duplicate",
          error_message: `Duplicate order_id: ${id}. Already seen at row ${seen.get(id)}.`,
          original_value: id,
          suggestion: "Ensure each order has a unique ID.",
        };
      }

      seen.set(id, rowNumber);
      return null;
    },
  };
}

/**
 * Auto-correct country casing.
 * @returns {{ corrected?: string, correction?: object }}
 */
export function correctCountry(country, rowNumber) {
  const trimmed = (country || "").trim();
  const key = trimmed.toLowerCase();
  const corrected = COUNTRY_CORRECTIONS[key] || COUNTRY_CORRECTIONS[trimmed];

  if (corrected && corrected !== trimmed) {
    return {
      corrected,
      correction: {
        row_number: rowNumber,
        field_name: "country",
        error_type: "corrected",
        error_message: `Country auto-corrected from '${trimmed}' to '${corrected}'.`,
        original_value: country,
        suggestion: corrected,
      },
    };
  }

  return {};
}
