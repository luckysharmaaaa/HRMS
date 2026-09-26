# Base API

> A production-ready Node.js + Express + PostgreSQL base project.  
> Clone this, rename it, and build your feature modules on top.

---

## 📁 Project Structure

```
base-api/
├── src/
│   ├── server.js               # Entry point (class-based App)
│   ├── config/
│   │   └── index.js            # All config from .env
│   ├── core/
│   │   └── BaseModel.js        # ORM framework (extends pg-promise)
│   ├── db/
│   │   ├── connection.js       # pg-promise setup (Neon + local)
│   │   ├── migrate.js          # SQL migration runner
│   │   ├── rollback.js         # Rollback runner
│   │   ├── seed.js             # Seed data runner
│   │   └── migrations/         # Put your .sql files here
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT authentication
│   │   ├── error.middleware.js      # Global error + 404 handler
│   │   ├── rbac.middleware.js       # Role-based access control
│   │   ├── validation.middleware.js # Joi request validation
│   │   └── upload.middleware.js     # Multer file uploads
│   ├── utils/
│   │   ├── logger.js           # Winston logger
│   │   ├── apiError.js         # Custom ApiError class
│   │   ├── jwt.js              # Token generation + verification
│   │   ├── password.js         # bcrypt hash / compare / validate
│   │   └── response.js         # sendSuccess / sendError / sendPaginated
│   ├── models/
│   │   └── user.model.js       # Sample UserModel extending BaseModel
│   ├── services/
│   │   └── auth.service.js     # Auth business logic
│   ├── controllers/
│   │   └── auth.controller.js  # register, login, refresh, logout, me
│   └── routes/
│       ├── index.js            # Route aggregator
│       └── auth.routes.js      # /auth/* endpoints
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DB_*, JWT_SECRET, etc.

# 3. Run migrations
npm run migrate

# 4. (Optional) Seed data
npm run seed

# 5. Start dev server
npm run dev
```

The server starts on `http://localhost:5000` by default.

---

## 📡 API Endpoints

| Method | Path                  | Auth | Description       |
|--------|-----------------------|------|-------------------|
| POST   | /api/v1/auth/register | No   | Register user     |
| POST   | /api/v1/auth/login    | No   | Login             |
| POST   | /api/v1/auth/refresh  | No   | Refresh token     |
| POST   | /api/v1/auth/logout   | Yes  | Logout            |
| GET    | /api/v1/auth/me       | Yes  | Current user info |
| GET    | /api/v1/health        | No   | Health check      |

---

## 🏗️ Architecture

```
Request
  ↓ Middleware (Helmet, CORS, Rate-limit, Body parser)
  ↓ Auth Middleware (JWT verify → req.user)
  ↓ RBAC Middleware (role / permission check)
  ↓ Validation Middleware (Joi schema)
  ↓ Route
  ↓ Controller
  ↓ Service (business logic)
  ↓ Model (BaseModel + pg-promise → PostgreSQL)
  ↓ Response
```

---

## 🧩 Adding a New Module

1. **Create SQL migration** in `src/db/migrations/00N_create_your_table.sql`
2. **Create Model** in `src/models/your.model.js` — extend `BaseModel`
3. **Create Controller** in `src/controllers/your.controller.js`
4. **Create Routes** in `src/routes/your.routes.js`
5. **Register routes** in `src/routes/index.js`

---

## ⚙️ BaseModel API

```js
// All options are optional
await model.findAll({ where, columns, joins, orderBy, limit, offset });
await model.findById(id, { columns, joins });
await model.findOne(where, { columns });
await model.create(data);
await model.createMany([data1, data2]);
await model.update(id, data);
await model.updateWhere(where, data);
await model.delete(id);              // soft-delete if enabled
await model.delete(id, { force: true }); // hard-delete
await model.deleteWhere(where);
await model.restore(id);             // un-soft-delete
await model.count(where);
await model.exists(where);
await model.paginate({ page, limit, where, orderBy });
await model.search('term', { limit });
await model.raw('SELECT ...', [params], { method: 'any' });
await model.transaction(async (t) => { /* ... */ });
```

---

## 🔐 Environment Variables

See [`.env.example`](.env.example) for the full list.

---

## 📋 Scripts

| Command             | Description                       |
|---------------------|-----------------------------------|
| `npm run dev`       | Start dev server with nodemon     |
| `npm start`         | Start production server           |
| `npm run migrate`   | Run pending migrations            |
| `npm run migrate:rollback` | Rollback last migration    |
| `npm run seed`      | Seed development data             |
| `npm test`          | Run Jest tests                    |
| `npm run lint`      | Lint source files                 |

---

## 🛡️ Security Features

- **Helmet** — HTTP security headers
- **CORS** — configurable origin whitelist
- **Rate limiting** — 100 req / 15 min by default
- **JWT** — access + refresh token pair
- **bcrypt** — password hashing (10 rounds)
- **Joi** — input validation on every route
- **RBAC** — role/permission guards

---

**Node.js 18+ required**
