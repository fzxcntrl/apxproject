# Task Manager API

A RESTful API for managing personal tasks, built with **Node.js**, **Express**, and **Prisma ORM**. Features JWT-based authentication, soft-delete/restore, filtering, search, and sorting — all scoped per user.

---

## Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Runtime        | Node.js                           |
| Framework      | Express.js                        |
| ORM            | Prisma (PostgreSQL)               |
| Authentication | JSON Web Tokens (`jsonwebtoken`)  |
| Password Hash  | bcryptjs (10 salt rounds)         |
| Logging        | Morgan (dev format)               |
| CORS           | cors middleware                   |
| Environment    | dotenv                            |

---

## Project Structure

```
apxproject/
├── prisma/
│   ├── schema.prisma          # Data models (User, Task) + enums
│   └── migrations/            # Auto-generated SQL migrations
├── src/
│   ├── config/
│   │   └── db.js              # Singleton PrismaClient
│   ├── controllers/
│   │   ├── auth.controller.js # register, login
│   │   └── task.controller.js # CRUD + soft-delete/restore
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verification (verifyToken)
│   │   └── errorHandler.js    # Centralized error handler
│   ├── routes/
│   │   ├── auth.routes.js     # POST /register, /login
│   │   └── task.routes.js     # Task CRUD routes
│   ├── utils/                 # Utility helpers (reserved)
│   ├── app.js                 # Express app setup + middleware
│   └── server.js              # Entry point — starts listening
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/fzxcntrl/apxproject.git
cd apxproject
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager?schema=public"
JWT_SECRET="a-strong-random-secret"
JWT_EXPIRES_IN="7d"
```

> **Note:** On macOS, port 5000 is used by AirPlay Receiver. Use port 3001 or disable AirPlay in System Settings → General → AirDrop & Handoff.

### 4. Run database migration

```bash
npx prisma migrate dev --name init
```

This creates the `users` and `tasks` tables in your PostgreSQL database and generates the Prisma Client.

### 5. Start the development server

```bash
npm run dev
```

The server starts at `http://localhost:3001` (or your configured `PORT`) with auto-restart on file changes.

---

## API Reference

### Health Check

| Method | Path      | Auth | Description         |
| ------ | --------- | ---- | ------------------- |
| GET    | `/health` | No   | Server health check |

**Response:**

```json
{ "status": "ok" }
```

---

### Authentication (`/api/auth`)

#### `POST /api/auth/register`

Create a new user account.

| Auth Required | No |
| ------------- | -- |

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**Validation rules:**
- `email` — required, must be a valid email format
- `password` — required, minimum 6 characters

**Success response (201):**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com"
  }
}
```

**Error responses:**

| Status | Message                                |
| ------ | -------------------------------------- |
| 400    | Email and password are required        |
| 400    | Invalid email format                   |
| 400    | Password must be at least 6 characters |
| 409    | Email already in use                   |

---

#### `POST /api/auth/login`

Authenticate and receive a JWT token.

| Auth Required | No |
| ------------- | -- |

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**Success response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error responses:**

| Status | Message                         |
| ------ | ------------------------------- |
| 400    | Email and password are required |
| 401    | Invalid email or password       |

---

### Tasks (`/api/tasks`)

> All task endpoints require the `Authorization: Bearer <token>` header.
> All operations are scoped to the authenticated user — users can only access their own tasks.

---

#### `POST /api/tasks`

Create a new task.

| Auth Required | Yes |
| ------------- | --- |

**Request body:**

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "HIGH",
  "dueDate": "2026-07-10"
}
```

| Field         | Type   | Required | Notes                                   |
| ------------- | ------ | -------- | --------------------------------------- |
| `title`       | string | Yes      | Cannot be empty/whitespace              |
| `description` | string | No       | Defaults to `null`                      |
| `priority`    | enum   | No       | `LOW`, `MEDIUM`, `HIGH` (default: `MEDIUM`) |
| `dueDate`     | string | No       | ISO 8601 date string                    |

**Success response (201):**

```json
{
  "success": true,
  "data": {
    "id": "f1e2d3c4-...",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "HIGH",
    "status": "PENDING",
    "dueDate": "2026-07-10T00:00:00.000Z",
    "isDeleted": false,
    "createdAt": "2026-07-04T00:00:00.000Z",
    "updatedAt": "2026-07-04T00:00:00.000Z",
    "userId": "a1b2c3d4-..."
  }
}
```

---

#### `GET /api/tasks`

List all non-deleted tasks for the authenticated user.

| Auth Required | Yes |
| ------------- | --- |

**Query parameters (all optional, combinable):**

