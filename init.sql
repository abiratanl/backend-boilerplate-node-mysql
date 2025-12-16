-- ==========================================
-- 1. Main Database Configuration (DEV/PROD)
-- ==========================================
CREATE DATABASE IF NOT EXISTS loja_db;
USE loja_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    -- Roles: admin, proprietario (owner), atendente (staff)
    role ENUM('admin', 'proprietario', 'atendente') NOT NULL DEFAULT 'atendente',
    is_active BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255) DEFAULT NULL,
    password_reset_expires TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Seed Data (for Development environment)
-- Note: Passwords represent '123456' (hashed)
INSERT INTO users (id, name, email, password, role, is_active) VALUES 
('uuid-admin-001', 'System Administrator', 'admin@loja.com', '$2a$10$X7V...valid_hash_here...', 'admin', TRUE),
('uuid-prop-001', 'Store Owner', 'dono@loja.com', '$2a$10$X7V...valid_hash_here...', 'proprietario', TRUE),
('uuid-atend-001', 'Standard Staff', 'atendente@loja.com', '$2a$10$X7V...valid_hash_here...', 'atendente', TRUE);


-- ==========================================
-- 2. Test Database Configuration (TEST)
-- ==========================================
CREATE DATABASE IF NOT EXISTS loja_test;
USE loja_test;

-- Recreate the table structure for the test environment.
-- We do NOT insert seeds here, as integration tests require a clean state to start.
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role ENUM('admin', 'proprietario', 'atendente') NOT NULL DEFAULT 'atendente',
    is_active BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255) DEFAULT NULL,
    password_reset_expires TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. Permissions Granting (Recommended)
-- ==========================================
-- Ensure the configured user has access to both databases
GRANT ALL PRIVILEGES ON loja_db.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON loja_test.* TO 'root'@'%';
FLUSH PRIVILEGES;