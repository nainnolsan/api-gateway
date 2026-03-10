import { AuthAPI } from '../dataSources/authAPI';

export interface Context {
  authAPI: AuthAPI;
  token?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}
