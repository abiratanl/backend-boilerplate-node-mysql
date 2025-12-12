# Backend Boilerplate (Node.js + MySQL + Docker)

A robust, production-ready boilerplate for building RESTful APIs using Node.js and MySQL. It features a fully Dockerized environment, JWT authentication, Role-Based Access Control (RBAC), and a secure invite-only registration flow.

## 🚀 Key Features

- **Dockerized Environment:** Zero-config setup with Docker & Docker Compose.
- **MVC Architecture:** Clean separation of concerns (Controllers, Services, Models).
- **Security First:** Implements `helmet`, `cors`, `bcryptjs` (hashing), and JWT strategies.
- **RBAC (Role-Based Access Control):** Native support for roles: `admin`, `proprietario` (owner), and `atendente` (staff/attendant).
- **Invite-Only Workflow:** Public registration is disabled. Users are created via admin invites and activate their accounts via token.
- **Database Seeding:** Automatic database creation and population via `init.sql`.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL 8.0
- **ORM/Driver:** mysql2 (using Promises/Connection Pool)
- **Dev Tools:** Nodemon (configured for Docker hot-reloading)

---

## 🏁 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose installed on your machine.
- You **do not** need Node.js or MySQL installed locally to run the project.

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/backend-boilerplate.git](https://github.com/YOUR_USERNAME/backend-boilerplate.git)
cd backend-boilerplate

---

---

## ⚙️ Customization (Setup for a New Project)

If you are cloning this boilerplate to start a brand new project, follow these steps to detach it from the template and configure the database correctly:

### 1. Update Project Metadata
Open `package.json` and update the following fields to match your new project:
```json
{
  "name": "my-new-project-name",
  "version": "1.0.0",
  "description": "Description of the new project...",
  "author": "Your Name"
}

2. Security Configuration (.env)
In your .env file (created from .env.example), you must change:

JWT_SECRET: Generate a new long random string (e.g., using openssl rand -base64 32).

DB_PASSWORD: Set a strong password for the database root user.

DB_NAME: Change this to a unique name for your project (e.g., bakery_system_db).


3. Database Renaming (Crucial Step)
If you changed DB_NAME in the .env file, you must manually update it in two other files to ensure the connection works:

A. In docker-compose.yml: Update the MYSQL_DATABASE environment variable to match your new name:

YAML

    environment:
      MYSQL_DATABASE: bakery_system_db  # <--- Change this
      
B. In init.sql: Update the database creation logic at the top of the file:

SQL

CREATE DATABASE IF NOT EXISTS bakery_system_db; -- <--- Change this
USE bakery_system_db;                           -- <--- Change this


4. Re-initialize Git
To detach this project from the boilerplate repository and start a fresh history:

Bash

# 1. Remove the existing git history
rm -rf .git  # (Linux/Mac) or 'rd .git /s /q' (Windows)

# 2. Start a new repository
git init
git add .
git commit -m "initial commit"