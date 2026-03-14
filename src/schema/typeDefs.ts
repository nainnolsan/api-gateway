export const typeDefs = `#graphql
  enum ApplicationStage {
    Applied
    OnlineAssessment
    Interview
    Offer
    Rejected
  }

  enum RoleType {
    Internship
    FullTime
    PartTime
    Contract
  }

  enum EmailProvider {
    gmail
    outlook
  }

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

  type ServiceHealth {
    service: String!
    status: String!
    url: String!
    responseTimeMs: Int!
    statusCode: Int
    message: String
  }

  type GatewayHealth {
    status: String!
    timestamp: String!
    services: [ServiceHealth!]!
  }

  type InternshipApplication {
    id: ID!
    company: String!
    roleTitle: String!
    roleType: RoleType!
    stage: ApplicationStage!
    appliedAt: String!
    lastUpdatedAt: String!
    location: String
    source: String
    salaryRange: String
    notes: String
    contactEmail: String
  }

  type DashboardMetrics {
    totalApplied: Int!
    totalOnlineAssessments: Int!
    totalInterviews: Int!
    totalOffers: Int!
    totalRejected: Int!
    conversionRate: Float!
  }

  type FunnelNode {
    name: String!
  }

  type FunnelLink {
    source: Int!
    target: Int!
    value: Int!
  }

  type FunnelFlow {
    nodes: [FunnelNode!]!
    links: [FunnelLink!]!
  }

  input InternshipApplicationFiltersInput {
    stage: ApplicationStage
    company: String
    roleType: RoleType
    fromDate: String
    toDate: String
    q: String
  }

  input CreateInternshipApplicationInput {
    company: String!
    roleTitle: String!
    roleType: RoleType!
    stage: ApplicationStage!
    appliedAt: String!
    location: String
    source: String
    salaryRange: String
    notes: String
    contactEmail: String
  }

  input UpdateInternshipApplicationInput {
    company: String
    roleTitle: String
    roleType: RoleType
    stage: ApplicationStage
    appliedAt: String
    location: String
    source: String
    salaryRange: String
    notes: String
    contactEmail: String
  }

  type PipelineColumn {
    stage: ApplicationStage!
    total: Int!
    applications: [InternshipApplication!]!
  }

  type DailyApplicationsPoint {
    date: String!
    applied: Int!
    interview: Int!
    offer: Int!
  }

  type StageDistributionItem {
    stage: ApplicationStage!
    value: Int!
  }

  type AnalyticsOverview {
    daily: [DailyApplicationsPoint!]!
    stageDistribution: [StageDistributionItem!]!
  }

  type EmailConnectorStatus {
    provider: EmailProvider!
    connected: Boolean!
    authUrl: String
    lastSyncAt: String
  }

  type EmailThread {
    id: ID!
    subject: String!
    company: String!
    snippet: String!
    receivedAt: String!
    stageHint: ApplicationStage
  }

  type EmailCenter {
    connectors: [EmailConnectorStatus!]!
    threads: [EmailThread!]!
  }

  type EmailConnectionPayload {
    redirectUrl: String!
  }

  # Queries
  type Query {
    # Get current user profile (requires authentication)
    me: ProfilePayload!
    
    # Health check
    health: String!
    gatewayHealth: GatewayHealth!
    internshipDashboardMetrics: DashboardMetrics!
    internshipFunnelFlow: FunnelFlow!
    internshipApplications(filters: InternshipApplicationFiltersInput): [InternshipApplication!]!
    internshipPipeline: [PipelineColumn!]!
    internshipAnalyticsOverview: AnalyticsOverview!
    internshipEmailCenter: EmailCenter!
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

    createInternshipApplication(input: CreateInternshipApplicationInput!): InternshipApplication!
    updateInternshipApplication(id: ID!, input: UpdateInternshipApplicationInput!): InternshipApplication!
    connectInternshipEmailProvider(provider: EmailProvider!): EmailConnectionPayload!
  }
`;
