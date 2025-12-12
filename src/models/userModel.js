const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  /**
   * Retrieves all active users (not soft-deleted).
   * Excludes sensitive data like password hash from the selection.
   * @returns {Promise<Array>} List of active users.
   */
  static async findAll() {
    const sql = `
      SELECT id, name, email, role, is_active, created_at 
      FROM users 
      WHERE deleted_at IS NULL
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  /**
   * Finds a specific active user by UUID.
   * @param {string} id - The user UUID.
   * @returns {Promise<Object|null>} The user object or null.
   */
  static async findById(id) {
    const sql = `
      SELECT id, name, email, role, is_active, created_at 
      FROM users 
      WHERE id = ? AND deleted_at IS NULL
    `;
    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Internal method to find a user by email.
   * Useful for registration checks and login authentication.
   * Note: This returns the password hash for internal validation.
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    // We do NOT filter by deleted_at here to prevent a soft-deleted user 
    // from re-registering with the same email (business rule decision).
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.query(sql, [email]);

    if (rows.length === 0) return null;
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
    const isActive = userData.is_active !== undefined ? userData.is_active : false;

    const sql = `
      INSERT INTO users (id, name, email, password, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [id, name, email, password, role || 'atendente', isActive]);

    return {
      id,
      name,
      email,
      role: role || 'atendente',
      is_active: isActive
    };
  }

  /**
   * Updates user information.
   * @param {string} id - The UUID.
   * @param {Object} userData - Data to update.
   * @returns {Promise<boolean>} True if updated.
   */
  static async update(id, userData) {
    const { name, role, is_active } = userData;
    const sql = 'UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ? AND deleted_at IS NULL';
    
    const [result] = await db.query(sql, [name, role, is_active, id]);
    return result.affectedRows > 0;
  }

  /**
   * Performs a Soft Delete.
   * Updates 'deleted_at' timestamp AND sets 'is_active' to false for security redundancy.
   * @param {string} id - The UUID to delete.
   * @returns {Promise<boolean>} True if soft deleted.
   */
  static async softDelete(id) {
    // We explicitly set is_active to 0 (false) to ensure the user cannot login 
    // even if a query forgets to check 'deleted_at'.
    const sql = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP, is_active = 0 
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    const [result] = await db.query(sql, [id]);
    
    return result.affectedRows > 0;
  }
}

module.exports = UserModel;