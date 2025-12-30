const Category = require('../models/CategoryModel');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno ao buscar categorias.' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Categoria não encontrada.' });
    }

    res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'O nome da categoria é obrigatório.' });
    }

    const newCategory = await Category.create({ name, description, parent_id });

    res.status(201).json({ status: 'success', data: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao criar categoria.' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Category.update(id, req.body);

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Categoria não encontrada ou nada para atualizar.' });
    }

    res.status(200).json({ status: 'success', message: 'Categoria atualizada com sucesso.' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao atualizar categoria.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.delete(id);

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Categoria não encontrada.' });
    }

    res.status(200).json({ status: 'success', message: 'Categoria removida com sucesso.' });
  } catch (error) {
    // Foreign key error handling (if there are linked products and no cascade)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
       return res.status(400).json({ status: 'error', message: 'Não é possível excluir esta categoria pois existem produtos vinculados a ela.' });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao deletar categoria.' });
  }
};