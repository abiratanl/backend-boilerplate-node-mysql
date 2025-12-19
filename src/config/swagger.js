const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      // Read from the .env file or use the default if it doesn't exist.
      title: process.env.APP_NAME || 'Node.js Boilerplate API',
      version: process.env.APP_VERSION || '1.0.0',
      description: process.env.APP_DESCRIPTION || 'API documentation using Swagger',
      contact: {
        name: process.env.APP_AUTHOR || 'Abiratan Lopes Email: abi.lopes.sousa@gmail.com', 
      },
    },
    servers: [
      {
        // Use the .env port to automatically assemble the URL.
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Development server',
      },
    ],
  },
  // Usando caminhos absolutos baseados na localização deste arquivo
  apis: [
    path.join(__dirname, '../routes/*.js'),   // Sobe uma pasta e entra em routes
    path.join(__dirname, '../../swagger.yaml') // Sobe duas pastas para achar o yaml na raiz
  ], 
};
  

const swaggerSpec = swaggerJsdoc(options);

swaggerSpec.info.title = process.env.APP_NAME || swaggerSpec.info.title;
swaggerSpec.info.description = process.env.APP_DESCRIPTION || swaggerSpec.info.description;

module.exports = swaggerSpec;