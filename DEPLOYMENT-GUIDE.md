# Guía de Deployment - API Gateway en Railway

## 🎯 Arquitectura del Sistema

```
Frontend (Vercel)
    ↓ GraphQL
API Gateway (Railway) - Puerto 4000
    ↓ REST
Auth Service (Railway) - Puerto 3001
    ↓
PostgreSQL (Railway)
```

## 🔧 Variables de Entorno en Railway - API Gateway

Al hacer deploy del API Gateway en Railway, configura estas variables:

```bash
# Puerto (Railway lo asigna automáticamente, pero puedes usar 4000)
PORT=4000

# Entorno
NODE_ENV=production

# URL del Auth Service en Railway
# IMPORTANTE: Usa la URL interna de Railway si están en el mismo proyecto
# O la URL pública si están en proyectos separados
AUTH_SERVICE_URL=https://tu-auth-service.up.railway.app

# JWT Secret (DEBE SER EL MISMO que en auth-service)
JWT_SECRET=tu_super_secreto_jwt_cambiar_en_produccion

# CORS Origin (URL de tu frontend en Vercel)
CORS_ORIGIN=https://tu-frontend.vercel.app

# GraphQL Settings (en producción, deshabilitar para seguridad)
GRAPHQL_INTROSPECTION=false
GRAPHQL_PLAYGROUND=false
```

## 📝 Pasos para Deploy en Railway

### 1. Preparar el repositorio

Asegúrate de que tu código esté en GitHub con estos cambios:

```bash
git add .
git commit -m "Add API Gateway with GraphQL"
git push origin main
```

### 2. Crear nuevo servicio en Railway

1. Ve a [Railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Railway detectará el Dockerfile automáticamente

### 3. Configurar Variables de Entorno

En el dashboard de Railway para el API Gateway:

- Click en el servicio
- Ve a "Variables"
- Agrega todas las variables mencionadas arriba

**IMPORTANTE**: 
- Si auth-service está en el mismo proyecto de Railway, usa la URL interna: `http://auth-service.railway.internal:3001`
- Si está en proyecto diferente, usa la URL pública: `https://tu-auth-service.up.railway.app`

### 4. Verificar JWT_SECRET

El `JWT_SECRET` en API Gateway **DEBE SER EXACTAMENTE EL MISMO** que en auth-service para que los tokens funcionen.

Verifica en auth-service Railway:
- Variables → `JWT_SECRET`
- Copia el mismo valor al API Gateway

### 5. Configurar CORS

En auth-service también necesitas actualizar el CORS para permitir requests del API Gateway:

```bash
# En auth-service Railway, agregar/actualizar:
CORS_ORIGIN=https://tu-api-gateway.up.railway.app,https://tu-frontend.vercel.app
```

## 🌐 URLs Finales

Después del deploy, tendrás:

- **API Gateway GraphQL**: `https://tu-api-gateway.up.railway.app/graphql`
- **API Gateway Health**: `https://tu-api-gateway.up.railway.app/health`
- **Auth Service**: `https://tu-auth-service.up.railway.app`
- **Frontend**: `https://tu-frontend.vercel.app`

## 🧪 Probar el API Gateway

Una vez deployado:

1. **Health Check**:
   ```bash
   curl https://tu-api-gateway.up.railway.app/health
   ```

2. **GraphQL Query** (desde terminal o Postman):
   ```bash
   curl -X POST https://tu-api-gateway.up.railway.app/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ health }"}'
   ```

3. **Test Register**:
   ```graphql
   mutation {
     register(
       name: "Test User"
       email: "test@example.com"
       password: "password123"
     ) {
       success
       message
       accessToken
       user {
         id
         name
         email
       }
     }
   }
   ```

## 📱 Configurar Frontend (Vercel)

El frontend necesita la URL del API Gateway. Crea variable de entorno en Vercel:

```bash
VITE_GRAPHQL_URL=https://tu-api-gateway.up.railway.app/graphql
```

Y el frontend necesitará Apollo Client (lo configuramos después).

## ⚠️ Checklist antes del Deploy

- [ ] Auth Service corriendo en Railway
- [ ] Base de datos PostgreSQL en Railway
- [ ] `JWT_SECRET` es el mismo en auth-service y API Gateway
- [ ] `AUTH_SERVICE_URL` apunta al auth-service correcto
- [ ] `CORS_ORIGIN` incluye la URL del frontend
- [ ] Código subido a GitHub
- [ ] Dockerfile presente en api-gateway/

## 🔍 Troubleshooting

### Error: "Cannot connect to auth-service"
- Verifica que `AUTH_SERVICE_URL` sea correcta
- Si están en el mismo proyecto Railway, usa URL interna
- Verifica que auth-service esté corriendo

### Error: "Invalid token" 
- `JWT_SECRET` no coincide entre servicios
- Asegúrate que sea EXACTAMENTE el mismo

### Error: "CORS"
- Agrega la URL del frontend a `CORS_ORIGIN` en API Gateway
- Agrega la URL del API Gateway a `CORS_ORIGIN` en auth-service

### Error: "Database connection"
- Auth-service necesita tener `DATABASE_URL` configurada correctamente
- Railway la provee automáticamente si agregaste PostgreSQL

## 🚀 Deploy Automático

Railway hace deploy automático cada vez que hagas push a main:

```bash
git add .
git commit -m "Update API Gateway"
git push origin main
```

Railway detectará los cambios y redesplegará automáticamente.
