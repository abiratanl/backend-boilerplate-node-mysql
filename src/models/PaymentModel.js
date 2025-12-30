const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PaymentModel {
  /**
   * Registra um pagamento e atualiza a parcela vinculada
   */
  static async create(data) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const paymentId = uuidv4();
      const { rental_id, installment_id, user_id, amount, payment_method } = data;

      // 1. Inserir o Pagamento (Recibo)
      await conn.query(
        `INSERT INTO payments (id, rental_id, installment_id, user_id, amount, payment_method)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [paymentId, rental_id, installment_id, user_id, amount, payment_method]
      );

      // 2. Atualizar a Parcela (Installment) se houver vínculo
      if (installment_id) {
        // Busca info atual da parcela
        const [rows] = await conn.query('SELECT * FROM installments WHERE id = ?', [installment_id]);
        const installment = rows[0];

        if (installment) {
          const newPaidAmount = parseFloat(installment.amount_paid) + parseFloat(amount);
          const totalValue = parseFloat(installment.value);
          
          // Define status: se pagou tudo ou mais, está 'paid'. Senão 'partially_paid'
          let newStatus = 'partially_paid';
          if (newPaidAmount >= totalValue - 0.01) { // Margem de erro pequena pra float
            newStatus = 'paid';
          }

          // Atualiza parcela
          await conn.query(
            `UPDATE installments 
             SET amount_paid = ?, status = ?, paid_at = ? 
             WHERE id = ?`,
            [newPaidAmount, newStatus, new Date(), installment_id]
          );
        }
      }

      await conn.commit();
      conn.release();
      return { id: paymentId, ...data };

    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  }

  /**
   * Lista pagamentos de um aluguel específico
   */
  static async findByRentalId(rentalId) {
    const sql = `
      SELECT p.*, u.name as user_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.rental_id = ?
      ORDER BY p.paid_at DESC
    `;
    const [rows] = await db.query(sql, [rentalId]);
    return rows;
  }
}

module.exports = PaymentModel;