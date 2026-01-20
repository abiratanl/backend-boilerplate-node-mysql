const Customer = require('../models/CustomerModel');

exports.getAllCustomers = async (req, res) => {
  try {
    const filters = {
      search: req.query.search 
    };
    
    const customers = await Customer.findAll(filters);
    res.status(200).json({ status: 'success', results: customers.length, data: customers });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar clientes.' });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ status: 'error', message: 'Cliente não encontrado.' });
    }

    res.status(200).json({ status: 'success', data: customer });
  } catch (error) {
    console.error('Error getting customer details:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno.' });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { 
      name, rg, cpf, birth_date, measurements, notes, 
      addresses, contacts 
    } = req.body; // Adicionado 'rg' aqui na extração

    // Validação Básica
    if (!name || !contacts || contacts.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Nome e pelo menos um contato são obrigatórios.' });
    }

    // Verificar se CPF já existe
    if (cpf) {
      const existing = await Customer.findByCpf(cpf);
      if (existing) {
        return res.status(409).json({ status: 'error', message: 'CPF já cadastrado.' });
      }
    }

    // Verificar se RG já existe
    if (rg) {
      const existingRg = await Customer.findByRg(rg);
      if (existingRg) {
        return res.status(409).json({ status: 'error', message: 'RG já cadastrado.' });
      }
    }

    const newCustomer = await Customer.create({
      name, rg, cpf, birth_date, measurements, notes, addresses, contacts
    });

    res.status(201).json({ status: 'success', data: newCustomer });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'Dados duplicados (CPF ou RG já existem).' });
    }
    console.error('Error creating customer:', error);
    res.status(500).json({ status: 'error', message: 'Erro interno ao criar cliente.' });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Customer.update(id, req.body);

    if (!updated) {
      return res.status(404).json({ message: 'Cliente não encontrado ou nada a atualizar.' });
    }

    res.status(200).json({ status: 'success', message: 'Cliente atualizado com sucesso.' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao atualizar cliente.' });
  }
};