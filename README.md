# API Gateway GraphQL

API Gateway construido con GraphQL y Apollo Server que actúa como punto de entrada único para los microservicios del portafolio.

## 🚀 Tecnologías

- **Apollo Server** - Servidor GraphQL
- **GraphQL** - Lenguaje de consulta para APIs
- **TypeScript** - Tipado estático
- **Express** - Framework web
- **Axios** - Cliente HTTP para REST APIs
- **Docker** - Contenedorización

## 📋 Estructura del Proyecto

```
api-gateway/
├── src/
│   ├── schema/           # Definiciones de GraphQL
│   │   └── typeDefs.ts
│   ├── resolvers/        # Resolvers de GraphQL
│   │   ├── authResolvers.ts
│   │   └── index.ts
│   ├── dataSources/      # Integraciones con APIs REST
│   │   └── authAPI.ts
│   ├── config/           # Configuración
│   │   └── index.ts
│   ├── types/            # Tipos de TypeScript
│   │   └── index.ts
│   ├── context.ts        # Context de Apollo
│   └── index.ts          # Entry point
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# API Gateway
PORT=4000
NODE_ENV=development

# Auth Service URL
AUTH_SERVICE_URL=http://localhost:3001

# Internship Service URL
INTERNSHIP_SERVICE_URL=http://localhost:3002

# JWT Secret (debe coincidir con auth-service)
JWT_SECRET=your_jwt_secret_key_here

# Upstream HTTP
UPSTREAM_TIMEOUT_MS=10000
UPSTREAM_RETRIES=2

# Health checks de upstream
AUTH_SERVICE_HEALTH_PATH=/api/health
INTERNSHIP_SERVICE_HEALTH_PATH=/api/health

# CORS Origin (Frontend URL)
CORS_ORIGIN=http://localhost:5173

# GraphQL Settings
GRAPHQL_INTROSPECTION=true
GRAPHQL_PLAYGROUND=true
```

### Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start
```

## 📡 Endpoints

- **GraphQL Playground**: `http://localhost:4000/graphql`
- **Health Check agregado**: `http://localhost:4000/health`
- **Root**: `http://localhost:4000/`

## Gateway Contract

### Rutas finales del gateway para frontend

El frontend solo debe hablar con el gateway mediante `POST /graphql` y `GET /health`.

#### Auth

- `register(name, email, password): AuthPayload!`
- `login(email, password): AuthPayload!`
- `refreshToken(refreshToken): AuthPayload!`
- `logout(refreshToken): Response!`
- `me: ProfilePayload!`

#### Internship service

- `internshipDashboardMetrics: DashboardMetrics!`
- `internshipFunnelFlow: FunnelFlow!`
- `internshipApplications(filters): [InternshipApplication!]!`
- `internshipPipeline: [PipelineColumn!]!`
- `internshipAnalyticsOverview: AnalyticsOverview!`
- `internshipEmailCenter: EmailCenter!`
- `createInternshipApplication(input): InternshipApplication!`
- `updateInternshipApplication(id, input): InternshipApplication!`
- `connectInternshipEmailProvider(provider): EmailConnectionPayload!`
- `gatewayHealth: GatewayHealth!`

### Mapeo interno hacia upstream REST

- `register` → `POST /api/auth/register`
- `login` → `POST /api/auth/login`
- `refreshToken` → `POST /api/auth/refresh`
- `logout` → `POST /api/auth/logout`
- `me` → `GET /api/auth/profile`
- `internshipDashboardMetrics` → `GET /api/internships/dashboard/metrics`
- `internshipFunnelFlow` → `GET /api/internships/dashboard/funnel`
- `internshipApplications` → `GET /api/internships/applications`
- `createInternshipApplication` → `POST /api/internships/applications`
- `updateInternshipApplication` → `PATCH /api/internships/applications/:id`
- `internshipPipeline` → `GET /api/internships/pipeline`
- `internshipAnalyticsOverview` → `GET /api/internships/analytics/overview`
- `internshipEmailCenter` → `GET /api/internships/emails`
- `connectInternshipEmailProvider` → `POST /api/internships/emails/connect/:provider`

## 🔐 Autenticación

El API Gateway maneja la autenticación mediante tokens JWT. Los tokens se deben enviar en el header `Authorization`:

```
Authorization: Bearer <token>
```

## 📝 Ejemplo de Queries y Mutations

### Registro de Usuario

```graphql
mutation Register {
  register(
    name: "Juan Pérez"
    email: "juan@example.com"
    password: "password123"
  ) {
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
```

### Login

```graphql
mutation Login {
  login(
    email: "juan@example.com"
    password: "password123"
  ) {
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
```

### Obtener Perfil (requiere autenticación)

```graphql
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
```

**Nota**: Debes incluir el token en los HTTP Headers:

```json
{
  "Authorization": "Bearer <tu_token_aqui>"
}
```

### Refresh Token

```graphql
mutation RefreshToken {
  refreshToken(refreshToken: "<tu_refresh_token>") {
    success
    message
    accessToken
    refreshToken
  }
}
```

### Logout

```graphql
mutation Logout {
  logout(refreshToken: "<tu_refresh_token>") {
    success
    message
  }
}
```

### Health Check

```graphql
query HealthCheck {
  health
}
```

### Health check agregado

```graphql
query GatewayHealth {
  gatewayHealth {
    status
    timestamp
    services {
      service
      status
      statusCode
      responseTimeMs
      message
    }
  }
}
```

