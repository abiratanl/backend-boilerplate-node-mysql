const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  /**
   * Find a user by their Email.
   */
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.query(sql, [email]);
    return rows[0];
  }

  /**
   * Find a user by their UUID.
   */
  static async findById(id) {
    const sql = 'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  }
  /**
   * Creates a new user.
   * @param {Object} userData - Contains name, email, password (hashed), role.
   * @returns {Promise<Object>} The created user object.
   */
  static async create(userData) {
    const { name, email, password, role } = userData;
    const id = uuidv4();

    const isActive = userData.is_active !== undefined ? userData.is_active : true;
    const mustChangePassword =
      userData.must_change_password !== undefined ? userData.must_change_password : true;
    const sql = `
      INSERT INTO users (id, name, email, password, role, is_active, must_change_password) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      id,
      name,
      email,
      password,
      role || 'atendente',
      isActive,
      mustChangePassword,
    ]);

    return {
      id,
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
    // Creates a dynamic array to update only submitted fields.
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
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }

    if (fields.length === 0) return false;

    values.push(id); // Add ID to WHERE

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  }

  /**
   * Soft Delete a user (set deleted_at).
   */
  static async softDelete(id) {
    const sql = 'UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = ?';
    const [result] = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get all active users (ignore soft deleted).
   */
  static async findAll() {
    const sql =
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE deleted_at IS NULL';
    const [rows] = await db.query(sql);
    return rows;
  }
}

module.exports = UserModel;
