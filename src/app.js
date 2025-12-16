const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); // <--- Import Auth Routes

const swaggerDocument = YAML.load('./src/swagger.yaml');

const app = express();

/**
 * Middlewares
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Documentation
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * Routes
 */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Boilerplate API is running',
    documentation: '/api-docs'
  });
});

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); // <--- Use Auth Routes

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Erro interno do Servidor.'
  });
});

module.exports = app;