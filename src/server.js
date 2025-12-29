require('dotenv').config(); // Load environment variables first
const app = require('./app');
const validateEnv = require('./utils/validateEnv'); // Import the validator

// 1. Validate Environment Variables (Fail Fast Strategy)
validateEnv();

const PORT = process.env.PORT || 3000;

// 2. Start the server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================`);
});
