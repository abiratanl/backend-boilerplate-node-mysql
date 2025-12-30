const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  /**
   * Find a user by their Email.
   */
  static async findByEmail(email) {
    // Selecionamos * para pegar store_id, password, role, etc.
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.query(sql, [email]);
    return rows[0];
  }

  /**
   * Find a user by their UUID.
   */
  static async findById(id) {
    // ADDED: store_id no select
    const sql = 'SELECT id, store_id, name, email, role, is_active, created_at FROM users WHERE id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }

  /**
   * Creates a new user.
   * @param {Object} userData - Contains name, email, password (hashed), role, store_id.
   * @returns {Promise<Object>} The created user object.
   */
  static async create(userData) {
    // ADDED: store_id na destructuring
    const { name, email, password, role, store_id } = userData; 
    const id = uuidv4();

    const isActive = userData.is_active !== undefined ? userData.is_active : true;
    const mustChangePassword =
      userData.must_change_password !== undefined ? userData.must_change_password : true;
    
    // Logic for store_id: If it doesn't come, set it to NULL (for Admins/Clients)
    const storeIdValue = store_id || null;

    // ADDED: store_id na Query
    const sql = `
      INSERT INTO users (id, store_id, name, email, password, role, is_active, must_change_password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      id,
      storeIdValue, // <--- Novo campo
      name,
      email,
      password,
      role || 'atendente',
      isActive,
      mustChangePassword,
    ]);

    return {
      id,
      store_id: storeIdValue,
      name,
      email,
      role: role || 'atendente',
      is_active: isActive,
      must_change_password: mustChangePassword,
    };
  }

  /**
   * Update user details.
   */
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }
    // ADDED: Support for moving store users
    if (data.store_id !== undefined) { 
      fields.push('store_id = ?');
      // Allows you to explicitly pass null to remove from the store.
      values.push(data.store_id); 
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }

    if (fields.length === 0) return false;

    values.push(id); 

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  }

  /**
   * Soft Delete a user.
   */
  static async softDelete(id) {
    const sql = 'UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get all active users.
   */
  static async findAll() {
    // ADDED: store_id no select
    const sql =
      'SELECT id, store_id, name, email, role, is_active, created_at FROM users WHERE deleted_at IS NULL';
    const [rows] = await db.query(sql);
    return rows;
  }
}

module.exports = UserModel;