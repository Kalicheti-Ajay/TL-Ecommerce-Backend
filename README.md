# Basic E-Commerce Backend API

Node.js, Express, MongoDB, Mongoose, JWT, role-based authorization, product CRUD, filters, pagination, and admin CSV import/export.

## Run

1. Start MongoDB locally.
2. Confirm `.env` has `MONGO_URI`, `JWT_SECRET`, and optionally `PORT`.
3. In this folder run `npm start`.

Base URL: `http://localhost:3000`

Swagger UI: `http://localhost:3000/api-docs`

Open Swagger UI after starting the server to browse and test every endpoint. Use the **Authorize** button to enter a JWT as `Bearer <token>` after logging in.

## Insomnia test sequence

For authenticated routes add header `Authorization: Bearer <token>`. Registering with `role: "admin"` is intentionally enabled for this classroom/demo project, so an admin can be bootstrapped without manually editing MongoDB. In a production app, admin creation should be restricted to a server-side seed process.

| Method | Endpoint | Auth | Body / purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | `{ "name":"Admin", "email":"admin@example.com", "password":"Admin123", "role":"admin" }` |
| POST | `/api/auth/register` | No | `{ "name":"Asha User", "email":"user@example.com", "password":"User123", "role":"user" }` |
| POST | `/api/auth/login` | No | `{ "email":"admin@example.com", "password":"Admin123" }` — save returned `token` as `adminToken` |
| POST | `/api/auth/login` | No | `{ "email":"user@example.com", "password":"User123" }` — save returned `token` as `userToken` |
| GET | `/api/auth/users` | Admin | Lists all users. |
| PATCH | `/api/auth/users/:id/role` | Admin | `{ "role":"admin" }` or `{ "role":"user" }` |
| POST | `/api/products` | Admin | Product JSON below. Save returned `product._id` as `productId`. |
| GET | `/api/products` | No | Public list: only published products. |
| GET | `/api/products?category=mobile&minPrice=20000&maxPrice=90000&sort=price_asc&page=1&limit=10` | No | Public filters, sort, and pagination. Valid sort values: `price_asc`, `price_desc`, `newest`. |
| GET | `/api/products` | Admin | Lists both published and unpublished products. |
| GET | `/api/products/:productId` | No | Public only receives a published product. |
| PUT | `/api/products/:productId` | Admin | Send all product fields. |
| PATCH | `/api/products/:productId/publish` | Admin | No body; makes it public. |
| PATCH | `/api/products/:productId/unpublish` | Admin | No body; hides it from users. |
| DELETE | `/api/products/:productId` | Admin | Deletes product. |
| POST | `/api/products/import` | Admin | Body type **Multipart Form**; field name `file`, type File; choose `sample-data/products.csv`. |
| GET | `/api/products/export` | Admin | Returns downloadable `products.csv`. |

Create/update body:

```json
{
  "name": "Sony WH-1000XM6",
  "description": "Noise-cancelling wireless headphones",
  "price": 29990,
  "category": "Electronics",
  "stock": 12,
  "published": false
}
```

Useful authorization checks: call `POST /api/products`, `GET /api/products/export`, or `POST /api/products/import` using `userToken`; every request returns HTTP 403. Create an unpublished product, then call `GET /api/products/:productId` without a token; it returns 404. Publish it and repeat; it returns 200.

CSV requires exactly these headers: `name,description,price,category,stock,published`. Every row is checked before insertion, so an invalid row prevents the whole file from being imported. `price` must be positive, `stock` a non-negative integer, and `published` exactly `true` or `false`.
