import { authResolvers } from './authResolvers';
import { internshipResolvers } from './internshipResolvers';
import { scraperResolvers } from './scraperResolvers';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...internshipResolvers.Query,
    ...scraperResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...internshipResolvers.Mutation,
  },
};
