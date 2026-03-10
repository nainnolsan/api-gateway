import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { config } from './config';


async function startServer() {
  // Create Express app
  const app = express();

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

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
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
  app.listen(config.port, () => {
    console.log(`🚀 API Gateway ready at http://localhost:${config.port}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${config.port}/graphql`);
    console.log(`💓 Health check: http://localhost:${config.port}/health`);
    console.log(`🔗 Auth Service: ${config.authServiceUrl}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});