| Param      | Values                    | Description                          |
| ---------- | ------------------------- | ------------------------------------ |
| `status`   | `PENDING`, `COMPLETED`    | Filter by task status                |
| `priority` | `LOW`, `MEDIUM`, `HIGH`   | Filter by priority level             |
| `search`   | any string                | Case-insensitive search on title     |
| `sortBy`   | `dueDate`, `createdAt`    | Sort field (default: `createdAt`)    |
| `order`    | `asc`, `desc`             | Sort direction (default: `desc`)     |

**Example requests:**

```
GET /api/tasks?status=PENDING
GET /api/tasks?priority=HIGH&sortBy=dueDate&order=asc
GET /api/tasks?search=grocery
GET /api/tasks?status=PENDING&search=buy&sortBy=createdAt&order=asc
```

**Success response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "f1e2d3c4-...",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "priority": "HIGH",
      "status": "PENDING",
      "dueDate": "2026-07-10T00:00:00.000Z",
      "isDeleted": false,
      "createdAt": "2026-07-04T00:00:00.000Z",
      "updatedAt": "2026-07-04T00:00:00.000Z",
      "userId": "a1b2c3d4-..."
    }
  ]
}
```

---

#### `GET /api/tasks/:id`

Get a single task by ID.

| Auth Required | Yes |
| ------------- | --- |

**Success response (200):**

```json
{
  "success": true,
  "data": { "id": "...", "title": "...", "..." : "..." }
}
```

**Error response (404):** `{ "success": false, "message": "Task not found" }`

---

#### `PUT /api/tasks/:id`

Update an existing task.

| Auth Required | Yes |
| ------------- | --- |

**Request body** (all fields optional):

```json
{
  "title": "Buy organic groceries",
  "description": "Updated list",
  "priority": "MEDIUM",
  "status": "COMPLETED",
  "dueDate": "2026-07-15"
}
```

**Validation:** Same enum/format rules as create. Title cannot be set to empty.

**Success response (200):**

```json
{
  "success": true,
  "data": { "id": "...", "title": "Buy organic groceries", "status": "COMPLETED", "..." : "..." }
}
```

**Error responses:**

| Status | Message                                              |
| ------ | ---------------------------------------------------- |
| 400    | Invalid priority — must be one of: LOW, MEDIUM, HIGH |
| 400    | Invalid status — must be one of: PENDING, COMPLETED  |
| 400    | Invalid dueDate format                               |
| 400    | Title cannot be empty                                |
| 404    | Task not found                                       |

---

#### `DELETE /api/tasks/:id`

Soft-delete a task (sets `isDeleted = true`). The row is preserved in the database.

| Auth Required | Yes |
| ------------- | --- |

**Success response (200):**

```json
{ "success": true, "message": "Task deleted" }
```

**Error response (404):** `{ "success": false, "message": "Task not found" }`

---

#### `PATCH /api/tasks/:id/restore`

Restore a soft-deleted task (sets `isDeleted = false`).

| Auth Required | Yes |
| ------------- | --- |

**Success response (200):**

```json
{
  "success": true,
  "data": { "id": "...", "isDeleted": false, "..." : "..." }
}
```

**Error response (404):** `{ "success": false, "message": "Task not found or not deleted" }`

---

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

| Status | When                                       |
| ------ | ------------------------------------------ |
| 400    | Validation failure (missing/invalid fields)|
| 401    | Missing or invalid JWT token               |
| 404    | Resource not found or unmatched route      |
| 409    | Conflict (e.g., duplicate email)           |
| 500    | Unexpected server error                    |

In development, 500 errors include a `stack` trace for debugging.

---

## Data Models

### User

| Field      | Type     | Notes                  |
| ---------- | -------- | ---------------------- |
| `id`       | UUID     | Primary key            |
| `email`    | String   | Unique                 |
| `password` | String   | bcrypt hash (10 rounds)|
| `createdAt`| DateTime | Auto-set               |

### Task

| Field        | Type     | Notes                            |
| ------------ | -------- | -------------------------------- |
| `id`         | UUID     | Primary key                      |
| `title`      | String   | Required                         |
| `description`| String?  | Optional                         |
| `priority`   | Enum     | `LOW`, `MEDIUM`, `HIGH`          |
| `status`     | Enum     | `PENDING`, `COMPLETED`           |
| `dueDate`    | DateTime?| Optional                         |
| `isDeleted`  | Boolean  | Soft-delete flag (default: false) |
| `createdAt`  | DateTime | Auto-set                         |
| `updatedAt`  | DateTime | Auto-updated                     |
| `userId`     | UUID     | Foreign key → User               |

---

## Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm start`     | Start production server                  |
| `npm run dev`   | Start dev server with auto-restart       |
| `npx prisma migrate dev` | Create and apply migrations     |
| `npx prisma studio`      | Open visual database browser    |
| `npx prisma generate`    | Regenerate Prisma Client        |

---

## License

ISC
