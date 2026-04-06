import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { initTestDatabase, getDatabase } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

let db;

// ── bootstrap ──────────────────────────────────────────────────
beforeAll(async () => {
  db = await initTestDatabase();
});

afterAll(() => {
  if (db) db.close();
});

// helper — register + login and return the token
async function registerAndLogin(email, password, name, role) {
  // register
  await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  // if role isn't viewer, update it directly in the DB
  if (role && role !== 'viewer') {
    db.run("UPDATE users SET role = ? WHERE email = ?", [role, email]);
  }

  // login
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return res.body.data.token;
}

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════
describe('Auth', () => {
  test('POST /api/auth/register — creates a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'test1234', name: 'Test User' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.role).toBe('viewer');
  });

  test('POST /api/auth/register — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'test1234', name: 'Dup User' });

    expect(res.statusCode).toBe(409);
  });

  test('POST /api/auth/register — validation errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '12' });

    expect(res.statusCode).toBe(422);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login — valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test1234' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/login — invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me — returns profile with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test1234' });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('test@example.com');
  });

  test('GET /api/auth/me — rejects request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════
//  ACCESS CONTROL
// ═══════════════════════════════════════════════════════════════
describe('Access Control', () => {
  let adminToken, analystToken, viewerToken;

  beforeAll(async () => {
    adminToken = await registerAndLogin('admin-test@example.com', 'admin123', 'Admin', 'admin');
    analystToken = await registerAndLogin('analyst-test@example.com', 'analyst123', 'Analyst', 'analyst');
    viewerToken = await registerAndLogin('viewer-test@example.com', 'viewer123', 'Viewer', 'viewer');
  });

  test('Viewer CANNOT create records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 100, type: 'income', category: 'Test', date: '2025-01-01' });

    expect(res.statusCode).toBe(403);
  });

  test('Analyst CANNOT create records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 100, type: 'income', category: 'Test', date: '2025-01-01' });

    expect(res.statusCode).toBe(403);
  });

  test('Admin CAN create records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, type: 'income', category: 'Test', date: '2025-01-01' });

    expect(res.statusCode).toBe(201);
  });

  test('Viewer CANNOT list records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Analyst CAN list records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Viewer CAN view dashboard summary', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Viewer CANNOT view category totals', async () => {
    const res = await request(app)
      .get('/api/dashboard/category-totals')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Analyst CAN view category totals', async () => {
    const res = await request(app)
      .get('/api/dashboard/category-totals')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Viewer CANNOT manage users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════
//  RECORDS  CRUD
// ═══════════════════════════════════════════════════════════════
describe('Records CRUD', () => {
  let adminToken;
  let createdRecordId;

  beforeAll(async () => {
    adminToken = await registerAndLogin('records-admin@example.com', 'admin123', 'Rec Admin', 'admin');
  });

  test('Create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 2500,
        type: 'income',
        category: 'Salary',
        date: '2025-03-15',
        description: 'March paycheck',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.amount).toBe(2500);
    createdRecordId = res.body.data.id;
  });

  test('Get a record by ID', async () => {
    const res = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(createdRecordId);
  });

  test('Update a record', async () => {
    const res = await request(app)
      .put(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 3000, description: 'Updated paycheck' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.amount).toBe(3000);
  });

  test('Delete a record (soft)', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    // should no longer be found
    const check = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(check.statusCode).toBe(404);
  });

  test('Validation — reject record with missing fields', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -50 }); // negative + missing required fields

    expect(res.statusCode).toBe(422);
  });

  test('Filtering — by type', async () => {
    // Create one of each type
    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 500, type: 'expense', category: 'Food', date: '2025-03-20' });

    const res = await request(app)
      .get('/api/records?type=expense')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    for (const record of res.body.data) {
      expect(record.type).toBe('expense');
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════
describe('Dashboard', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await registerAndLogin('dash-admin@example.com', 'admin123', 'Dash Admin', 'admin');

    // seed a few records for this test suite
    const records = [
      { amount: 1000, type: 'income',  category: 'Salary',   date: '2025-06-05' },
      { amount: 500,  type: 'expense', category: 'Rent',     date: '2025-06-07' },
      { amount: 200,  type: 'expense', category: 'Food',     date: '2025-06-10' },
      { amount: 300,  type: 'income',  category: 'Freelance', date: '2025-06-15' },
    ];
    for (const r of records) {
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(r);
    }
  });

  test('GET /api/dashboard/summary — returns totals', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalIncome');
    expect(res.body.data).toHaveProperty('totalExpenses');
    expect(res.body.data).toHaveProperty('netBalance');
    expect(res.body.data.netBalance).toBe(
      res.body.data.totalIncome - res.body.data.totalExpenses,
    );
  });

  test('GET /api/dashboard/category-totals — returns breakdown', async () => {
    const res = await request(app)
      .get('/api/dashboard/category-totals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const cat of res.body.data) {
      expect(cat).toHaveProperty('category');
    }
  });

  test('GET /api/dashboard/trends — returns 12 months', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends?year=2025')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(12);
  });

  test('GET /api/dashboard/recent — returns recent records', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });
});

// ═══════════════════════════════════════════════════════════════
//  MISC
// ═══════════════════════════════════════════════════════════════
describe('Misc', () => {
  test('GET /api/health — returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});
