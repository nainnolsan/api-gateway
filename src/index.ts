import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { config } from './config';
import { AuthAPI } from './dataSources/authAPI';
import { InternshipAPI } from './dataSources/internshipAPI';
import { ScraperAPI } from './dataSources/scraperAPI';

async function startServer() {
  // Create Express app
  const app = express();
  const authAPI = new AuthAPI(config.authServiceUrl, config.http.timeoutMs, config.http.retries);
  const internshipAPI = new InternshipAPI(
    config.internshipServiceUrl,
    config.http.timeoutMs,
    config.http.retries
  );
  const scraperAPI = new ScraperAPI(
    config.jobScraperServiceUrl,
    config.http.timeoutMs,
    config.http.retries
  );

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: config.graphql.introspection,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({ 
        embed: true,
        includeCookies: true 
      }),
    ],
  });

  // Start Apollo Server
  await server.start();

  // Apply CORS globally (before routes)
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));
  
  // Parse JSON bodies
  app.use(express.json());

  // Handle OPTIONS preflight for GraphQL endpoint
  app.options('/graphql', (req, res) => {
    res.status(200).end();
  });

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const requestId = req.headers['x-request-id']?.toString() || 'health-check';
    const services = await Promise.all([
      authAPI.healthCheck(config.health.authPath, requestId),
      internshipAPI.healthCheck(config.health.internshipPath, requestId),
    ]);
    const hasFailure = services.some((service) => service.status === 'down');

    res.status(hasFailure ? 503 : 200).json({
      status: hasFailure ? 'degraded' : 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      services,
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'GraphQL API Gateway',
      graphql: '/graphql',
      health: '/health',
    });
  });

  // Start server
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 API Gateway ready at http://0.0.0.0:${config.port}`);
    console.log(`📊 GraphQL endpoint: /graphql`);
    console.log(`💓 Health check: /health`);
    console.log(`🔗 Auth Service: ${config.authServiceUrl}`);
    console.log(`🎯 Internship Service: ${config.internshipServiceUrl}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🌐 CORS Origin: ${config.corsOrigin}`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});
