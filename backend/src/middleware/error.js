export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (error.name === 'ZodError') {
    return res.status(400).json({ message: 'Validation failed', issues: error.issues });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value', fields: error.keyValue });
  }

  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error'
  });
}
