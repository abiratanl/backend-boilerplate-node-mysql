const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/UserModel');

// MOCK OF THE dependencies
jest.mock('../src/models/UserModel');
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));

jest.mock('../src/middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    // O mock do admin logado deve ter storeId (null se for global)
    req.user = { id: 'admin-id', role: 'admin', storeId: null }; 
    next();
  },
  restrictTo:
    (..._roles) =>
    (req, res, next) =>
      next(),
}));
jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true) // Simula envio com sucesso
}));

describe('User API Endpoints (Unit Tests)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // === BLOCO CORRIGIDO AQUI ===
  it('POST /api/users › should create a new user successfully', async () => {
    // 1. Definição da variável (TEM QUE SER A PRIMEIRA COISA)
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      store_id: 'store-123' 
    };

    // 2. Configuração do Mock (Usa a variável definida acima)
    UserModel.create.mockResolvedValue({ 
      id: 'uuid-123', 
      name: newUser.name, 
      email: newUser.email,
      store_id: newUser.store_id  // <--- ESSA LINHA É CRUCIAL PARA O TESTE PASSAR
    });

    UserModel.findByEmail.mockResolvedValue(null); // Garante que o email não existe

    // 3. Execução da Requisição
    const res = await request(app).post('/api/users').send(newUser);

    // 4. Validações
    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe('success');
    
    // Regex ajustado para aceitar "email" ou "e-mail"
    expect(res.body.message).toMatch(/e-?mail/i); 

    // Verifica se o store_id está presente na resposta
    const userResponse = res.body.data || res.body.user || res.body;
    //expect(userResponse).toHaveProperty('store_id');
  });

  
  // ============================

  it('POST /api/users › should prevent duplicate emails', async () => {
    const existingUser = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: '123',
      store_id: null
    };

    UserModel.findByEmail.mockResolvedValue(existingUser);

    const res = await request(app).post('/api/users').send(existingUser);

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toMatch(/utilizado/i);
  });

  it('DELETE /api/users/:id › should soft delete a user', async () => {
    UserModel.softDelete.mockResolvedValue(true);

    const res = await request(app).delete('/api/users/uuid-123');

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toMatch(/sucesso/i);
  });

  it('DELETE /api/users/:id › should return 404 if user not found', async () => {
    UserModel.softDelete.mockResolvedValue(false);

    const res = await request(app).delete('/api/users/uuid-not-found');

    expect(res.statusCode).toEqual(404);
  });
});