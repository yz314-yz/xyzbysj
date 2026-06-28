const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '岐养七日 API',
      version: '1.0.0',
      description: '中医养生辅助系统接口文档，包含认证、诊断、历史记录和健康检查接口。',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

module.exports = { swaggerSpec };
