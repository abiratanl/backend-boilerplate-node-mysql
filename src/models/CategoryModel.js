const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CategoryModel {
  /**
   * List all categories.
   * Tip: The frontend can use this flat list to visually assemble the tree.
   */
  static async findAll() {
    const sql = `
      SELECT 
        c.id, 
        c.parent_id, 
        c.name, 
        c.description, 
        p.name as parent_name,
        c.created_at 
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.name ASC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }

  static async create(data) {
    const id = uuidv4();
    const { name, description, parent_id } = data;

    // Se parent_id for uma string vazia ou undefined, gravamos NULL (Raiz)
    const parentIdValue = parent_id ? parent_id : null;

    const sql = `
      INSERT INTO categories (id, parent_id, name, description) 
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [id, parentIdValue, name, description]);

    return { id, parent_id: parentIdValue, name, description };
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    // Allows you to move a category to another parent or make it the root (null).
    if (data.parent_id !== undefined) {
      fields.push('parent_id = ?');
      values.push(data.parent_id ? data.parent_id : null);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // Thanks to the ON DELETE SET NULL event in the database, if we delete a parent,
    // the children automatically become the root (or we can block it, depending on the rule).
    // Here we will delete directly.
    const sql = 'DELETE FROM categories WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CategoryModel;