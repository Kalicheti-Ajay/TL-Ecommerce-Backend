const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "E-Commerce API",
    version: "1.0.0",
    description: "REST API for products, authentication, and admin product management."
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
  tags: [
    { name: "Auth", description: "Registration, login, and user administration" },
    { name: "Products", description: "Product catalog and admin operations" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter the JWT returned by POST /api/auth/login."
      }
    },
    schemas: {
      Error: {
        type: "object",
        properties: { message: { type: "string", example: "Product not found." } }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "665f1c2e8f1d2a0012345678" },
          name: { type: "string", example: "Asha User" },
          email: { type: "string", format: "email", example: "user@example.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      ProductInput: {
        type: "object",
        required: ["name", "description", "price", "category", "stock"],
        properties: {
          name: { type: "string", example: "Sony WH-1000XM6" },
          description: { type: "string", example: "Noise-cancelling wireless headphones" },
          price: { type: "number", minimum: 0, example: 29990 },
          category: { type: "string", example: "Electronics" },
          stock: { type: "integer", minimum: 0, example: 12 },
          published: { type: "boolean", default: false, example: false }
        }
      },
      Product: {
        allOf: [
          { $ref: "#/components/schemas/ProductInput" },
          {
            type: "object",
            properties: {
              _id: { type: "string", example: "665f1c2e8f1d2a0012345678" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            }
          }
        ]
      },
      ProductResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Product created." },
          product: { $ref: "#/components/schemas/Product" }
        }
      }
    }
  },
  paths: {
    "/": {
      get: {
        tags: ["Auth"],
        summary: "Check API status",
        responses: { "200": { description: "API is running" } }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Asha User" },
                  email: { type: "string", format: "email", example: "user@example.com" },
                  password: { type: "string", minLength: 6, format: "password", example: "User123" },
                  role: { type: "string", enum: ["user", "admin"], default: "user" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "User registered" },
          "400": { description: "Invalid registration data", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Email already exists" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@example.com" },
                  password: { type: "string", format: "password", example: "Admin123" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: { "application/json": { schema: { type: "object", properties: { token: { type: "string" }, user: { $ref: "#/components/schemas/User" } } } } }
          },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/api/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "List users",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Users returned" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin access required" }
        }
      }
    },
    "/api/auth/users/{id}/role": {
      patch: {
        tags: ["Auth"],
        summary: "Update a user's role",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["role"], properties: { role: { type: "string", enum: ["user", "admin"] } } } } }
        },
        responses: {
          "200": { description: "Role updated" },
          "400": { description: "Invalid user id or role" },
          "401": { description: "Authentication required" },
          "403": { description: "Admin access required" },
          "404": { description: "User not found" }
        }
      }
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List products",
        description: "Without a token, only published products are returned. Admins receive all products.",
        security: [{ bearerAuth: [] }, {}],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["price_asc", "price_desc", "newest"], default: "newest" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } }
        ],
        responses: { "200": { description: "Products returned" }, "400": { description: "Invalid filter" } }
      },
      post: {
        tags: ["Products"],
        summary: "Create a product",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { "201": { description: "Product created", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } } }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" } }
      },
      delete: {
        tags: ["Products"],
        summary: "Delete all products",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Products deleted" }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" } }
      }
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get a product",
        security: [{ bearerAuth: [] }, {}],
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: { "200": { description: "Product returned" }, "400": { description: "Invalid product id" }, "404": { description: "Product not found" } }
      },
      put: {
        tags: ["Products"],
        summary: "Update a product",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { "200": { description: "Product updated" }, "400": { description: "Invalid product data or id" }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" }, "404": { description: "Product not found" } }
      },
      delete: {
        tags: ["Products"],
        summary: "Delete a product",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: { "200": { description: "Product deleted" }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" }, "404": { description: "Product not found" } }
      }
    },
    "/api/products/{id}/publish": {
      patch: {
        tags: ["Products"], summary: "Publish a product", security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: { "200": { description: "Product published" }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" }, "404": { description: "Product not found" } }
      }
    },
    "/api/products/{id}/unpublish": {
      patch: {
        tags: ["Products"], summary: "Unpublish a product", security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: { "200": { description: "Product unpublished" }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" }, "404": { description: "Product not found" } }
      }
    },
    "/api/products/import": {
      post: {
        tags: ["Products"], summary: "Import products from CSV", security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } } } },
        responses: { "201": { description: "Products imported" }, "400": { description: "CSV validation failed or file missing" }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" } }
      }
    },
    "/api/products/export": {
      get: {
        tags: ["Products"], summary: "Export products as CSV", security: [{ bearerAuth: [] }],
        responses: { "200": { description: "CSV file", content: { "text/csv": { schema: { type: "string", format: "binary" } } } }, "401": { description: "Authentication required" }, "403": { description: "Admin access required" } }
      }
    }
  }
};

swaggerDocument.components.parameters = {
  id: { name: "id", in: "path", required: true, description: "MongoDB document id", schema: { type: "string", example: "665f1c2e8f1d2a0012345678" } }
};

module.exports = swaggerDocument;
