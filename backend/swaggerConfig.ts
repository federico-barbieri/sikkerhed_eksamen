import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sikkerhed eksamen 2025. API beskrivelse af Federico Barbieri',
      version: '1.0.0',
      description: 'En beskrivelse af API til administrators.',
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/handlers/*.ts', './src/modules/*.ts', './src/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;