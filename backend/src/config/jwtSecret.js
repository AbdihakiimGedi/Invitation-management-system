const JWT_SECRET_MIN_LENGTH = 32;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
    || process.env.SERVICE_BASE64_64_JWT_SECRET
    || process.env.SERVICE_BASE64_JWT_SECRET;

  if (!secret || secret.length < JWT_SECRET_MIN_LENGTH) {
    return null;
  }

  return secret;
};

const getJwtSecretStatus = () => ({
  JWT_SECRET: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
  SERVICE_BASE64_64_JWT_SECRET: process.env.SERVICE_BASE64_64_JWT_SECRET
    ? process.env.SERVICE_BASE64_64_JWT_SECRET.length
    : 0,
  SERVICE_BASE64_JWT_SECRET: process.env.SERVICE_BASE64_JWT_SECRET
    ? process.env.SERVICE_BASE64_JWT_SECRET.length
    : 0,
});

module.exports = {
  getJwtSecret,
  getJwtSecretStatus,
  JWT_SECRET_MIN_LENGTH,
};
