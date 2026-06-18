// src/validators/paymentValidator.js
// Payment mode + payment status validation with auto-correction per spec §8.4 / §8.5.

const VALID_PAYMENT_MODES = ["UPI", "Card", "NetBanking", "Wallet"];

const PAYMENT_MODE_CORRECTIONS = {
  // UPI variants
  "upi":             "UPI",
  "Upi":             "UPI",
  "UPI":             "UPI",
  "gpay":            "UPI",
  "phonepe":         "UPI",
  "paytm":           "UPI",
  "google pay":      "UPI",
  "phone pe":        "UPI",
  // Card variants
  "card":            "Card",
  "CARD":            "Card",
  "Card":            "Card",
  "credit card":     "Card",
  "Credit Card":     "Card",
  "credit_card":     "Card",
  "CreditCard":      "Card",
  "creditcard":      "Card",
  "CREDIT CARD":     "Card",
  "debit card":      "Card",
  "Debit Card":      "Card",
  "debit_card":      "Card",
  "DebitCard":       "Card",
  "debitcard":       "Card",
  "DEBIT CARD":      "Card",
  "visa":            "Card",
  "mastercard":      "Card",
  "Visa":            "Card",
  "Mastercard":      "Card",
  // NetBanking variants
  "netbanking":      "NetBanking",
  "net_banking":     "NetBanking",
  "net banking":     "NetBanking",
  "NETBANKING":      "NetBanking",
  "NetBanking":      "NetBanking",
  "Net Banking":     "NetBanking",
  "online banking":  "NetBanking",
  "bank transfer":   "NetBanking",
  "neft":            "NetBanking",
  "imps":            "NetBanking",
  // Wallet variants
  "wallet":          "Wallet",
  "WALLET":          "Wallet",
  "Wallet":          "Wallet",
  "e-wallet":        "Wallet",
  "ewallet":         "Wallet",
  // COD → Wallet (closest match)
  "cod":             "Wallet",
  "COD":             "Wallet",
  "cash on delivery": "Wallet",
  "Cash on Delivery": "Wallet",
};

const VALID_PAYMENT_STATUSES = ["Completed", "Pending", "Failed", "Refunded"];

const PAYMENT_STATUS_CORRECTIONS = {};
// Build case-insensitive corrections for statuses
for (const s of VALID_PAYMENT_STATUSES) {
  PAYMENT_STATUS_CORRECTIONS[s] = s;
  PAYMENT_STATUS_CORRECTIONS[s.toLowerCase()] = s;
  PAYMENT_STATUS_CORRECTIONS[s.toUpperCase()] = s;
}

// Common aliases for payment statuses
const STATUS_ALIASES = {
  "paid":       "Completed",
  "Paid":       "Completed",
  "PAID":       "Completed",
  "done":       "Completed",
  "Done":       "Completed",
  "DONE":       "Completed",
  "success":    "Completed",
  "Success":    "Completed",
  "SUCCESS":    "Completed",
  "successful": "Completed",
  "Successful": "Completed",
  "confirmed":  "Completed",
  "Confirmed":  "Completed",
  "unpaid":     "Pending",
  "Unpaid":     "Pending",
  "UNPAID":     "Pending",
  "processing": "Pending",
  "Processing": "Pending",
  "in progress": "Pending",
  "In Progress": "Pending",
  "cancelled":  "Failed",
  "Cancelled":  "Failed",
  "canceled":   "Failed",
  "Canceled":   "Failed",
  "rejected":   "Failed",
  "Rejected":   "Failed",
  "returned":   "Refunded",
  "Returned":   "Refunded",
};
Object.assign(PAYMENT_STATUS_CORRECTIONS, STATUS_ALIASES);

/**
 * Validates payment_mode field.
 *
 * @param {string} mode — raw payment_mode value
 * @param {number} rowNumber
 * @returns {{ valid: boolean, corrected?: string, error?: object, correction?: object }}
 */
export function validatePaymentMode(mode, rowNumber) {
  const trimmed = (mode || "").trim();

  const corrected = PAYMENT_MODE_CORRECTIONS[trimmed];

  if (corrected) {
    // Was already correct or just needed case-fix
    if (trimmed === corrected) {
      return { valid: true };
    }
    return {
      valid: true,
      corrected,
      correction: {
        row_number: rowNumber,
        field_name: "payment_mode",
        error_type: "corrected",
        error_message: `Payment mode auto-corrected from '${trimmed}' to '${corrected}'.`,
        original_value: mode,
        suggestion: corrected,
      },
    };
  }

  // Not correctable
  return {
    valid: false,
    error: {
      row_number: rowNumber,
      field_name: "payment_mode",
      error_type: "payment",
      error_message: `Invalid payment mode '${trimmed}'. Allowed: ${VALID_PAYMENT_MODES.join(", ")}.`,
      original_value: mode,
      suggestion: `Use one of: ${VALID_PAYMENT_MODES.join(", ")}.`,
    },
  };
}

/**
 * Validates payment_status field.
 *
 * @param {string} status — raw payment_status value
 * @param {number} rowNumber
 * @returns {{ valid: boolean, corrected?: string, error?: object, correction?: object }}
 */
export function validatePaymentStatus(status, rowNumber) {
  const trimmed = (status || "").trim();

  const corrected = PAYMENT_STATUS_CORRECTIONS[trimmed];

  if (corrected) {
    if (trimmed === corrected) {
      return { valid: true };
    }
    return {
      valid: true,
      corrected,
      correction: {
        row_number: rowNumber,
        field_name: "payment_status",
        error_type: "corrected",
        error_message: `Payment status auto-corrected from '${trimmed}' to '${corrected}'.`,
        original_value: status,
        suggestion: corrected,
      },
    };
  }

  return {
    valid: false,
    error: {
      row_number: rowNumber,
      field_name: "payment_status",
      error_type: "payment",
      error_message: `Invalid payment status '${trimmed}'. Allowed: ${VALID_PAYMENT_STATUSES.join(", ")}.`,
      original_value: status,
      suggestion: `Use one of: ${VALID_PAYMENT_STATUSES.join(", ")}.`,
    },
  };
}
