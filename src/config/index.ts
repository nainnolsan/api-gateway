import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  graphql: {
    introspection: process.env.GRAPHQL_INTROSPECTION !== 'false',
    playground: process.env.GRAPHQL_PLAYGROUND !== 'false',
  },
};
