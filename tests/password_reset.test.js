require('dotenv').config();
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const db = require('../src/config/database');
const app = require('../src/app');

// User for testing
const testUser = {
  id: uuidv4(),
  name: 'Reset Test User',
  email: 'reset.test@example.com',
  password: 'oldpassword123',
  role: 'atendente',
};

let authToken;

describe('PASSWORD RESET & ME PROFILE TESTS', () => {
  beforeAll(async () => {
    // 1. Clean up potential leftovers
    if (db && db.query) {
      await db.query('DELETE FROM users WHERE email = ?', [testUser.email]);

      // 2. Insert User
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(testUser.password, 10);

      await db.query(
        'INSERT INTO users (id, name, email, password, role, is_active, must_change_password) VALUES (?, ?, ?, ?, ?, true, false)',
        [testUser.id, testUser.name, testUser.email, hash, testUser.role],
      );
    }
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    // await db.end(); // Deixe o Jest gerenciar o encerramento
  });

  // --- /me Tests ---

  it('Should login and get token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.statusCode).toBe(200);
    authToken = res.body.token;
  });

  it('Should GET /me profile using token', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.id).toBe(testUser.id);
  });

  // --- Password Reset Tests ---

  it('Should request password reset token (Forgot Password)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/token sent/i);

    // Verify in DB that token was generated
    const [rows] = await db.query('SELECT password_reset_token FROM users WHERE id = ?', [
      testUser.id,
    ]);
    expect(rows[0].password_reset_token).not.toBeNull();
  });

  it('Should reset password using the token from DB', async () => {
    // 1. Manually inject a known token directly into DB
    const crypto = require('crypto');
    const knownToken = 'my-secret-reset-token';
    const hashedToken = crypto.createHash('sha256').update(knownToken).digest('hex');

    // We use DATE_ADD(NOW(), ...) to ensure timezone consistency with MySQL.
    // Instead of calculating the date in JS.
    await db.query(
      `UPDATE users 
       SET password_reset_token = ?, 
           password_reset_expires = DATE_ADD(NOW(), INTERVAL 20 MINUTE) 
       WHERE id = ?`,
      [hashedToken, testUser.id],
    );

    // 2. Try to reset using the known RAW token
    const res = await request(app)
      .post(`/api/auth/reset-password/${knownToken}`)
      .send({ password: 'newpassword789' });

    // Debug: If it fails, display the error in the console.
    if (res.statusCode !== 200) {
      console.error('Reset Failed:', res.body);
    }

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/sucesso/i);

    // 3. Verify Login with NEW password
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'newpassword789',
    });
    expect(loginRes.statusCode).toBe(200);
  });
});
