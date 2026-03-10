export const typeDefs = `#graphql
  # User Type
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String
  }

  # Authentication Response
  type AuthPayload {
    success: Boolean!
    message: String!
    accessToken: String
    refreshToken: String
    user: User
  }

  # Generic Response
  type Response {
    success: Boolean!
    message: String!
  }

  # Profile Response
  type ProfilePayload {
    success: Boolean!
    message: String
    data: User
  }

  # Queries
  type Query {
    # Get current user profile (requires authentication)
    me: ProfilePayload!
    
    # Health check
    health: String!
  }

  # Mutations
  type Mutation {
    # Register a new user
    register(
      name: String!
      email: String!
      password: String!
    ): AuthPayload!

    # Login user
    login(
      email: String!
      password: String!
    ): AuthPayload!

    # Refresh token
    refreshToken(
      refreshToken: String!
    ): AuthPayload!

    # Logout user
    logout(
      refreshToken: String!
    ): Response!
  }
`;
