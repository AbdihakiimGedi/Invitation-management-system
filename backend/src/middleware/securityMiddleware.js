const SUSPICIOUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

function scrubPrototypePollution(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    value.forEach(scrubPrototypePollution);
    return value;
  }

  for (const key of Object.keys(value)) {
    if (SUSPICIOUS_KEYS.has(key)) {
      delete value[key];
    } else {
      scrubPrototypePollution(value[key]);
    }
  }
  return value;
}

function sanitizeRequest(req, res, next) {
  scrubPrototypePollution(req.body);
  scrubPrototypePollution(req.query);
  scrubPrototypePollution(req.params);
  next();
}

module.exports = {
  sanitizeRequest,
  securityHeaders,
};
