const db = require('../config/database'); 

class Store {
  static async findAll() {
    // Busca id e nome de todas as lojas ativas
    const query = `SELECT id, name FROM stores ORDER BY name ASC`;
    const [rows] = await db.execute(query);
    return rows;
  }
}

module.exports = Store;