// 1. Carregar variáveis de ambiente IMEDIATAMENTE
require('dotenv').config();

const request = require('supertest');

// 2. Garantir que NÃO estamos usando o Mock do outro teste (user.test.js)
jest.unmock('../src/config/db');

const app = require('../src/app');
const db = require('../src/config/db');

// Força o uso do banco de testes para evitar deletar dados reais
// (Caso não tenha passado via linha de comando)
process.env.DB_NAME = 'loja_test';

describe('INTEGRATION TESTS: User API', () => {

  // Antes de todos os testes, limpamos a tabela para começar do zero
  beforeAll(async () => {
    // Verifica se a conexão existe antes de tentar deletar
    if (db && db.query) {
      await db.query('DELETE FROM users');
    } else {
      throw new Error("Database connection failed. Check your .env file.");
    }
  });

  // Depois de tudo, fechamos a conexão para o Jest não ficar travado
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
      role: 'admin'
    };

    // 1. Faz a requisição real
    const res = await request(app).post('/api/users').send(newUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.id).toBeDefined();

    // 2. A PROVA REAL: Vai no banco verificar se o registro existe
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [newUser.email]);
    
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toEqual('Integration User');
  });
});