const crypto = require('crypto');
const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const db = require('../config/database'); 
const { uploadImage } = require('../services/uploadService');

class UserController {
  /**
   * Get Current User Profile (Locked to the Token ID)
   */
  static async getMe(req, res) {
    try {
      // req.user.id comes from the authMiddleware
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ status: 'fail', message: 'Usuário não encontrado.' });
      }

      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      console.error('Error in getMe:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }

  /**
   * Update Current User Profile (Restricted fields)
   */
  static async updateMe(req, res) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      // Security: Prevent updating sensitive fields via this route
      if (req.body.password || req.body.role || req.body.email) {
        return res.status(400).json({
          status: 'fail',
          message:
            'Esta rota serve apenas para atualizar dados do perfil (nome). Use rotas específicas para senha ou email.',
        });
      }

      // Update only allowed fields
      const updated = await UserModel.update(userId, { name });

      if (!updated) {
        return res.status(404).json({
          status: 'fail',
          message: 'Usuário não encontrado ou nenhuma alteração realizada.',
        });
      }

      // Fetch updated data to return to the frontend
      const updatedUser = await UserModel.findById(userId);

      res.status(200).json({
        status: 'success',
        message: 'Perfil atualizado com sucesso',
        data: updatedUser,
      });
    } catch (error) {
      console.error('Error in updateMe:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }

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
      const { name, email, _password, role } = req.body;

      // 1. Basic Validation
      if (!name || !email) {
        return res
          .status(400)
          .json({ status: 'fail', message: 'Preencha os campos obrigatórios.' });
      }

      // 2. Check for duplicate email
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ status: 'fail', message: 'Email já utilizado.' });
      }

      // 3. Generate Temporary Password (Ex: NOVAabc123)
      const randomPart = crypto.randomBytes(3).toString('hex'); // gera 6 chars hex
      const tempPassword = `NOVA${randomPart}`;

      // 3. Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // 4. Create user
      const newUser = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role,
        is_active: true,
        must_change_password: true,
      });
      // 5. MOCK ENVIO DE EMAIL
      console.log('============================================');
      console.log('📧 EMAIL MOCK (Boas Vindas)');
      console.log(`Para: ${email}`);
      console.log(`Sua senha temporária é: ${tempPassword}`);
      console.log('Acesse o sistema e troque sua senha imediatamente.');
      console.log('============================================');

      res.status(201).json({
        status: 'success',
        message: 'Usuário criado. A senha foi enviada por email.',
        data: newUser,
      });
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
        return res.status(404).json({
          status: 'fail',
          message: 'Usuário não encontrado ou nenhuma alteração realizada.',
        });
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
        return res
          .status(404)
          .json({ status: 'fail', message: 'Usuário não encontrado ou já deletado.' });
      }

      res.status(200).json({ status: 'success', message: 'Usuário deletado com sucesso!' });
    } catch (error) {
      console.error('Error in deleteUser:', error);
      res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
    }
  }

  static async updateAvatar(req, res) {
    try {
      // 1. Verificação do arquivo
      if (!req.file) {
        return res.status(400).json({ 
          status: 'fail', 
          message: 'Por favor, envie uma imagem válida.' 
        });
      }

      // 2. Upload para o Cloudflare R2
      // O req.file vem do Multer e 'avatars' é a pasta no bucket
      const avatarUrl = await uploadImage(req.file, 'avatars');

      // 3. Atualizar no Banco de Dados
      // Nota: Idealmente você moveria essa query para o UserModel, mas aqui funciona perfeitamente
      const userId = req.user.id; // O ID vem do middleware 'protect'
      await db.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);

      // 4. Resposta de Sucesso
      res.status(200).json({ 
        status: 'success', 
        message: 'Avatar atualizado com sucesso!',
        data: {
          avatar: avatarUrl 
        }
      });

    } catch (error) {
      console.error('Error in updateAvatar:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Erro interno do servidor ao atualizar avatar.' 
      });
    }
  }
};

module.exports = UserController;
