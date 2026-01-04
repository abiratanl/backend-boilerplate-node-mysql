const Store = require('../models/StoreModel');

exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll();
    
    res.status(200).json({ 
        status: 'success', 
        results: stores.length, 
        data: stores 
    });
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno ao listar lojas.' });
  }
};

exports.getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Buscando loja com ID no Model:", id);

    // Agora chamamos o método correto que criamos no Model
    const store = await Store.findById(id);

    if (!store) {
      console.log("❌ Loja não encontrada no Banco de Dados");
      return res.status(404).json({ 
        status: 'error', 
        message: 'Loja não encontrada.' 
      });
    }

    res.status(200).json({ 
      status: 'success', 
      data: store 
    });
  } catch (error) {
    console.error('🔥 Erro no Controller:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro interno ao buscar dados da loja.' 
    });
  }
};