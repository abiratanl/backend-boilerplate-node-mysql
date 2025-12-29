require('dotenv').config(); // Carrega as variáveis do .env
const db = require('../config/database');

const addAvatarColumn = async () => {
  console.log('🔄 Tentando adicionar coluna avatar na tabela users...');

  try {
    // Verifica se a coluna já existe (opcional, mas seguro)
    const queryCheck = `
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = '${process.env.DB_NAME}' 
      AND table_name = 'users' 
      AND column_name = 'avatar';
    `;

    const [rows] = await db.execute(queryCheck);
    
    if (rows[0].count > 0) {
      console.log('⚠️ A coluna "avatar" já existe. Nenhuma alteração feita.');
    } else {
      // Cria a coluna
      const queryAlter = "ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL;";
      await db.execute(queryAlter);
      console.log('✅ SUCESSO! Coluna "avatar" criada com sucesso.');
    }

  } catch (error) {
    console.error('❌ Erro ao alterar tabela:', error);
  } finally {
    process.exit();
  }
};

addAvatarColumn();