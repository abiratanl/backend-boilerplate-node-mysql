const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
//const YAML = require('yamljs');


const authRoutes = require('./routes/authRoutes'); // <--- Import Auth Routes
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const productRoutes = require('./routes/productRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const storeRoutes = require('./routes/storeRoutes');
const transferRoutes = require('./routes/transferRoutes');
const userRoutes = require('./routes/userRoutes');
const { apiLimiter } = require('./middlewares/rateLimitMiddleware');
//const swaggerDocument = YAML.load('./src/swagger.yaml');

const app = express();

// Configuração  permissiva para desenvolvimento
app.use(cors({
    origin: 'http://localhost:5173', // O endereço exato do seu Frontend
    credentials: true, // Permite envio de cookies/headers de autorização
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


/**
 * Middlewares
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Documentation
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Apply Global Rate Limiter to all API routes
app.use('/api', apiLimiter);

/**
 * Routes
 */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Boilerplate API is running',
    documentation: '/api-docs',
  });
});

// Use Auth Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); 


app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/stores', storeRoutes); 
app.use('/api/transfers', transferRoutes);

/**
 * Global Error Handler
 */
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Erro interno do Servidor.',
  });
});

module.exports = app;
