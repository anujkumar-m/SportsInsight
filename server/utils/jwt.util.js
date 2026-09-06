const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'sports_academy_access_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'sports_academy_refresh_secret_key_2026';

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    issuer: 'sports-academy',
    audience: 'sports-academy-client',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    issuer: 'sports-academy',
    audience: 'sports-academy-client',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    issuer: 'sports-academy',
    audience: 'sports-academy-client',
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'sports-academy',
    audience: 'sports-academy-client',
  });
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
