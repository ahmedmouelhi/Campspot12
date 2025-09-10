import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Camping App API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Camping App backend services',
      contact: {
        name: 'API Support',
        url: 'https://github.com/yourusername/camping-app',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    // Use TypeScript files for development (ts-node)
    './src/routes/*.ts',
    './src/models/*.ts',
    // Use compiled JavaScript files for production
    './dist/routes/*.js',
    './dist/models/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
