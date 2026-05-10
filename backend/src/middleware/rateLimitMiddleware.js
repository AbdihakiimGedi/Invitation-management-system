const buckets = new Map();

function getClientKey(req, keyPrefix) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  return `${keyPrefix}:${ip}`;
}

function rateLimit({ windowMs = 60_000, max = 60, keyPrefix = 'global', message = 'Too many requests. Please try again later.' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }

    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60_000).unref();

module.exports = rateLimit;
