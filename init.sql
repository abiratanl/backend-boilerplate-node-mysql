-- Cria o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS loja_db;
USE loja_db;

-- Cria a tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role ENUM('admin', 'proprietario', 'vendedor') NOT NULL DEFAULT 'vendedor',
    is_active BOOLEAN DEFAULT FALSE,
    invite_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir Dados de Exemplo (Seed)
-- OBS: As senhas abaixo são hashes simulados de '123456'. 
-- Em produção, gere hashes reais com bcrypt.
INSERT INTO users (id, name, email, password, role, is_active) VALUES 
('uuid-admin-001', 'Administrador Sistema', 'admin@loja.com', '$2a$10$X7...', 'admin', TRUE),
('uuid-prop-001', 'Dono da Loja', 'dono@loja.com', '$2a$10$X7...', 'proprietario', TRUE),
('uuid-vend-001', 'Vendedor Padrão', 'vendedor@loja.com', '$2a$10$X7...', 'vendedor', TRUE);