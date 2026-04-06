# Finance Data Processing and Access Control Backend

A complete backend system for managing financial records with robust role-based access control (RBAC), dashboard analytics, and comprehensive API design. Built to evaluate back-end engineering principles.

## Features

- User & Role Management: Secure JWT-based authentication. Roles include `viewer`, `analyst`, and `admin` with strict access controls.
- Financial Records Management: CRUD operations for financial entries (amount, type, category, date, description) with advanced filtering, sorting, and pagination.
- Dashboard Analytics: High-level summaries (total income, total expenses, net balance), category-wise totals, monthly trends for a given year, and recent activities.
- Access Control Logic: Centralized role-based middleware to enforce permission matrices across endpoints.
- Validation: Strict request payload and query validation using `Joi`.
- Data Persistence: In-memory SQLite (`sql.js`) with periodic file-system sync for a portable, zero-configuration setup that still persists data.
- Error Handling: Standardized error responses with appropriate HTTP status codes, operational error flags, and a global error handling middleware.
- API Documentation: Auto-generated interactive Swagger UI.

## Technology Stack

| Technology | Rationale |
|------------|-----------|
| Node.js / Express | Lightweight, fast, and excellent middleware architecture |
| SQLite (sql.js) | Zero configuration, embedded SQL database that persists to disk |
| JWT & bcryptjs | Stateless, secure, industry-standard authentication |
| Joi | Declarative schema validation for foolproof request bodies |
| Jest & Supertest | Comprehensive unit & integration testing framework |
| Swagger UI | Clean, interactive API documentation |

## Architecture

The application strictly adheres to the principle of Separation of Concerns:
- `routes/` - Maps HTTP paths and methods to specific controller functions. Applies auth and validation middleware.
- `controllers/` - Thin wrappers. Extracts request data and passes it to the service layer.
- `services/` - The core business logic. Enforces business rules and manages data manipulation.
- `models/` - Data Access Layer (DAL). Direct SQL queries and database abstractions.
- `middleware/` - Cross-cutting concerns like JWT auth validation, role authorization, generic rate-limiting, and error handling.

## Setup & Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Variables:
   A default `.env.example` is provided (if needed), but the app falls back to defaults out of the box. 
   *(Default Port: 3000, Default JWT Secret: `supersecret_change_in_production`)*

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Run the Server (Production Mode):
   ```bash
   npm start
   ```

5. Seed the Database (Optional):
   ```bash
   npm run seed
   ```
   *This drops existing data and seeds admin, analyst, and viewer accounts along with dummy transactions.*

## Testing

The codebase includes an extensive suite of integration tests.

```bash
# Run tests
npm test

# Run tests with verbose output
npm run test:verbose
```

## API Documentation

Once the server is running, interactive API documentation is available at:
http://localhost:3000/api/docs

### Key Endpoint Overview

| Resource | Endpoints | Access |
|---|---|---|
| Auth | `POST /api/auth/register`, `/login`, `GET /me` | Public / All Auth |
| Users | `GET /api/users`, `PATCH /role`, `PATCH /status`, `DELETE` | Admin only |
| Records | `GET /api/records` | Analyst, Admin |
| Records | `POST`, `PUT`, `DELETE /api/records/:id` | Admin only |
| Dashboard | `GET /api/dashboard/summary`, `/recent` | All Auth |
| Dashboard | `GET /api/dashboard/category-totals`, `/trends` | Analyst, Admin |

## Assumptions & Tradeoffs

1. Storage Choice (sql.js) 
   Instead of using a heavy relational database like PostgreSQL or a document store like MongoDB, this project uses `sql.js` (an embedded SQLite compiled to WebAssembly) that writes its Buffer to disk every 30 seconds. 
   Tradeoff: It sacrifices high concurrency write performance in favor of extreme portability. For an evaluation assignment, it guarantees that reviewers can run the application instantly without needing Docker or a local database server running, while still demonstrating full SQL querying capabilities.
2. Soft Deletes
   Records and Users are "soft deleted" via a `deleted_at` timestamp. This preserves referential integrity and audit trails.
3. Audit Logging
   A simplified `audit_log` table is implemented in the database to track mutations (Create/Update/Delete). This showcases real-world compliance practices but operates silently to avoid breaking the core flow if logging fails.
4. Authentication
   Authentication relies on stateless JWTs. No refresh tokens are implemented to keep the scope focused on core backend structure and access control.
5. Rate Limiting
   A global rate limiter (`express-rate-limit`) is applied to protect against basic brute-force attacks, typical in production setups.
