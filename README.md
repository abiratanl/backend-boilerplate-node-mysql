# Backend Boilerplate (Node.js + MySQL + Docker) #

A robust, production-ready boilerplate for building RESTful APIs using Node.js and MySQL. It features a fully Dockerized environment, JWT authentication, **Swagger documentation**, **Automated Testing**, Role-Based Access Control (RBAC), **Rate Limiting**, and a secure invite-only registration flow.

## 🚀 Key Features ##

- **Dockerized Environment:** Zero-config setup with Docker & Docker Compose.
- **MVC Architecture:** Clean separation of concerns (Controllers, Services, Models).
- **🛡️ Advanced Security:**
  - **JWT Authentication:** Secure stateless authentication.
  - **Rate Limiting:** Protection against DDoS (Global) and Brute-Force attacks (Login specific).
  - **Password Hashing:** Uses `bcryptjs` for secure storage.
  - **Helmet & CORS:** HTTP header security.
- **🔄 Account Recovery:** Complete "Forgot Password" and "Reset Password" flow with token expiration logic calculated database-side.
* 📚 **Fully Documented**: Interactive API documentation via **Swagger/OpenAPI 3.0**.

- **🧪 Production-Grade Tests**: Comprehensive test suite (Unit, Integration, and Security) using **Jest** and **Supertest** running in band to prevent race conditions.

* **Data Integrity**: Uses **UUIDs** for primary keys and implements **Soft Deletes** (logical exclusion) to preserve data history.
- **RBAC (Role-Based Access Control):** Native support for roles: `admin`, `proprietario` (owner), and `atendente` (staff/attendant).
- **Invite-Only Workflow:** Public registration is disabled. Users are created via admin invites and activate their accounts via token.
- **Database Seeding:** Automatic database creation and population via `init.sql`.

## 🛠️ Tech Stack ##

- **Runtime:** Node.js

- **Framework:** Express.js

- **Database:** MySQL 8.0

- **ORM/Driver:** mysql2 (using Promises/Connection Pool)

- **Testing**: Jest, Supertest, Cross-Env

- **Documentation**: Swagger UI, YAML

- **Dev Tools:** Nodemon (configured for Docker hot-reloading)

---

### 🏁 Getting Started ###

 **Prerequisites**

