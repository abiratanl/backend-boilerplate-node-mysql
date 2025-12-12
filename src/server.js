const express = require('express');
const pool = require('./config/db');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        // Testa conexão listando os usuários que criamos no init.sql
        const [rows] = await pool.query('SELECT id, name, email, role FROM users');
        res.json({ 
            status: 'Sucesso! TESTE DE HOT RELOAD FUNCIONANDO!', 
            usuarios_seed: rows 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});