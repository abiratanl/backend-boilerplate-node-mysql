const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ProductModel {
  
  // --- LEITURA ---

  static async findAll(filters = {}) {
    // A mágica aqui: Uma subquery para pegar a miniatura correta para a listagem
    // Prioridade: 1. Imagem marcada como Principal (is_main=1) -> 2. Imagem mais antiga (created_at ASC)
    const sqlSelectImage = `
      (SELECT url_thumb 
       FROM product_images 
       WHERE product_id = p.id 
       ORDER BY is_main DESC, created_at ASC 
       LIMIT 1) as thumbnail
    `;

    let sql = `
      SELECT 
        p.*, 
        c.name as category_name, 
        s.name as store_name,
        ${sqlSelectImage}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN stores s ON p.store_id = s.id
      WHERE 1=1
    `;
    
    const params = [];

    if (filters.store_id) {
      sql += ' AND p.store_id = ?';
      params.push(filters.store_id);
    }
    if (filters.category_id) {
      sql += ' AND p.category_id = ?';
      params.push(filters.category_id);
    }
    if (filters.status) {
      sql += ' AND p.status = ?';
      params.push(filters.status);
    }
    // Filtro para Home Page
    if (filters.is_featured !== undefined) {
        sql += ' AND p.is_featured = ?';
        params.push(filters.is_featured);
    }
    // Busca por código parcial
    if (filters.code) {
      sql += ' AND p.code LIKE ?';
      params.push(`%${filters.code}%`);
    }

    sql += ' ORDER BY p.name ASC';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async findById(id) {
    // Aqui trazemos apenas os dados crus do produto. 
    // As imagens são buscadas separadamente pelo controller usando getImagesByProductId
    const sql = `
      SELECT p.*, c.name as category_name, s.name as store_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }

  // --- IMAGENS (NOVO) ---

  // Busca todas as fotos de um produto específico
  static async getImagesByProductId(productId) {
      const sql = `
        SELECT * FROM product_images 
        WHERE product_id = ? 
        ORDER BY is_main DESC, created_at ASC
      `;
      const [rows] = await db.query(sql, [productId]);
      return rows;
  }

  // Insere múltiplas imagens de uma vez (Bulk Insert)
  static async addImages(productId, imagesArray) {
      if (!imagesArray || imagesArray.length === 0) return;

      const sql = `
        INSERT INTO product_images (id, product_id, url_thumb, url_full, is_main) 
        VALUES ?
      `;

      // Prepara o array de arrays para o mysql2 fazer o bulk insert
      const values = imagesArray.map(img => [
          img.id,          // ID gerado no middleware (ou gere um novo aqui: uuidv4())
          productId,
          img.url_thumb,
          img.url_full,
          img.is_main
      ]);

      await db.query(sql, [values]);
  }

  // --- ESCRITA ---

  static async create(data) {
    const id = uuidv4();
    const { 
      store_id, category_id, code, name, description, 
      size, color, brand, purchase_price, rental_price, 
      status, is_featured 
      // Nota: image_url removido
    } = data;

    const sql = `
      INSERT INTO products (
        id, store_id, category_id, code, name, description, 
        size, color, brand, purchase_price, rental_price, 
        status, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      id, store_id, category_id, code, name, description,
      size, color, brand, purchase_price || 0, rental_price || 0,
      status || 'available', is_featured ? 1 : 0
    ]);

    // Retorna o ID para que o Controller possa vincular as imagens
    return id; 
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    // Lista atualizada de campos permitidos na tabela products
    const allowedFields = [
      'category_id', 'code', 'name', 'description', 
      'size', 'color', 'brand', 'purchase_price', 'rental_price', 
      'status', 'store_id', 'is_featured'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // Graças ao ON DELETE CASCADE no banco, ao deletar o produto,
    // as imagens na tabela product_images somem sozinhas do SQL.
    const sql = 'DELETE FROM products WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = ProductModel;