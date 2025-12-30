const Payment = require('../models/PaymentModel');
const Rental = require('../models/RentalModel'); // Para validar se o aluguel existe

exports.createPayment = async (req, res) => {
  try {
    const { rental_id, installment_id, amount, payment_method } = req.body;

    // Validações
    if (!rental_id || !amount || !payment_method) {
      return res.status(400).json({ message: 'Dados incompletos para pagamento.' });
    }

    // Verificar se aluguel existe (e se pertence à loja do usuário)
    const rental = await Rental.findById(rental_id);
    if (!rental) {
      return res.status(404).json({ message: 'Aluguel não encontrado.' });
    }
    
    if (req.user.storeId && rental.store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Não é possível receber pagamentos de outra loja.' });
    }

    const payment = await Payment.create({
      rental_id,
      installment_id,
      user_id: req.user.id,
      amount,
      payment_method
    });

    res.status(201).json({ status: 'success', data: payment });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao processar pagamento.' });
  }
};

exports.getPaymentsByRental = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const payments = await Payment.findByRentalId(rentalId);
    res.status(200).json({ status: 'success', data: payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno.' });
  }
};