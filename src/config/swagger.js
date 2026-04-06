import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description:
        'A role‑based backend for managing financial records, users, and dashboard analytics.',
      contact: { name: 'Developer' },
    },
    servers: [{ url: '/api', description: 'API base' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ── Auth ────────────────────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
            name: { type: 'string', example: 'Alice Johnson' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            password: { type: 'string', example: 'secret123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },

        // ── User ────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
            status: { type: 'string', enum: ['active', 'inactive'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },

        // ── Record ──────────────────────────────────────────
        RecordInput: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { type: 'number', example: 2500.0 },
            type: { type: 'string', enum: ['income', 'expense'], example: 'income' },
            category: { type: 'string', example: 'Salary' },
            date: { type: 'string', format: 'date', example: '2025-03-15' },
            description: { type: 'string', example: 'Monthly salary' },
          },
        },
        Record: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date' },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },

        // ── Dashboard ───────────────────────────────────────
        Summary: {
          type: 'object',
          properties: {
            totalIncome: { type: 'number' },
            totalExpenses: { type: 'number' },
            netBalance: { type: 'number' },
            totalRecords: { type: 'integer' },
          },
        },

        // ── Error ───────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },

    // ── Paths ─────────────────────────────────────────────────
    paths: {
      // AUTH
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } } },
          responses: {
            201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            409: { description: 'Email already exists' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'User profile' } },
        },
      },

      // USERS
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          ],
          responses: { 200: { description: 'Paginated user list' }, 403: { description: 'Forbidden' } },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'User details' }, 404: { description: 'Not found' } },
        },
      },
      '/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Update user role (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] } } } } } },
          responses: { 200: { description: 'Role updated' } },
        },
      },
      '/users/{id}/status': {
        patch: {
          tags: ['Users'],
          summary: 'Update user status (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'inactive'] } } } } } },
          responses: { 200: { description: 'Status updated' } },
        },
      },

      // RECORDS
      '/records': {
        get: {
          tags: ['Records'],
          summary: 'List financial records (analyst, admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'minAmount', schema: { type: 'number' } },
            { in: 'query', name: 'maxAmount', schema: { type: 'number' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'sortBy', schema: { type: 'string', default: 'date' } },
            { in: 'query', name: 'order', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          ],
          responses: { 200: { description: 'Paginated list of records' } },
        },
        post: {
          tags: ['Records'],
          summary: 'Create a financial record (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordInput' } } } },
          responses: { 201: { description: 'Record created' }, 422: { description: 'Validation error' } },
        },
      },
      '/records/{id}': {
        get: {
          tags: ['Records'],
          summary: 'Get record by ID (analyst, admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Record details' }, 404: { description: 'Not found' } },
        },
        put: {
          tags: ['Records'],
          summary: 'Update a record (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RecordInput' } } } },
          responses: { 200: { description: 'Record updated' } },
        },
        delete: {
          tags: ['Records'],
          summary: 'Delete a record (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Record deleted' } },
        },
      },

      // DASHBOARD
      '/dashboard/summary': {
        get: {
          tags: ['Dashboard'],
          summary: 'Overall financial summary',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Summary data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Summary' } } } } },
        },
      },
      '/dashboard/recent': {
        get: {
          tags: ['Dashboard'],
          summary: 'Recent transactions',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }],
          responses: { 200: { description: 'Recent records' } },
        },
      },
      '/dashboard/category-totals': {
        get: {
          tags: ['Dashboard'],
          summary: 'Category‑wise totals (analyst, admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Category breakdown' } },
        },
      },
      '/dashboard/trends': {
        get: {
          tags: ['Dashboard'],
          summary: 'Monthly trends (analyst, admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'query', name: 'year', schema: { type: 'integer', default: 2025 } }],
          responses: { 200: { description: 'Monthly income/expense trends' } },
        },
      },
    },
  },
  apis: [], // we define everything inline above
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
