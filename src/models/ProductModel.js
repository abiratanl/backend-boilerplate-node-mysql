const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ProductModel {
  static async findAll(filters = {}) {
    let sql = `
      SELECT 
        p.*, 
        c.name as category_name, 
        s.name as store_name 
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

    // Filtro extra útil: Buscar por código (parcial)
    if (filters.code) {
      sql += ' AND p.code LIKE ?';
      params.push(`%${filters.code}%`);
    }

    sql += ' ORDER BY p.name ASC';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async findById(id) {
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

  static async create(data) {
    const id = uuidv4();
    const { 
      store_id, category_id, code, name, description, 
      size, color, brand, purchase_price, rental_price, 
      status, image_url 
    } = data;

    const sql = `
      INSERT INTO products (
        id, store_id, category_id, code, name, description, 
        size, color, brand, purchase_price, rental_price, 
        status, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      id, store_id, category_id, code, name, description,
      size, color, brand, purchase_price || 0, rental_price || 0,
      status || 'available', image_url
    ]);

    return { id, ...data };
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    // Lista atualizada de campos permitidos
    const allowedFields = [
      'category_id', 'code', 'name', 'description', 
      'size', 'color', 'brand', 'purchase_price', 'rental_price', 
      'status', 'image_url', 'store_id'
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
    const sql = 'DELETE FROM products WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = ProductModel;