### Dashboard de internships

```graphql
query InternshipDashboard {
  internshipDashboardMetrics {
    totalApplied
    totalOnlineAssessments
    totalInterviews
    totalOffers
    totalRejected
    conversionRate
  }
}
```

### Crear aplicación

```graphql
mutation CreateInternshipApplication {
  createInternshipApplication(
    input: {
      company: "Acme"
      roleTitle: "Frontend Intern"
      roleType: Internship
      stage: Applied
      appliedAt: "2026-03-13"
      location: "Remote"
    }
  ) {
    id
    company
    roleTitle
    stage
  }
}
```

## Seguridad y forwarding

- El gateway reenvía `Authorization` al servicio upstream.
- Si el JWT es válido, también reenvía `x-user-id` y `x-user-email`.
- Cada request genera o propaga `x-request-id` para trazabilidad entre servicios.
- Las operaciones de internships requieren autenticación en el gateway antes de llamar al upstream.

## Mapeo de errores estandarizado

Los errores upstream llegan al frontend como errores GraphQL con `extensions` consistentes:

- `BAD_REQUEST` para `400`
- `UNAUTHENTICATED` para `401`
- `FORBIDDEN` para `403`
- `NOT_FOUND` para `404`
- `CONFLICT` para `409`
- `UNPROCESSABLE_ENTITY` para `422`
- `RATE_LIMITED` para `429`
- `UPSTREAM_TIMEOUT` para timeouts
- `UPSTREAM_SERVICE_ERROR` para errores `5xx` del servicio upstream

Además del `code`, el gateway incluye:

- `statusCode`
- `service`
- `upstreamPath`
- `requestId`
- `retryable`

## 🐳 Docker

### Build

```bash
docker build -t api-gateway .
```

### Run

```bash
docker run -p 4000:4000 \
  -e AUTH_SERVICE_URL=http://auth-service:3001 \
  -e JWT_SECRET=your_secret \
  api-gateway
```

## 🚂 Deploy en Railway

### Configuración en Railway

1. **Crear nuevo proyecto** en Railway
2. **Conectar repositorio** de GitHub
3. **Configurar variables de entorno**:
   - `PORT` (Railway lo asigna automáticamente)
   - `AUTH_SERVICE_URL` (URL del auth-service en Railway)
  - `INTERNSHIP_SERVICE_URL` (URL del internship-service en Railway)
   - `JWT_SECRET` (misma que auth-service)
   - `CORS_ORIGIN` (URL del frontend)
  - `UPSTREAM_TIMEOUT_MS=10000`
  - `UPSTREAM_RETRIES=2`
  - `AUTH_SERVICE_HEALTH_PATH=/api/health`
  - `INTERNSHIP_SERVICE_HEALTH_PATH=/api/health`
   - `NODE_ENV=production`
   - `GRAPHQL_INTROSPECTION=false` (en producción)
   - `GRAPHQL_PLAYGROUND=false` (en producción)

4. **Deploy automático** se activará con cada push

### Conectar con Auth Service en Railway

El `AUTH_SERVICE_URL` debe apuntar al servicio interno de Railway:

```
AUTH_SERVICE_URL=https://auth-service.railway.app
```

O usar el dominio interno de Railway si ambos servicios están en el mismo proyecto:

```
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
```

## 🔗 Integración con Frontend

En tu frontend React, configura Apollo Client:

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql', // O tu URL de producción
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
```

## 📊 Arquitectura

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │ GraphQL
       ▼
┌─────────────┐
│ API Gateway │
│  (GraphQL)  │
└──────┬──────┘
       │ REST
       ▼
┌─────────────┐   ┌──────────────────┐
│Auth Service │   │ Internship Svc   │
│   (REST)    │   │      (REST)      │
└─────────────┘   └──────────────────┘
```

## 🛠️ Desarrollo

### Agregar Nuevos Servicios

1. Crear data source en `src/dataSources/`
2. Definir tipos en `src/schema/typeDefs.ts`
3. Crear resolvers en `src/resolvers/`
4. Actualizar context si es necesario

### Testing con GraphQL Playground

Accede a `http://localhost:4000/graphql` y usa el playground integrado para probar queries y mutations.

## 📝 Notas

- El API Gateway NO tiene base de datos propia
- Actúa como proxy entre el frontend y los microservicios
- Todos los errores de los servicios se transforman en errores de GraphQL
- Los tokens JWT se validan en el auth-service
- Las lecturas upstream usan timeout y retries controlados
- El health check REST y GraphQL agrega auth-service e internship-service

## Checklist E2E

- `register` crea usuario vía gateway y devuelve tokens.
- `login` devuelve `accessToken` y `refreshToken` válidos.
- `me` responde correctamente usando `Authorization: Bearer <token>`.
- `gatewayHealth` reporta `auth-service` e `internship-service`.
- `internshipDashboardMetrics` responde con usuario autenticado.
- `internshipApplications(filters)` propaga query params correctamente.
- `createInternshipApplication` crea un registro sin reintentos duplicados.
- `updateInternshipApplication` actualiza el recurso correcto por `id`.
- `connectInternshipEmailProvider` devuelve `redirectUrl` válido.
- Un `401` de upstream llega como `UNAUTHENTICATED`.
- Un timeout de upstream llega como `UPSTREAM_TIMEOUT`.
- Un `5xx` de upstream llega como `UPSTREAM_SERVICE_ERROR` con `requestId`.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
