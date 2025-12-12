const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs'); 
const userRoutes = require('./routes/userRoutes');

// Carregar o ficheiro YAML
const swaggerDocument = YAML.load('./src/swagger.yaml'); // <--- Path to the file

const app = express();

/**
 * Middlewares
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Documentation (Swagger)
 */
// We passed the uploaded document directly.
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

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
});

module.exports = app;