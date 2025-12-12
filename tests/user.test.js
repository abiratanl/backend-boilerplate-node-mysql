const request = require('supertest');

/**
 * =========================================================================
 * MOCKS GLOBAIS
 * =========================================================================
 */

// 1. Mock do UUID (Corrige o erro "Unexpected token 'export'")
// O Jest vai interceptar qualquer chamada a require('uuid') e retornar isso:
jest.mock('uuid', () => ({
  v4: () => 'uuid-test-generated-id' // Retorna sempre este ID fixo
}));

// 2. Mock do Banco de Dados
jest.mock('../src/config/db', () => {
  return {
    query: jest.fn(),
  };
});

// Importar o app DEPOIS dos mocks para que eles tenham efeito
const app = require('../src/app');
const db = require('../src/config/db');

describe('User API Endpoints', () => {
  
  // Limpar os mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test GET /api/users
   */
  describe('GET /api/users', () => {
    it('should fetch all active users', async () => {
      // 1. Mock da resposta do DB
      const mockUsers = [
        { id: 'uuid-1', name: 'John', email: 'john@test.com', role: 'admin', is_active: 1 }
      ];
      db.query.mockResolvedValue([mockUsers]); 

      // 2. Requisição
      const res = await request(app).get('/api/users');

      // 3. Asserções
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toEqual('John');
    });

    it('should handle database errors gracefully', async () => {
      db.query.mockRejectedValue(new Error('DB Connection Failed'));

      const res = await request(app).get('/api/users');

      expect(res.statusCode).toEqual(500);
      expect(res.body.status).toEqual('error');
    });
  });

  /**
   * Test POST /api/users
   */
  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        role: 'atendente'
      };

      // Mock 1: Email não existe (retorna array vazio)
      db.query.mockResolvedValueOnce([[]]); 
      
      // Mock 2: Insert sucesso
      db.query.mockResolvedValueOnce([{ insertId: 0, affectedRows: 1 }]); 

      const res = await request(app).post('/api/users').send(newUser);

      expect(res.statusCode).toEqual(201);
      
      // Agora podemos testar se o ID gerado é o do nosso Mock
      expect(res.body.data.id).toEqual('uuid-test-generated-id');
      expect(res.body.data.email).toEqual(newUser.email);
    });

    it('should prevent duplicate emails', async () => {
      const existingUser = {
        name: 'Existing',
        email: 'exists@test.com',
        password: '123'
      };

      // Mock: Email já existe
      db.query.mockResolvedValueOnce([[{ id: 'uuid-existing', email: 'exists@test.com' }]]); 

      const res = await request(app).post('/api/users').send(existingUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toMatch(/Email already in use/i);
    });
  });

  /**
   * Test DELETE /api/users/:id (Soft Delete)
   */
  describe('DELETE /api/users/:id', () => {
    it('should soft delete a user', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const res = await request(app).delete('/api/users/uuid-123');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });

    it('should return 404 if user not found', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);

      const res = await request(app).delete('/api/users/uuid-not-found');

      expect(res.statusCode).toEqual(404);
    });
  });
});