const rateLimit = require('express-rate-limit');

const apiLimiterConfig = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
  }
});

const loginLimiterConfig = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, // Bloqueia após 5 tentativas
  message: {
    status: 'error',
    message: 'Muitas tentativas de login. Tente novamente em mais tarde.'
  }
});

/**
 * Wrapper inteligente
 */
const limiterWrapper = (limiterInstance) => {
  return (req, res, next) => {
    // If it's a test and we're not forcing a rate limit test, skip it.
    if (process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMIT !== 'true') {
      return next();
    }
    return limiterInstance(req, res, next);
  };
};

module.exports = {
  apiLimiter: limiterWrapper(apiLimiterConfig),
  loginLimiter: limiterWrapper(loginLimiterConfig)
};