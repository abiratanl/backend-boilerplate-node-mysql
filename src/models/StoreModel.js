const db = require('../config/database'); 

class Store {
  static async findAll() {
    // Busca id e nome de todas as lojas ativas
    const query = `SELECT id, name FROM stores ORDER BY name ASC`;
    const [rows] = await db.execute(query);
    return rows;
  }

  // NOVO MÉTODO: Busca uma loja específica por ID para pegar o telefone
  static async findById(id) {
    const query = `SELECT * FROM stores WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0]; // Retorna a primeira linha encontrada ou undefined
  }
}

module.exports = Store;