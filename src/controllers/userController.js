const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class UserController {
  /**
   * Get all active users.
   */
  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      res.status(200).json({ status: 'success', data: users });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }

  /**
   * Get a single active user by UUID.
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ status: 'fail', message: 'Usuário não encontrado.' });
      }

      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      console.error('Error in getUserById:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }

  /**
   * Create a new user.
   */
  static async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;

      // 1. Basic Validation
      if (!name || !email || !password) {
        return res.status(400).json({ status: 'fail', message: 'Preencha os campos obrigatórios.' });
      }

      // 2. Check for duplicate email
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ status: 'fail', message: 'Email já utilizado.' });
      }

      // 3. Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 4. Create user
      const newUser = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role
      });

      res.status(201).json({ status: 'success', data: newUser });
    } catch (error) {
      console.error('Error in createUser:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }

  /**
   * Update an existing user.
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, role, is_active } = req.body;

      const updated = await UserModel.update(id, { name, role, is_active });

      if (!updated) {
        return res.status(404).json({ status: 'fail', message: 'Usuário não encontrado ou nenhuma alteração realizada.' });
      }

      res.status(200).json({ status: 'success', message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      console.error('Error in updateUser:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }

  /**
   * Soft delete a user.
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleted = await UserModel.softDelete(id);

      if (!deleted) {
        return res.status(404).json({ status: 'fail', message: 'Usuário não encontrado ou já deletado.' });
      }

      res.status(200).json({ status: 'success', message: 'Usuário deletado com sucesso!' });
    } catch (error) {
      console.error('Error in deleteUser:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }
}

module.exports = UserController;