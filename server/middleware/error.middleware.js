const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // MySQL Connection / Network Errors
  if (err.code === 'ER_SECURE_TRANSPORT_REQUIRED' || err.message?.includes('insecure transport')) {
    return res.status(500).json({
      success: false,
      message: 'Secure connections (SSL/TLS) are required by your database host (e.g. TiDB Cloud). Please set DB_SSL=true in your server .env file.',
      error: err.message,
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(500).json({
      success: false,
      message: `Database connection failed (${err.code}). Please check your MySQL database configuration (DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME) on Vercel backend environment variables.`,
      error: err.message,
    });
  }

  // MySQL Query Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. The record already exists.',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  if (err.code === 'ER_BAD_DB_ERROR') {
    return res.status(500).json({
      success: false,
      message: 'Specified database does not exist on your MySQL server. Please verify DB_NAME on Vercel.',
    });
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({
      success: false,
      message: 'Database access denied. Please verify DB_USER and DB_PASSWORD on Vercel environment variables.',
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
