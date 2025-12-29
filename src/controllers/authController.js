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
        message: 'Por favor, entre com o Email e Senha',
      });
    }

    // 2. Check if user exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou Senha inválidos',
      });
    }

    // 3. Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'Sua conta está inativa. Entre em contato com o administrador.',
      });
    }

    // 4. Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Imail ou Senha inválidos',
      });
    }

    // =================================================================
    //                🛑 TOLL: REQUIRING PASSWORD CHANGE
    // =================================================================
    if (user.must_change_password) {
      // We generated a token, but received a specific 403 (Forbidden) error.
      // The frontend will read the code 'PASSWORD_CHANGE_REQUIRED' and redirect to the password change screen.
      const tempToken = signToken(user.id, user.email, user.role);

      return res.status(403).json({
        status: 'fail',
        code: 'PASSWORD_CHANGE_REQUIRED', // The frontend uses this to know what to do.
        message: 'É necessário alterar sua senha no primeiro acesso.',
        token: tempToken, // Temporary token to enable the exchange request.
      });
    }
    // =================================================================

    // 5. If everything ok, send token to client
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
      message: 'Erro interno do servidor',
    });
  }
};

/**
 * @desc    Forgot Password - Generate token and mock email sending
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
/**
 * @desc    Forgot Password - Generate token and mock email sending
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Por favor, insira um Email válido.' });
    }

    // 1. Check if user exists
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'Token sent to email (if user exists).',
      });
    }

    // 2. Generate Random Token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Hash the token to save in DB
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 4. Save to Database using MySQL Time (DATE_ADD)
    await db.query(
      `UPDATE users 
       SET password_reset_token = ?, 
           password_reset_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) 
       WHERE email = ?`,
      [passwordResetToken, email],
    );

    // 5. Mock Email Sending
    const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;
    console.log(`🔗 Link de Reset (Simulação): ${resetURL}`);

    console.log('============================================');
    console.log('📧 EMAIL MOCK (Forgot Password)');
    console.log(`To: ${email}`);
    console.log(`Reset Token (Raw): ${resetToken}`);
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
    if (!password) return res.status(400).json({ message: 'Por favor, entre com a nova senha.' });

    // 1. Get token from URL and hash it (to compare with DB)
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // 2. Find user with valid token and not expired
    const [rows] = await db.query(
      'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [hashedToken],
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Token inválido ou expirado.' });
    }

    // 3. Update Password and Clear Tokens
    const newPasswordHash = await bcrypt.hash(password, 10);

    await db.query(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [newPasswordHash, user.id],
    );

    res.status(200).json({
      status: 'success',
      message: 'Senha alterado com sucesso. Por favor faça login novamente.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno' });
  }
};

/**
 * @desc    Change password (can be used on first login or in profile)
 * @route   POST /api/auth/change-password
 * @access  Private (Requer Token)
 */
exports.changePassword = async (req, res) => {
  try {
    // 1. We retrieved the current password and the new password from the body.
    const { currentPassword, newPassword } = req.body;

    // 2. The ID comes from the JWT Token (thanks to the 'protect' middleware).
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Informe a senha atual e a nova senha.' });
    }

    // 3. We searched for the user in the database to check their current password.
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // 4. Check if the "Current Password" matches the one on file with the bank.
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'A senha atual está incorreta.' });
    }

    // 5. Encrypt the NEW password
    const newHash = await bcrypt.hash(newPassword, 10);

    // 6. Update the database and remove the must_change_password flag.
    await db.query('UPDATE users SET password = ?, must_change_password = FALSE WHERE id = ?', [
      newHash,
      userId,
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Senha alterada com sucesso! Você já pode usar o sistema normalmente.',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Erro interno ao trocar senha.' });
  }
};