- [Docker](https://www.docker.com/) and Docker Compose installed on your machine.
- You **do not** need Node.js or MySQL installed locally to run the project.

- Optional: Node.js (v18+) if you wish to run tests locally outside Docker.

### 1. Clone the repository ###

`bash`
```
git clone https://github.com/abiratanl/backend-boilerplate.git

cd backend-boilerplate
```

### 2. Configure Environment Variables ###

Create the `.env` file based on the example provided.

**Linux/Mac:**

  `Bash`

  ```
  cp .env.example .env
  ```

**Windows (PowerShell):**

  `Bash`

  ```
  copy .env.example .env
  ```

Note: The default values in `.env.example` are already configured to work with the Docker container.


### 3. Run the Application ###

Start the application and the database containers:

`Bash`
  ```
  docker compose up --build
  ```

The server will start at: `http://localhost:3000`

---

### 📚 API Documentation ###

The API is fully documented using Swagger (OpenAPI 3.0). The definitions are maintained in a clean `src/swagger.yaml` file.

Once the server is running, access the interactive documentation at:

👉 **http://localhost:3000/api-docs**

---


**🧪 Running Tests**

This boilerplate comes with a complete test suite covering:

1. **Unit Tests**: Controller logic and mocks.

2. **Integration Tests**: Real database operations (CRUD).

3. **Security Tests**: Rate limiting verification and Password Reset flows.

To run the tests locally (requires Node.js installed):

`Bash`

```
# Install dependencies
npm install

# Run the test command:
npm test

```
Note: The `npm test` command is configured to run tests sequentially (`--runInBand`) to avoid database race conditions.

---

### 🗄️ Database & Default Users ###

When running for the first time, the `init.sql` script will automatically create the `loja_db` database, the `users` table, and insert the following seed users (password hashes represent `123456`):


Role | Email | Password (Hash) | 
| :--- | :--- | :--- |
| **Admin** | admin@loja.com | 123456 |
| **Proprietario** (Owner) | dono@loja.com | 123456 | 
| **Atendente** (Staff) | atendente@loja.com | 123456|

---

## 📂 Project Structure ##

`Plaintext`
```
src/
├── config/         # Database connection pool
├── controllers/    # Request handlers (Auth, User)
├── middlewares/    # Auth (JWT), Rate Limit, and RBAC logic
├── models/         # Database queries (SQL)
├── routes/         # API Route definitions
├── utils/          # Helper scripts
├── app.js          # Express app setup
├── server.js       # Entry point
└── swagger.yaml    # OpenAPI Documentation
tests/
├── auth.test.js           # Login & Token logic
├── integration.test.js    # End-to-end DB tests
├── password_reset.test.js # Forgot/Reset password flow
├── ratelimit.test.js      # Brute-force protection tests
└── user.test.js           # Unit tests (Mocked)
```

## 🔒 Security Features ##

**1. Rate Limiting**

- **Global API**: Limits IPs to 100 requests per 15 minutes.

- **Login Endpoint**: Strict limit of 5 failed attempts per 15 minutes to prevent brute-force attacks.


**2. Authentication Flow**

Protected routes require a **Bearer Token** in the Authorization header.

1. POST `/api/auth/login` to receive a token.
2. Send header: `Authorization: Bearer <YOUR_TOKEN>`

**3. Password Recovery**
User requests a token via `POST /api/auth/forgot-password`.

System generates a secure token with a database-side expiration (e.g., 10 minutes).

User resets password via `POST /api/auth/reset-password/:token`.

**User Registration (Invite Flow)**

There is no public "Sign Up".
1. Admin sends an invite via `/api/auth/invite`.
2. System generates a unique token.
3. User accesses the frontend with the link and sets their password via `/api/auth/complete-registration`.
---

### ⚙️ Customization (Setup for a New Project) ###

If you are cloning this boilerplate to start a brand new project, follow these steps to detach it from the template and configure the database correctly:

**1. Update Project Metadata**

Open `package.json` and update the following fields to match your new project:

`JSON `
```
{
  "name": "my-new-project-name",
  "version": "1.0.0",
  "description": "Description of the new project...",
  "author": "Your Name"
}
```

**2. Security Configuration (.env)**

In your `.env` file (created from `.env.example`), **you must change**:
* JWT_SECRET: Generate a new long random string (e.g., using openssl rand -base64 32).
* DB_PASSWORD: Set a strong password for the database root user.
* DB_NAME: Change this to a unique name for your project (e.g., `bakery_system_db`).

**3. Database Renaming (Crucial Step)**

If you changed `DB_NAME` in the `.env` file, you **must** manually update it in two other files to ensure the connection works:

**A. In** `docker-compose.yml`:

Update the `MYSQL_DATABASE` environment variable to match your new name:

`YAML`
```
    environment:
      MYSQL_DATABASE: bakery_system_db  # <--- Change this
```

**B. In** `init.sql`:

Update the database creation logic at the top of the file:

`SQL`
```
CREATE DATABASE IF NOT EXISTS bakery_system_db; -- <--- Change this
USE bakery_system_db;                           -- <--- Change this
```


**4. Re-initialize Git**

To detach this project from the boilerplate repository and start a fresh history:

`Bash`
```
# 1. Remove the existing git history
rm -rf .git  # (Linux/Mac) or 'rd .git /s /q' (Windows)

# 2. Start a new repository
git init
git add .
git commit -m "initial commit"
```
---

### 🤝 Contributing ###

1. Create a feature branch (git checkout -b feature/amazing-feature)
2. Commit your changes (git commit -m 'feat: add amazing feature')
3. Push to the branch (git push origin feature/amazing-feature)
4. Open a Pull Request
---

**License** This project is open-source and available under the MIT License.


