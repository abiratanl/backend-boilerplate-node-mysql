const request = require('supertest');
const app = require('../src/app');
const ProductModel = require('../src/models/ProductModel');

// MOCKS
jest.mock('../src/models/ProductModel');
jest.mock('../src/middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    // Simulando um ATENDENTE da Loja A
    req.user = { id: 'user-1', role: 'atendente', storeId: 'store-A' };
    next();
  },
  restrictTo: (...roles) => (req, res, next) => next(),
}));

describe('Product API (CRUD & Global Search)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- TESTE DE CRIAÇÃO (Novos Campos) ---
  it('POST /api/products › Should create product with rental_price and code', async () => {
    const newProduct = {
      name: 'Vestido Gala Vermelho',
      code: 'VEST-RED-01',
      rental_price: 250.00,
      store_id: 'store-A' // O controller deve ignorar isso e usar do token, ou validar
    };

    ProductModel.create.mockResolvedValue({ id: 'prod-1', ...newProduct });

    const res = await request(app).post('/api/products').send(newProduct);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.code).toBe('VEST-RED-01');
    expect(res.body.data.rental_price).toBe(250.00);
  });

  // --- TESTE DE BUSCA PADRÃO (Mesma Loja) ---
  it('GET /api/products › Should filter by user storeId by default', async () => {
    ProductModel.findAll.mockResolvedValue([]);

    await request(app).get('/api/products');

    // Verifica se o Model foi chamado com o filtro da loja A
    expect(ProductModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ store_id: 'store-A' })
    );
  });

  // --- TESTE DE BUSCA GLOBAL (Outras Lojas) ---
  it('GET /api/products?global_search=true › Should IGNORE store filter', async () => {
    ProductModel.findAll.mockResolvedValue([]);

    await request(app).get('/api/products?global_search=true');

    // Verifica se o Model foi chamado SEM o store_id (objeto vazio ou sem essa chave)
    // O mock deve receber filters sem 'store_id'
    const calls = ProductModel.findAll.mock.calls[0][0];
    expect(calls.store_id).toBeUndefined(); 
  });
});