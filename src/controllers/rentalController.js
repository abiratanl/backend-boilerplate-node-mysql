const Rental = require('../models/RentalModel');
const Product = require('../models/ProductModel'); // Opcional: para validar se produtos existem

exports.createRental = async (req, res) => {
  try {
    const {
      customer_id,
      products, // Array de IDs ou objetos
      start_date,
      end_date_scheduled,
      installments_config,
      store_id // Opcional se for atendente
    } = req.body;

    // 1. Validações Básicas
    if (!customer_id || !products || products.length === 0) {
      return res.status(400).json({ message: 'Cliente e Produtos são obrigatórios.' });
    }
    if (!start_date || !end_date_scheduled) {
      return res.status(400).json({ message: 'Datas de retirada e devolução são obrigatórias.' });
    }

    // 2. Define a Loja
    const finalStoreId = req.user.storeId || store_id;
    if (!finalStoreId) {
      return res.status(400).json({ message: 'Loja não identificada.' });
    }

    // 3. Preparar itens (buscar preço atual se não enviado)
    // Isso é importante: o frontend manda o ID, o backend busca o preço "oficial" do banco para segurança
    const itemsToSave = [];
    for (const item of products) {
      // Supondo que 'products' seja array de { id: '...', quantity: 1 }
      const productDb = await Product.findById(item.id);
      
      if (!productDb) {
        return res.status(404).json({ message: `Produto ID ${item.id} não encontrado.` });
      }
      
      // Validação de Status (se não for orçamento)
      if (req.body.status !== 'budget' && productDb.status !== 'available') {
         return res.status(400).json({ message: `Produto ${productDb.name} não está disponível.` });
      }

      itemsToSave.push({
        product_id: productDb.id,
        unit_price: productDb.rental_price, // Pega o preço do cadastro do produto
        quantity: 1 // Por enquanto 1, trajes costumam ser únicos
      });
    }

    // 4. Chamar Model
    const result = await Rental.createTransaction({
      ...req.body,
      store_id: finalStoreId,
      user_id: req.user.id, // Vendedor logado
      items: itemsToSave
    });

    res.status(201).json({ status: 'success', data: result });

  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao processar aluguel.' });
  }
};

exports.getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ message: 'Aluguel não encontrado' });
    
    // Segurança: Atendente só vê da sua loja
    if (req.user.storeId && rental.store_id !== req.user.storeId) {
       return res.status(403).json({ message: 'Acesso negado.' });
    }

    res.status(200).json({ status: 'success', data: rental });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.getAllRentals = async (req, res) => {
  try {
    const filters = {};
    if (req.user.storeId) filters.store_id = req.user.storeId;
    if (req.query.status) filters.status = req.query.status;

    const rentals = await Rental.findAll(filters);
    res.status(200).json({ status: 'success', data: rentals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno' });
  }
};