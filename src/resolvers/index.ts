import { authResolvers } from './authResolvers';
import { internshipResolvers } from './internshipResolvers';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...internshipResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...internshipResolvers.Mutation,
  },
};
