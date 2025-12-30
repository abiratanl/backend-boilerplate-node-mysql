const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CustomerModel {
  /**
   * Lista clientes com paginação simples e busca por Nome/CPF
   */
  static async findAll(filters = {}) {
    let sql = `SELECT id, name, cpf, birth_date, email_primary, phone_primary FROM customers WHERE 1=1`;
    // Nota: Ajustei a query para buscar colunas que existem. 
    // Como seu schema não tem email/phone na tabela customers (estão em contacts), 
    // faremos um JOIN simples para trazer o contato principal na listagem.
    
    // Query otimizada para listagem rápida (trazendo 1 contato e cidade)
    sql = `
      SELECT 
        c.id, c.name, c.cpf, c.birth_date,
        (SELECT value FROM contacts WHERE customer_id = c.id AND type IN ('whatsapp','mobile') ORDER BY is_primary DESC LIMIT 1) as main_phone,
        (SELECT city FROM addresses WHERE customer_id = c.id ORDER BY is_default DESC LIMIT 1) as city
      FROM customers c
      WHERE 1=1
    `;

    const params = [];

    if (filters.search) {
      sql += ' AND (c.name LIKE ? OR c.cpf LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ' ORDER BY c.name ASC LIMIT 50'; // Limitando para segurança

    const [rows] = await db.query(sql, params);
    return rows;
  }

  /**
   * Busca completa: Cliente + Endereços + Contatos
   */
  static async findById(id) {
    // 1. Busca dados do Cliente
    const [customerRows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (customerRows.length === 0) return null;
    const customer = customerRows[0];

    // 2. Busca Endereços
    const [addressRows] = await db.query('SELECT * FROM addresses WHERE customer_id = ?', [id]);
    
    // 3. Busca Contatos
    const [contactRows] = await db.query('SELECT * FROM contacts WHERE customer_id = ?', [id]);

    // Retorna objeto montado
    return {
      ...customer,
      addresses: addressRows,
      contacts: contactRows
    };
  }

  static async findByCpf(cpf) {
    const [rows] = await db.query('SELECT * FROM customers WHERE cpf = ?', [cpf]);
    return rows[0];
  }

  /**
   * Cria Cliente e seus sub-dados (Endereço e Contato)
   * Recebe: { name, cpf, ..., addresses: [], contacts: [] }
   */
  static async create(data) {
    const conn = await db.getConnection(); // Pegamos conexão para garantir ordem
    try {
      await conn.beginTransaction(); // Inicia Transação (Tudo ou Nada)

      const customerId = uuidv4();
      const { name, cpf, birth_date, measurements, notes, addresses, contacts } = data;

      // 1. Inserir Cliente
      await conn.query(
        `INSERT INTO customers (id, name, cpf, birth_date, measurements, notes) VALUES (?, ?, ?, ?, ?, ?)`,
        [customerId, name, cpf, birth_date, JSON.stringify(measurements || {}), notes]
      );

      // 2. Inserir Endereços (se houver)
      if (addresses && addresses.length > 0) {
        for (const addr of addresses) {
          const addrId = uuidv4();
          await conn.query(
            `INSERT INTO addresses (id, customer_id, type, label, zip_code, street, number, complement, neighborhood, city, state, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [addrId, customerId, addr.type || 'residential', addr.label, addr.zip_code, addr.street, addr.number, addr.complement, addr.neighborhood, addr.city, addr.state, addr.is_default ? 1 : 0]
          );
        }
      }

      // 3. Inserir Contatos (se houver)
      if (contacts && contacts.length > 0) {
        for (const ct of contacts) {
          const ctId = uuidv4();
          await conn.query(
            `INSERT INTO contacts (id, customer_id, type, value, is_primary) VALUES (?, ?, ?, ?, ?)`,
            [ctId, customerId, ct.type, ct.value, ct.is_primary ? 1 : 0]
          );
        }
      }

      await conn.commit(); // Confirma gravação
      conn.release();
      return { id: customerId, ...data };

    } catch (error) {
      await conn.rollback(); // Desfaz tudo se der erro
      conn.release();
      throw error;
    }
  }

  static async update(id, data) {
    // Atualização simplificada (apenas dados principais do cliente por enquanto)
    const fields = [];
    const values = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.birth_date) { fields.push('birth_date = ?'); values.push(data.birth_date); }
    if (data.measurements) { fields.push('measurements = ?'); values.push(JSON.stringify(data.measurements)); }
    if (data.notes) { fields.push('notes = ?'); values.push(data.notes); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await db.query(sql, values);
    return result.affectedRows > 0;
  }
}

module.exports = CustomerModel;