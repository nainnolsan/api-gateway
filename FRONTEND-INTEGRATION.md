# Frontend - Integración con API Gateway GraphQL

## 📦 Dependencias Necesarias

El frontend necesita Apollo Client para conectarse al API Gateway GraphQL.

### Instalar dependencias:

```bash
cd Frontend
npm install @apollo/client graphql
```

## 🔧 Configuración

### 1. Crear archivo de configuración de Apollo Client

Crear: `Frontend/src/lib/apolloClient.ts`

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// URL del API Gateway
const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';

// HTTP Link
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

// Auth Link - Agregar token a cada request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Error Link - Manejar errores globalmente
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Si el token expiró, redirigir a login
      if (message.includes('autenticado') || message.includes('UNAUTHENTICATED')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

### 2. Envolver la app con ApolloProvider

Actualizar: `Frontend/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './lib/apolloClient'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
)
```

### 3. Crear GraphQL Queries y Mutations

Crear: `Frontend/src/graphql/auth.ts`

```typescript
import { gql } from '@apollo/client';

// Mutation: Register
export const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      success
      message
      accessToken
      refreshToken
      user {
        id
        name
        email
      }
    }
  }
`;

// Mutation: Login
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      success
      message
      accessToken
      refreshToken
      user {
        id
        name
        email
      }
    }
  }
`;

// Mutation: Logout
export const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;

// Mutation: Refresh Token
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      success
      message
      accessToken
      refreshToken
    }
  }
`;

// Query: Get Profile
export const GET_PROFILE_QUERY = gql`
  query GetProfile {
    me {
      success
      message
      data {
        id
        name
        email
        createdAt
      }
    }
  }
`;
```

### 4. Actualizar componente Login

Actualizar: `Frontend/src/components/Login.tsx`

```typescript
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '../graphql/auth';
import { useNavigation } from '../context/NavigationContext';

interface LoginProps {
  onSwitchToSignup?: () => void;
}

const Login = ({ onSwitchToSignup }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setPage } = useNavigation();

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      if (data.login.success) {
        // Guardar tokens
        localStorage.setItem('accessToken', data.login.accessToken);
        localStorage.setItem('refreshToken', data.login.refreshToken);
        
        // Redirigir al home
        setPage('home');
      } else {
        setError(data.login.message);
      }
    },
    onError: (err) => {
      setError(err.message || 'Error al iniciar sesión');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    await login({
      variables: {
        email,
        password,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      {/* Back button */}
      <button
        onClick={() => setPage('home')}
        className="fixed top-4 left-4 p-2 text-gray-600 hover:text-black transition-colors"
        aria-label="Back to home"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Welcome back</h1>
          <p className="text-gray-600 text-sm">Sign in to your account</p>
        </div>

        {/* Form Card */}
        <div className="border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-sm"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <button
              onClick={onSwitchToSignup}
              className="text-black font-medium hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

### 5. Actualizar componente SignIn (Registro)

Similar al Login, actualiza `Frontend/src/components/SignIn.tsx` para usar `REGISTER_MUTATION`.

## 🌍 Variables de Entorno

### Desarrollo local (.env.local):
```bash
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

### Producción (Vercel):
```bash
VITE_GRAPHQL_URL=https://tu-api-gateway.up.railway.app/graphql
```

## 📝 Pasos de Instalación

```bash
# 1. Instalar dependencias
cd Frontend
npm install @apollo/client graphql

# 2. Crear archivos mencionados arriba

# 3. Crear .env.local para desarrollo
echo "VITE_GRAPHQL_URL=http://localhost:4000/graphql" > .env.local

# 4. Probar en desarrollo
npm run dev
```

## 🚀 Deploy en Vercel

1. **Variables de Entorno en Vercel**:
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agregar: `VITE_GRAPHQL_URL` = `https://[tu-api-gateway].up.railway.app/graphql`

2. **Redeploy**:
   ```bash
   git add .
   git commit -m "Add Apollo Client integration"
   git push origin main
   ```
   
   Vercel auto-deploy automáticamente.

## ✅ Testing

### Probar Registro:
1. Ir a la página de Sign In
2. Llenar el formulario
3. Debería crear usuario y guardar tokens en localStorage

### Probar Login:
1. Ir a la página de Login
2. User email y password
3. Debería guardar tokens y redirigir al home

### Verificar tokens:
```javascript
// En DevTools Console
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
```

## 🔍 Troubleshooting

### Error: "Network request failed"
- API Gateway no está corriendo o URL incorrecta
- Verificar `VITE_GRAPHQL_URL`

### Error: "CORS"
- API Gateway necesita agregar URL del frontend a `CORS_ORIGIN`

### Error: "Token inválido"
- `JWT_SECRET` no coincide entre auth-service y API Gateway
