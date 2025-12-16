require('dotenv').config();
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/config/database');

process.env.DB_NAME = 'loja_test';

let adminToken;

describe('INTEGRATION TESTS: User API', () => {

  beforeAll(async () => {
    if (db && db.query) {
        await db.query('DELETE FROM users');

        // Cria ADMIN para poder testar rotas
        const adminId = uuidv4();
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        await db.query(
            'INSERT INTO users (id, name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, true)',
            [adminId, 'Admin User', 'admin@example.com', adminPassword, 'admin']
        );

        // Login para pegar token
        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'admin@example.com',
            password: 'admin123'
        });
        adminToken = loginRes.body.token;

    } else {
        throw new Error("Database connection failed.");
    }
  });

  afterAll(async () => {
    if (db.getPool) {
      await db.getPool().end();
    }
  });

  it('Should ACTUALLY insert a user into the database', async () => {
    const newUser = {
      name: 'Integration User',
      email: 'realdb@test.com',
      password: '123',
      role: 'atendente'
    };

    const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`) // Usa o token
        .send(newUser);

    expect(res.statusCode).toEqual(201);
    
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [newUser.email]);
    expect(rows).toHaveLength(1);
  });
});