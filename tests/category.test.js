const request = require('supertest');
const app = require('../src/app');
const CategoryModel = require('../src/models/CategoryModel');

// =================================================================
// 1. MOCKS (Simulações)
// =================================================================

// Simula o Model (para não acessar o banco de dados real)
jest.mock('../src/models/CategoryModel');

// Simula o AuthMiddleware (para fingir que estamos logados como Admin)
jest.mock('../src/middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'admin-id', role: 'admin', store_id: null };
    next();
  },
  // Se você tiver roles no futuro, isso libera o acesso
  restrictTo: (...roles) => (req, res, next) => next(),
}));

// =================================================================
// 2. SUÍTE DE TESTES
// =================================================================
describe('Category API Endpoints (Unit Tests)', () => {
  
  // Limpa os mocks antes de cada teste para evitar "sujeira"
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET (Listar) ---
  it('GET /api/categories › Should return all categories', async () => {
    const mockCategories = [
      { id: '1', name: 'Feminino', parent_id: null },
      { id: '2', name: 'Vestidos', parent_id: '1' } // Exemplo de subcategoria
    ];
    
    // O Model vai "fingir" que buscou isso no banco
    CategoryModel.findAll.mockResolvedValue(mockCategories);

    const res = await request(app).get('/api/categories');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe('Feminino');
  });

  // --- GET BY ID ---
  it('GET /api/categories/:id › Should return a specific category', async () => {
    const mockCategory = { id: '123', name: 'Noivas', description: 'Vestidos de Noiva' };
    CategoryModel.findById.mockResolvedValue(mockCategory);

    const res = await request(app).get('/api/categories/123');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Noivas');
  });

  it('GET /api/categories/:id › Should return 404 if not found', async () => {
    CategoryModel.findById.mockResolvedValue(null); // Retorna nada

    const res = await request(app).get('/api/categories/999');

    expect(res.statusCode).toBe(404);
  });

  // --- POST (Criar) ---
  it('POST /api/categories › Should create a new category', async () => {
    const newCat = { name: 'Acessórios', description: 'Tiaras e brincos' };
    
    CategoryModel.create.mockResolvedValue({ 
      id: 'uuid-novo', 
      ...newCat, 
      parent_id: null 
    });

    const res = await request(app).post('/api/categories').send(newCat);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Acessórios');
  });

  it('POST /api/categories › Should fail if validation error (missing name)', async () => {
    const invalidCat = { description: 'Sem nome' }; // Faltou o campo name

    const res = await request(app).post('/api/categories').send(invalidCat);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/obrigatório/i);
  });

  // --- PUT (Atualizar) ---
  it('PUT /api/categories/:id › Should update a category', async () => {
    CategoryModel.update.mockResolvedValue(true); // true = 1 linha afetada

    const res = await request(app)
      .put('/api/categories/123')
      .send({ name: 'Acessórios Premium' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/sucesso/i);
  });

  it('PUT /api/categories/:id › Should return 404 if category does not exist', async () => {
    CategoryModel.update.mockResolvedValue(false); // false = 0 linhas afetadas

    const res = await request(app)
      .put('/api/categories/999')
      .send({ name: 'Fantasma' });

    expect(res.statusCode).toBe(404);
  });

  // --- DELETE (Excluir) ---
  it('DELETE /api/categories/:id › Should delete a category', async () => {
    CategoryModel.delete.mockResolvedValue(true);

    const res = await request(app).delete('/api/categories/123');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/sucesso/i);
  });

  it('DELETE /api/categories/:id › Should handle Foreign Key Constraint error', async () => {
    // Simulando erro do MySQL quando tentamos apagar categoria que tem produtos
    const error = new Error('Foreign Key Error');
    error.code = 'ER_ROW_IS_REFERENCED_2';
    
    CategoryModel.delete.mockRejectedValue(error);

    const res = await request(app).delete('/api/categories/123');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/produtos vinculados/i);
  });

});