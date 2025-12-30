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

describe('User API Endpoints (Unit Tests)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // === BLOCO CORRIGIDO AQUI ===
  it('POST /api/users › should create a new user successfully', async () => {
    const newUserInput = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'atendente',
      store_id: 'uuid-loja-1' 
    };

    UserModel.findByEmail.mockResolvedValue(null);
    
    UserModel.create.mockResolvedValue({
      id: 'uuid-123',
      store_id: 'uuid-loja-1',
      name: newUserInput.name,
      email: newUserInput.email,
      role: newUserInput.role,
      is_active: true,
      must_change_password: true,
    });

    const res = await request(app).post('/api/users').send(newUserInput);

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toMatch(/email/i); 
    
    // Verificação flexível (data ou user)
    const userResponse = res.body.data || res.body.user || res.body; 
    expect(userResponse).toHaveProperty('store_id');
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