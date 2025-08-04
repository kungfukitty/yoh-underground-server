import jwt from 'jsonwebtoken';

/**
 * Verifies that a request contains a valid JWT in the Authorization header.
 * If valid, the decoded payload is attached to `req.user`.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Ensures the authenticated user has admin privileges.
 */
export function checkAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin privileges required.' });
  }
  next();
}

/**
 * Ensures the authenticated user has accepted the NDA.
 */
export function checkNdaAccepted(req, res, next) {
  if (!req.user?.isNDAAccepted) {
    return res.status(403).json({ message: 'NDA must be accepted before accessing this resource.' });
  }
  next();
}
