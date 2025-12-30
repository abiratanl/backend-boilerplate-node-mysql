const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RentalModel {
  /**
   * Busca aluguel com todos os detalhes (Itens, Cliente, Parcelas e Pagamentos)
   */
  static async findById(id) {
    // 1. Dados do Aluguel + Cliente + Loja
    const sqlRental = `
      SELECT r.*, c.name as customer_name, c.cpf as customer_cpf, s.name as store_name
      FROM rentals r
      JOIN customers c ON r.customer_id = c.id
      JOIN stores s ON r.store_id = s.id
      WHERE r.id = ?
    `;
    const [rentalRows] = await db.query(sqlRental, [id]);
    if (rentalRows.length === 0) return null;
    const rental = rentalRows[0];

    // 2. Itens do Aluguel
    const sqlItems = `
      SELECT ri.*, p.name as product_name, p.code as product_code, p.image_url
      FROM rental_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.rental_id = ?
    `;
    const [items] = await db.query(sqlItems, [id]);

    // 3. Parcelas (Financeiro)
    const sqlInstallments = `SELECT * FROM installments WHERE rental_id = ? ORDER BY number ASC`;
    const [installments] = await db.query(sqlInstallments, [id]);

    return { ...rental, items, installments };
  }

  /**
   * CRIAÇÃO DE ALUGUEL COM TRANSAÇÃO (All or Nothing)
   */
  static async createTransaction(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const rentalId = uuidv4();
      const {
        store_id, customer_id, user_id, 
        start_date, end_date_scheduled, delivery_address_id, delivery_type,
        items, // Array de { product_id, price }
        installments_config, // { count: 3, first_due_date: '...' }
        notes, discount, status // 'budget' ou 'reserved'
      } = data;

      // 1. Calcular Totais
      let totalAmount = 0;
      items.forEach(item => totalAmount += (parseFloat(item.unit_price) * (item.quantity || 1)));
      
      const finalAmount = totalAmount - (discount || 0);

      // 2. Inserir Contrato (Rental)
      const sqlRental = `
        INSERT INTO rentals (
          id, store_id, customer_id, user_id, delivery_address_id, delivery_type,
          start_date, end_date_scheduled, status, total_amount, discount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await conn.query(sqlRental, [
        rentalId, store_id, customer_id, user_id, delivery_address_id || null, delivery_type || 'pickup_store',
        start_date, end_date_scheduled, status || 'reserved', finalAmount, discount || 0, notes
      ]);

      // 3. Inserir Itens e Atualizar Estoque
      for (const item of items) {
        const itemId = uuidv4();
        
        // A. Insere na tabela de ligação
        await conn.query(
          `INSERT INTO rental_items (id, rental_id, product_id, unit_price, quantity) VALUES (?, ?, ?, ?, ?)`,
          [itemId, rentalId, item.product_id, item.unit_price, item.quantity || 1]
        );

        // B. Atualiza status do produto (Se não for apenas um orçamento)
        if (status !== 'budget') {
          const newProductStatus = status === 'picked_up' ? 'rented' : 'reserved';
          await conn.query(
            `UPDATE products SET status = ? WHERE id = ?`,
            [newProductStatus, item.product_id]
          );
        }
      }

      // 4. Gerar Parcelas (Contas a Receber)
      if (installments_config && status !== 'budget') {
        const count = installments_config.count || 1;
        const installmentValue = finalAmount / count;
        const firstDate = new Date(installments_config.first_due_date || new Date());

        for (let i = 1; i <= count; i++) {
          const instId = uuidv4();
          // Lógica simples de data: soma 30 dias a cada parcela (pode melhorar com moment/date-fns)
          const dueDate = new Date(firstDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));

          await conn.query(
            `INSERT INTO installments (id, rental_id, number, total_installments, value, due_date, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [instId, rentalId, i, count, installmentValue, dueDate]
          );
        }
      }

      await conn.commit();
      conn.release();
      return { id: rentalId, total_amount: finalAmount, status: status || 'reserved' };

    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  }

  // Listagem simples
  static async findAll(filters = {}) {
    let sql = `
      SELECT r.id, r.status, r.start_date, r.end_date_scheduled, r.total_amount,
             c.name as customer_name, s.name as store_name
      FROM rentals r
      JOIN customers c ON r.customer_id = c.id
      JOIN stores s ON r.store_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.store_id) {
      sql += ' AND r.store_id = ?';
      params.push(filters.store_id);
    }
    if (filters.status) {
      sql += ' AND r.status = ?';
      params.push(filters.status);
    }
    
    sql += ' ORDER BY r.created_at DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async returnRental(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Busca os itens para saber quais produtos liberar
      const [items] = await conn.query('SELECT product_id FROM rental_items WHERE rental_id = ?', [id]);
      
      // 2. Atualiza Status dos Produtos
      // Regra de Negócio: Ao devolver, o produto vai para 'laundry' (Lavanderia) ou direto para 'available'?
      // Vamos assumir 'laundry' por segurança higiênica.
      for (const item of items) {
        await conn.query(
          "UPDATE products SET status = 'laundry' WHERE id = ?", 
          [item.product_id]
        );
      }

      // 3. Atualiza o Aluguel (Data real de devolução e Status)
      await conn.query(
        "UPDATE rentals SET status = 'returned', returned_at = NOW() WHERE id = ?", 
        [id]
      );

      await conn.commit();
      conn.release();
      return true;

    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  }

  /**
   * Cancela uma reserva e libera os produtos imediatamente
   */
  static async cancelRental(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Busca itens
      const [items] = await conn.query('SELECT product_id FROM rental_items WHERE rental_id = ?', [id]);
      
      // 2. Libera produtos (voltam a ficar available)
      for (const item of items) {
        await conn.query(
          "UPDATE products SET status = 'available' WHERE id = ?", 
          [item.product_id]
        );
      }

      // 3. Atualiza status do aluguel
      // Nota: As parcelas financeiras podem ser canceladas aqui também se desejar,
      // mas vamos manter simples por enquanto.
      await conn.query(
        "UPDATE rentals SET status = 'cancelled' WHERE id = ?", 
        [id]
      );

      await conn.commit();
      conn.release();
      return true;

    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  }
}

module.exports = RentalModel;