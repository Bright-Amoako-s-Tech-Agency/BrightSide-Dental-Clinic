export function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? "Internal server error" : err.message,
    },
  });
}
