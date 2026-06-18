// src/middleware/errorHandler.js
// Global Express error handler — catches anything thrown by routes
// and returns a consistent JSON shape per spec §20.

export function errorHandler(err, _req, res, _next) {
  console.error("[errorHandler]", err);

  // Multer-specific errors (file too large, wrong type, etc.)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "File too large. Maximum size is 100 MB.",
      code: 413,
    });
  }

  if (err.message === "Only CSV files are allowed.") {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 400,
    });
  }

  const status = err.statusCode || err.status || 500;
  const message =
    status === 500 ? "Internal server error." : err.message || "Unknown error.";

  return res.status(status).json({
    success: false,
    error: message,
    code: status,
  });
}
