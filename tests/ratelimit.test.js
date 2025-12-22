// 1. FORCE THE VARIABLE FIRST OF ALL
process.env.TEST_RATE_LIMIT = 'true'; 

require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');

describe('SECURITY: Rate Limiting', () => {
  
  it('Should BLOCK requests after 5 failed login attempts', async () => {
    const credentials = {
      email: 'hacker@test.com',
      password: 'wrongpassword'
    };

    // Try 5 times (maximum allowed)
    for (let i = 1; i <= 5; i++) {
      const res = await request(app).post('/api/auth/login').send(credentials);
      // Esperamos 401 (Senha incorreta) ou 400, mas NÃO 429 ainda
      expect(res.statusCode).not.toBe(429);
    }

    // A 6ª tentativa deve ser bloqueada
    const resBlocked = await request(app).post('/api/auth/login').send(credentials);
    
    expect(resBlocked.statusCode).toBe(429); // 429 = Too Many Requests
    expect(resBlocked.body.message).toMatch(/muitas tentativas/i);
  });
});