-- ==========================================
-- 1. DEVELOPMENT ENVIRONMENT (store_db)
-- ==========================================
CREATE DATABASE IF NOT EXISTS store_db;
USE store_db;

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'proprietario', 'atendente') DEFAULT 'atendente',
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

 INSERT INTO users (id, name, email, password, role, is_active, must_change_password) VALUES 
-- ('uuid-admin-001', 'System Administrator', 'admin@loja.com', '$2a$10$Presj4e0w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.', 'admin', TRUE, FALSE),
('uuid-prop-001', 'Store Owner', 'dono@loja.com', '$2a$10$Presj4e0w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.', 'proprietario', TRUE, FALSE),
('uuid-atend-001', 'Standard Staff', 'atendente@loja.com', '$2a$10$Presj4e0w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.w8.', 'atendente', TRUE, FALSE);


-- ==========================================
-- 2. TEST ENVIRONMENT (test_store)
-- ==========================================
CREATE DATABASE IF NOT EXISTS test_store;
USE test_store;

-- Recreate the SAME table, but empty (without INSERTS) for the tests to use.
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'proprietario', 'atendente') DEFAULT 'atendente',
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);