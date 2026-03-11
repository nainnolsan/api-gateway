# 📝 URLs de Servicios - COMPLETAR

## Railway URLs (obtenerlas del dashboard de Railway)

### Auth Service (ya deployado)
- URL pública: auth-service-production-9602.up.railway.app
- Puerto interno: 3001

### PostgreSQL Database (Railway)
- DATABASE_URL: Se configura automáticamente en auth-service

### API Gateway (por deployar)
- URL pública: api-gateway-production-0b95.up.railway.app
- Puerto: 4000

## Vercel URLs

### Frontend (ya deployado o por deployar)
- URL producción: https://viewsportfolio-p3oq1f1hv-nain-nolascos-projects.vercel.app/
- URL desarrollo local: http://localhost:5173

---

## ✅ Checklist de Configuración

### 1. Auth Service en Railway
- [ ] Está corriendo correctamente
- [ ] Tiene `DATABASE_URL` configurada
- [ ] Tiene `JWT_SECRET` configurado
- [ ] Anotar URL pública: ___________________

### 2. API Gateway - Variables para Railway
Configurar en Railway Dashboard → Variables:

```
NODE_ENV=production
PORT=4000
AUTH_SERVICE_URL=https://[TU-AUTH-SERVICE].up.railway.app
JWT_SECRET=[MISMO-QUE-AUTH-SERVICE]
CORS_ORIGIN=https://[TU-FRONTEND].vercel.app
GRAPHQL_INTROSPECTION=false
GRAPHQL_PLAYGROUND=false
```

### 3. Frontend - Variables para Vercel
Configurar en Vercel Dashboard → Settings → Environment Variables:

```
VITE_GRAPHQL_URL=https://api-gateway-production-0b95.up.railway.app/graphql
```

### 4. Actualizar CORS en Auth Service
En Railway, auth-service necesita permitir requests del API Gateway:

```
CORS_ORIGIN=api-gateway-production-da00.up.railway.app, https://viewsportfolio-p3oq1f1hv-nain-nolascos-projects.vercel.app/
```

---

## 🎯 Orden de Deploy

1. ✅ Auth Service (ya está en Railway)
2. ✅ PostgreSQL (ya está en Railway)
3. ⏳ **API Gateway** - Deployar ahora a Railway
4. ⏳ **Frontend** - Actualizar variables en Vercel

---

## 🔑 Importante

**JWT_SECRET**: El mismo valor debe estar en:
- Auth Service (Railway)
- API Gateway (Railway)

Puedes obtenerlo de tu auth-service en Railway:
1. Railway Dashboard → auth-service
2. Variables → JWT_SECRET
3. Copiar ese valor exacto al API Gateway
