const Store = require('../models/StoreModel');

exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll();
    
    // Retorna no formato que o seu frontend espera { data: [...] }
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