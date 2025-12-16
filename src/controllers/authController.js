const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

/**
 * Generate JWT Token
 */
const signToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

/**
 * @desc    User Login
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Por favor, entre com Email e Senha.',
      });
    }

    // 2. Check if user exists (include password field explicitly if hidden by default)
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou Senha invalidos',
      });
    }

    // 3. Check if password is correct
    // (compares unencrypted 'password' with encrypted 'user.password')
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou Senha invalidos.',
      });
    }

    // 4. If everything ok, send token to client
    const token = signToken(user.id, user.email, user.role);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do Servidor.',
    });
  }
};