import { authResolvers } from './authResolvers';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
  },
};
