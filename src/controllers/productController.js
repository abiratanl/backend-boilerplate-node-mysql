const Product = require('../models/ProductModel');

exports.getAllProducts = async (req, res) => {
  try {
 // ... dentro de exports.getAllProducts ...

    const filters = {};
    
    // 1. Se passar ?global_search=true, ignora o filtro da loja do utilizador
    //    Isso permite ver produtos de outras filiais para pedir transferência.
    if (req.query.global_search === 'true') {
        // Não aplica filter.store_id automático
        console.log(`[Busca Global] Utilizador ${req.user.id} pesquisando em todas as lojas.`);
    } else {
        // Comportamento padrão: Filtra pela loja do utilizador logado
        if (req.user.storeId) {
            filters.store_id = req.user.storeId;
        }
    }
    
    // Se for admin (sem storeId), pode filtrar por loja específica via query
    if (!req.user.storeId && req.query.store_id) {
        filters.store_id = req.query.store_id;
    }

    // Other filters via Query Params (?category_id=...&status=...)
    if (req.query.category_id) filters.category_id = req.query.category_id;
    if (req.query.status) filters.status = req.query.status;

    const products = await Product.findAll(filters);
    res.status(200).json({ status: 'success', results: products.length, data: products });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar produtos.' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Produto não encontrado.' });
    }

    // Security: Ensure that the attendant cannot access products from another store using the direct ID.
    if (req.user.storeId && product.store_id !== req.user.storeId) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado a este produto.' });
    }

    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno.' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { 
      category_id, code, name, description, 
      size, color, brand, purchase_price, rental_price, // Campos novos
      status, image_url, store_id 
    } = req.body;

    // Validações atualizadas
    if (!name || !rental_price || !code) {
      return res.status(400).json({ status: 'error', message: 'Nome, Código e Preço de Aluguel são obrigatórios.' });
    }

    const finalStoreId = req.user.storeId || store_id;

    if (!finalStoreId) {
      return res.status(400).json({ status: 'error', message: 'É necessário vincular o produto a uma Loja.' });
    }

    const newProduct = await Product.create({
      store_id: finalStoreId,
      category_id,
      code,
      name,
      description,
      size,
      color,           
      brand,           
      purchase_price,  
      rental_price,    
      status,
      image_url
    });

    res.status(201).json({ status: 'success', data: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao criar produto.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify that the product exists and belongs to the user's store before updating.
    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ message: 'Produto não encontrado.' });

    if (req.user.storeId && existingProduct.store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Você não tem permissão para editar este produto.' });
    }

    const updated = await Product.update(id, req.body);

    if (!updated) {
      return res.status(400).json({ status: 'error', message: 'Não foi possível atualizar.' });
    }

    res.status(200).json({ status: 'success', message: 'Produto atualizado com sucesso.' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao atualizar produto.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão
    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ message: 'Produto não encontrado.' });

    if (req.user.storeId && existingProduct.store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este produto.' });
    }

    await Product.delete(id);

    res.status(200).json({ status: 'success', message: 'Produto removido com sucesso.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao deletar produto.' });
  }
};