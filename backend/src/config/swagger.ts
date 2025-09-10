import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampSpot API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for CampSpot - Your ultimate camping booking and equipment rental platform. Test all endpoints directly from this interface!',
      contact: {
        name: 'CampSpot API Support',
        url: 'https://github.com/ahmedmouelhi/Campspot12',
        email: 'support@campspot.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
    },
    servers: [
      {
        url: 'https://campspot-production.up.railway.app',
        description: 'Production server',
      },
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
