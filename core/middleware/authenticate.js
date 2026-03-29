const { verifyAccessToken } = require('../auth/jwt');

/**
 * Express middleware – verifies Bearer token and attaches req.user.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const token = header.slice(7);
  try {
    req.user = await verifyAccessToken(token);
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: message });
  }
}

module.exports = authenticate;
