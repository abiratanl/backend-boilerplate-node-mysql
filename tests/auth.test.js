// 1. LOAD ENVIRONMENT VARIABLES
require('dotenv').config();

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../src/app');
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

const testUser = {
  id: uuidv4(),
  store_id: null, // <--- ADICIONADO: Admins não têm loja específica
  name: 'Auth Test User',
  email: 'auth.test@example.com',
  password: 'testpassword123',
  role: 'admin',
};

let authToken;

describe('AUTHENTICATION (AUTH) TESTS', () => {
  beforeAll(async () => {
    // Limpeza inicial
    if (db && db.query) {
      await db.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    }

    try {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      // === CORREÇÃO AQUI ===
      // Adicionamos store_id na query SQL para evitar erro de coluna
      const insertQuery = `
        INSERT INTO users (id, store_id, name, email, password, role, is_active, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, true, false)
      `;
      
      await db.query(insertQuery, [
        testUser.id,
        testUser.store_id, // <--- Passando NULL
        testUser.name,
        testUser.email,
        hashedPassword,
        testUser.role,
      ]);
    } catch (error) {
      console.error('Failed to setup Auth Test user:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    // await db.end(); // Cuidado com conflito de pool se tiver outros testes
  });

  it('Should successfully log in and return a JWT token (200)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.token).toBeDefined();
    
    // Opcional: Verificar se o user retornado tem a estrutura nova
    expect(response.body.data.user).toHaveProperty('store_id');
    
    authToken = response.body.token;
  });

  it('Should fail login due to INCORRECT PASSWORD (401)', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('Should fail login due to NON-EXISTENT EMAIL (401)', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: testUser.password,
      })
      .expect(401);
  });

  it('Should fail login due to MISSING FIELDS (400)', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        // Senha faltando
      })
      .expect(400);
  });

  it('Should fail to access a protected route WITHOUT a token (401)', async () => {
    await request(app).get('/api/users').expect(401);
  });

  it('Should successfully access a protected route WITH a valid token (200)', async () => {
    if (!authToken) throw new Error('Token missing');

    await request(app).get('/api/users').set('Authorization', `Bearer ${authToken}`).expect(200);
  });
});