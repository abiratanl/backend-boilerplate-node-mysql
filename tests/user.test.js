const request = require('supertest');
const app = require('../src/app');
const UserModel = require('../src/models/userModel');
const db = require('../src/config/database');

// MOCK DAS DEPENDÊNCIAS
jest.mock('../src/models/userModel');
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  end: jest.fn() // Mock para evitar erros de conexão
}));
jest.mock('../src/middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'admin-id', role: 'admin' }; // Simula Admin Logado
    next();
  },
  restrictTo: (...roles) => (req, res, next) => next(), // Permite tudo
}));

describe('User API Endpoints (Unit Tests)', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/users › should create a new user successfully', async () => {
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'atendente'
    };

    // Mock do comportamento do Model
    UserModel.findByEmail.mockResolvedValue(null); // Não existe ainda
    UserModel.create.mockResolvedValue({ 
      id: 'uuid-123', 
      ...newUser, 
      is_active: true,
      must_change_password: true 
    });

    const res = await request(app).post('/api/users').send(newUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toMatch(/email/i); // Verifica msg de email
  });

  it('POST /api/users › should prevent duplicate emails', async () => {
    const existingUser = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: '123'
    };

    // Simula que JÁ EXISTE no banco
    UserModel.findByEmail.mockResolvedValue(existingUser);

    const res = await request(app).post('/api/users').send(existingUser);

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toMatch(/utilizado/i);
  });

  it('DELETE /api/users/:id › should soft delete a user', async () => {
    // Simula deleção com sucesso
    UserModel.softDelete.mockResolvedValue(true);

    const res = await request(app).delete('/api/users/uuid-123');

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toMatch(/sucesso/i);
  });

  it('DELETE /api/users/:id › should return 404 if user not found', async () => {
    // Simula falha na deleção (usuário não existe)
    UserModel.softDelete.mockResolvedValue(false);

    const res = await request(app).delete('/api/users/uuid-not-found');

    expect(res.statusCode).toEqual(404);
  });
});