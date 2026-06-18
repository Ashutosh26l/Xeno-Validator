// src/services/qualityService.js
// Quality score calculation per spec §13.

/**
 * Calculates the overall quality score as a percentage with 1 decimal place.
 */
export function calculateScore(totalRows, validRows) {
  if (totalRows === 0) return 0;
  return Math.round((validRows / totalRows) * 100 * 10) / 10;
}

/**
 * Calculates a detailed quality breakdown from the error log.
 *
 * @param {number} totalRows
 * @param {object[]} errorLog — array of error objects with error_type field
 * @returns {{
 *   completeness: number,
 *   accuracy: number,
 *   consistency: number,
 *   correctedCount: number,
 *   errorBreakdown: object
 * }}
 */
export function calculateBreakdown(totalRows, errorLog) {
  if (totalRows === 0) {
    return {
      completeness: 100,
      accuracy: 100,
      consistency: 100,
      correctedCount: 0,
      errorBreakdown: {
        phoneErrors: 0, dateErrors: 0, paymentErrors: 0,
        integrityErrors: 0, duplicateErrors: 0, missingErrors: 0,
      },
    };
  }

  const phoneErrors     = errorLog.filter((e) => e.error_type === "phone").length;
  const dateErrors      = errorLog.filter((e) => e.error_type === "date").length;
  const paymentErrors   = errorLog.filter((e) => e.error_type === "payment").length;
  const integrityErrors = errorLog.filter((e) => e.error_type === "integrity").length;
  const duplicateErrors = errorLog.filter((e) => e.error_type === "duplicate").length;
  const missingErrors   = errorLog.filter((e) => e.error_type === "missing").length;
  const corrected       = errorLog.filter((e) => e.error_type === "corrected").length;

  return {
    completeness: Math.max(0, Math.round(((totalRows - missingErrors) / totalRows) * 100)),
    accuracy:     Math.max(0, Math.round(((totalRows - phoneErrors - dateErrors - paymentErrors) / totalRows) * 100)),
    consistency:  Math.max(0, Math.round(((totalRows - duplicateErrors - integrityErrors) / totalRows) * 100)),
    correctedCount: corrected,
    errorBreakdown: {
      phoneErrors,
      dateErrors,
      paymentErrors,
      integrityErrors,
      duplicateErrors,
      missingErrors,
    },
  };
}
