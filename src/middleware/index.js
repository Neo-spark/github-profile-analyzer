/**
 * Request logger middleware
 * Logs: METHOD  /path  → status  (Xms)
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode >= 500 ? '\x1b[31m' : // red
      res.statusCode >= 400 ? '\x1b[33m' : // yellow
      res.statusCode >= 200 ? '\x1b[32m' : // green
      '\x1b[0m';

    console.log(
      `${statusColor}[${new Date().toISOString()}] ${req.method.padEnd(6)} ${req.originalUrl.padEnd(50)} → ${res.statusCode}  (${duration}ms)\x1b[0m`
    );
  });

  next();
};

/**
 * Global error handler middleware
 * Catches errors thrown from async controllers (when using a wrapper or express 5).
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);

  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler — must be registered LAST before errorHandler
 */
const notFound = (req, res) => {
  res.status(404).json({
    error: `Route '${req.method} ${req.originalUrl}' not found`,
    availableRoutes: [
      'POST   /api/github/analyze/:username',
      'GET    /api/github/profiles',
      'GET    /api/github/profiles/:username',
      'GET    /api/github/profiles/search?username=query',
      'DELETE /api/github/profiles/:username',
    ],
  });
};

module.exports = { requestLogger, errorHandler, notFound };
