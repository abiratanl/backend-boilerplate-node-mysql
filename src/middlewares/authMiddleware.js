const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes.
 * Verifies the JWT token from the 'Authorization' header.
 */
exports.protect = (req, res, next) => {
  // 1. Get token from header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check if token exists
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Você não está logado! Por favor faça log in.',
    });
  }

  // 3. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Attach user info to the request object
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Senha ou Email inválido, por favor tente novamente.',
    });
  }
};

/**
 * Middleware to restrict access based on user roles (RBAC).
 * @param  {...String} roles - List of allowed roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is set in the 'protect' middleware
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para efetuar esta operação!',
      });
    }
    next();
  };
};