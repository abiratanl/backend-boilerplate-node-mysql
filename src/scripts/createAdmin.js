require('dotenv').config(); // Loads environment variables
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const createAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@loja.com';
  const adminName = process.env.ADMIN_NAME || 'Super Administrator';

  try {
    console.log('🔄 Verificando existência do Admin...');

    // 1. Check if it already exists.
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [adminEmail]);

    if (existing.length > 0) {
      console.log(
        '⚠️  The admin account already exists in the database. No action has been taken.',
      );
      process.exit(0);
    }

    // 2. Generate a secure password (NEW + 6 hexadecimal characters)
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const rawPassword = `NOVA${randomSuffix}`;

    // 3. Password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 4. Prepare data
    const newUser = {
      id: uuidv4(),
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      is_active: true,
      must_change_password: true, // <--- Force the change on first login.
    };

    // 5. Insert into database
    const sql = `
      INSERT INTO users (id, name, email, password, role, is_active, must_change_password) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      newUser.id,
      newUser.name,
      newUser.email,
      newUser.password,
      newUser.role,
      newUser.is_active,
      newUser.must_change_password,
    ]);

    console.log('✅ Admin criado com sucesso!');
    console.log('==================================================');
    console.log('📧 [MOCK EMAIL] Envio de Credenciais:');
    console.log(`👤 Usuário: ${newUser.email}`);
    console.log(`🔑 Senha Temporária: ${rawPassword}`);
    console.log('⚠️  Status: Ativo | Troca de senha obrigatória: SIM');
    console.log('==================================================');
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  } finally {
    // Close the connection to the database to terminate the script.
    // Since we are using a pool, we need to terminate the process or the connection.
    process.exit(0);
  }
};

createAdminUser();
