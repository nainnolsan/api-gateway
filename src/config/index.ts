import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  internshipServiceUrl: process.env.INTERNSHIP_SERVICE_URL || 'http://localhost:3002',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()),
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  health: {
    authPath: process.env.AUTH_SERVICE_HEALTH_PATH || '/api/health',
    internshipPath: process.env.INTERNSHIP_SERVICE_HEALTH_PATH || '/api/health',
  },
  http: {
    timeoutMs: parseInt(process.env.UPSTREAM_TIMEOUT_MS || '10000', 10),
    retries: parseInt(process.env.UPSTREAM_RETRIES || '2', 10),
  },
  graphql: {
    introspection: process.env.GRAPHQL_INTROSPECTION !== 'false',
    playground: process.env.GRAPHQL_PLAYGROUND !== 'false',
  },
};
