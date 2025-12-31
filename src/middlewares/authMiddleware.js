const jwt = require('jsonwebtoken');


//SOMENTE PARA TESTE - EXCLUIR DEPOIS
exports.protect = async (req, res, next) => {
  // --- DEBUG AUTH (Início) ---
  console.log('--- DEBUG AUTH ---');
  console.log('Header recebido:', req.headers.authorization);
  console.log('------------------');
  // --- DEBUG AUTH (Fim) ---

  // ... aqui continua o código original da sua função (verificação do token, etc) ...
  // Lembre-se que o código original deve estar aqui dentro!
  
  // Exemplo genérico do restante, só para ilustrar o fechamento:
  /*
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('Você não está logado!', 401));
  }
  // ... verificação do token ...
  next();
  */

}; // <--- O FECHAMENTO QUE FALTOU

/**
 * Middleware to protect routes.
 * Verifies the JWT token from the 'Authorization' header.
 */
exports.protect = (req, res, next) => {
  // 1. Get token from header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
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
  } catch (_error) {
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
