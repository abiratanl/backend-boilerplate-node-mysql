const crypto = require('crypto'); // Built-in Node module
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

/**
 * Helper function to generate JWT Token
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
        message: 'Please provide email and password',
      });
    }

    // 2. Check if user exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password',
      });
    }

    // 3. Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password',
      });
    }

    // 4. If everything ok, send token to client
    const token = signToken(user.id, user.email, user.role);

    // Remove password from output (security)
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
      message: 'Internal Server Error',
    });
  }
};

/**
 * @desc    Forgot Password - Generate token and mock email sending
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Por favor, insira um Email válido.' });
    }

    // 1. Check if user exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      // Security: Do not reveal if the email exists or not
      return res.status(200).json({ 
        status: 'success', 
        message: 'Token sent to email (if user exists).' 
      });
    }

    // 2. Generate Random Token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Hash the token to save in DB (Security Best Practice)
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 4. Set expiration (10 minutes from now)
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    // 5. Save to Database
    await db.query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE email = ?',
      [passwordResetToken, passwordResetExpires, email]
    );

    // 6. Mock Email Sending
    // In a real app, you would use Nodemailer here.
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    console.log('============================================');
    console.log('📧 EMAIL MOCK (Forgot Password)');
    console.log(`To: ${email}`);
    console.log(`Reset Token (Raw): ${resetToken}`);
    console.log(`Reset Link: ${resetURL}`);
    console.log('============================================');

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

/**
 * @desc    Reset Password - Set new password using valid token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Please provide a new password.' });

    // 1. Get token from URL and hash it (to compare with DB)
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // 2. Find user with valid token and not expired
    const [rows] = await db.query(
      'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [hashedToken]
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Token is invalid or has expired.' });
    }

    // 3. Update Password and Clear Tokens
    const newPasswordHash = await bcrypt.hash(password, 10);

    await db.query(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [newPasswordHash, user.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Senha alterado com sucesso. Por favor faça log in novamente.',
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno' });
  }
};