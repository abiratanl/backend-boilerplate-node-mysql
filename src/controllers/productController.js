const Product = require('../models/ProductModel');

exports.getAllProducts = async (req, res) => {
  try {
    const filters = {};
    
    // 1. Busca Global (para transferências entre lojas)
    if (req.query.global_search === 'true') {
        console.log(`[Busca Global] Utilizador ${req.user.id} pesquisando em todas as lojas.`);
    } else {
        // Padrão: Filtra pela loja do utilizador
        if (req.user.storeId) {
            filters.store_id = req.user.storeId;
        }
    }
    
    // Admin sem storeId pode filtrar manualmente
    if (!req.user.storeId && req.query.store_id) {
        filters.store_id = req.query.store_id;
    }

    // Filtros de Query Params
    if (req.query.category_id) filters.category_id = req.query.category_id;
    if (req.query.status) filters.status = req.query.status;
    
    // Filtro novo para a Home Page (Produtos em Destaque)
    if (req.query.is_featured) filters.is_featured = (req.query.is_featured === 'true');

    // IMPORTANTE: O método Product.findAll no seu Model deve ser atualizado 
    // para fazer o JOIN e trazer a 'url_thumb' da foto principal.
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
    
    // 1. Busca dados do produto
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Produto não encontrado.' });
    }

    // Segurança: Bloqueia acesso entre lojas (exceto admin global)
    if (req.user.storeId && product.store_id !== req.user.storeId) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado a este produto.' });
    }

    // 2. Busca as imagens associadas (Nova Tabela)
    // Você precisará criar este método no seu ProductModel
    const images = await Product.getImagesByProductId(id);

    // Retorna o produto com o array de imagens dentro
    res.status(200).json({ 
        status: 'success', 
        data: {
            ...product, // Espalha os dados do produto (nome, preço, etc)
            images: images // Adiciona o array de fotos
        } 
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno.' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { 
      category_id, code, name, description, 
      size, color, brand, purchase_price, rental_price, 
      status, store_id, is_featured 
      // Nota: image_url foi removido daqui, pois agora vem pelo req.processedImages
    } = req.body;

    // Validações
    if (!name || !rental_price || !code) {
      return res.status(400).json({ status: 'error', message: 'Nome, Código e Preço são obrigatórios.' });
    }

    const finalStoreId = req.user.storeId || store_id;

    if (!finalStoreId) {
      return res.status(400).json({ status: 'error', message: 'É necessário vincular o produto a uma Loja.' });
    }

    // 1. Cria o Produto na tabela principal
    // O Model.create deve retornar o ID do novo produto criado
    const newProductId = await Product.create({
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
      is_featured: is_featured === 'true' || is_featured === true ? 1 : 0
    });

    // 2. Salva as imagens na tabela product_images (Se houver upload)
    // req.processedImages vem do middleware que criamos anteriormente
    if (req.processedImages && req.processedImages.length > 0) {
        await Product.addImages(newProductId, req.processedImages);
    }

    res.status(201).json({ 
        status: 'success', 
        message: 'Produto cadastrado com sucesso!',
        productId: newProductId 
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao criar produto.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar existência e permissão
    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ message: 'Produto não encontrado.' });

    if (req.user.storeId && existingProduct.store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Você não tem permissão para editar este produto.' });
    }

    // 1. Atualiza dados de texto
    const updated = await Product.update(id, req.body);

    // 2. Se houver NOVAS fotos no upload, adiciona à galeria existente
    if (req.processedImages && req.processedImages.length > 0) {
        await Product.addImages(id, req.processedImages);
    }

    if (!updated) {
       // Atenção: Se o usuário só enviou fotos e não mudou texto, o update pode retornar false/0.
       // Ajuste essa lógica conforme o retorno do seu ORM.
       // return res.status(400).json({ status: 'error', message: 'Não foi possível atualizar.' });
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

    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ message: 'Produto não encontrado.' });

    if (req.user.storeId && existingProduct.store_id !== req.user.storeId) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este produto.' });
    }

    // O delete do produto deve disparar um CASCADE no banco para apagar as linhas da tabela images.
    // Opcional: Criar uma lógica aqui para apagar os arquivos do R2 para economizar espaço (clean up).
    await Product.delete(id);

    res.status(200).json({ status: 'success', message: 'Produto removido com sucesso.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao deletar produto.' });
  }
};