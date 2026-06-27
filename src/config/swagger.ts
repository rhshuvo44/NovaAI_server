import swaggerJSDoc from 'swagger-jsdoc';
import { env } from '@config/env';

const swaggerDefinition: swaggerJSDoc.Options['definition'] = {
  openapi: '3.0.0',
  info: {
    title: `${env.APP_NAME} API`,
    version: '1.0.0',
    description:
      'Enterprise-grade backend API for AI Workspace: AI-assisted document management, ' +
      'chat, prompts, and team collaboration.',
  },
  servers: [
    {
      url: `${env.APP_URL}/api/${env.API_VERSION}`,
      description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session token',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'Webhooks', description: 'Inbound webhook receivers' },
    { name: 'Users', description: 'User account management' },
    { name: 'Roles', description: 'RBAC role management' },
    { name: 'Permissions', description: 'RBAC permission catalog' },
    { name: 'Documents', description: 'Document CRUD and search' },
    { name: 'Categories', description: 'Document categorization' },
    { name: 'Tags', description: 'Content tagging' },
    { name: 'Favorites', description: 'User favorites' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Chat', description: 'AI chat sessions and messages' },
    { name: 'Prompts', description: 'Saved and reusable AI prompts' },
    { name: 'AI', description: 'Standalone AI feature endpoints' },
    { name: 'Uploads', description: 'File upload management' },
    { name: 'Analytics', description: 'Usage analytics and reporting' },
    { name: 'Dashboard', description: 'Aggregated dashboard data' },
    { name: 'Settings', description: 'System and user settings' },
    { name: 'AuditLogs', description: 'Audit trail' },
    { name: 'ApiKeys', description: 'Service API key management' },
  ],
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ['./src/modules/**/routes/*.routes.ts', './src/routes/*.routes.ts'],
});
