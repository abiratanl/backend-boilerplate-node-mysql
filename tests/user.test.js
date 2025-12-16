const request = require('supertest');

/**
 * =========================================================================
 * MOCKS GLOBAIS
 * =========================================================================
 */

// 1. Mock do Auth Middleware (CORREÇÃO DO ERRO 401)
// Isso faz com que, durante ESTE teste, as rotas protegidas sejam liberadas.
jest.mock('../src/middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { role: 'admin' }; // Finge que é um admin logado
    next();
  },
  restrictTo: (...roles) => (req, res, next) => next() // Finge que tem permissão
}));

// 2. Mock do Banco de Dados
jest.mock('../src/config/database', () => {
  return {
    query: jest.fn(),
  };
});

// Importar o app DEPOIS dos mocks
const app = require('../src/app');
const db = require('../src/config/database');

describe('User API Endpoints (Unit Tests)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should fetch all active users', async () => {
      const mockUsers = [
        { id: 'uuid-1', name: 'John', email: 'john@test.com', role: 'admin', is_active: 1 }
      ];
      db.query.mockResolvedValue([mockUsers]); 

      const res = await request(app).get('/api/users');

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      db.query.mockRejectedValue(new Error('DB Connection Failed'));
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toEqual(500);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        role: 'atendente'
      };

      db.query.mockResolvedValueOnce([[]]); // Email não existe
      db.query.mockResolvedValueOnce([{ insertId: 0, affectedRows: 1 }]); // Insert ok

      const res = await request(app).post('/api/users').send(newUser);

      expect(res.statusCode).toEqual(201);
    });

    it('should prevent duplicate emails', async () => {
      const existingUser = {
        name: 'Existing',
        email: 'exists@test.com',
        password: '123'
      };

      db.query.mockResolvedValueOnce([[{ id: 'uuid-existing', email: 'exists@test.com' }]]); 

      const res = await request(app).post('/api/users').send(existingUser);

      expect(res.statusCode).toEqual(409);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete a user', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);
      const res = await request(app).delete('/api/users/uuid-123');
      expect(res.statusCode).toEqual(200);
    });

    it('should return 404 if user not found', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);
      const res = await request(app).delete('/api/users/uuid-not-found');
      expect(res.statusCode).toEqual(404);
    });
  });
});