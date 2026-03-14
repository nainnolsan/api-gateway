export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}
