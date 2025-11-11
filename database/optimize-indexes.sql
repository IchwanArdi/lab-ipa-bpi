-- Database Optimization: Additional Indexes for Performance
-- Run this SQL script to add composite indexes for better query performance

USE bpi_lab;

-- Composite index for Loan queries (status + userId) - untuk filter status per user
ALTER TABLE Loan ADD INDEX idx_status_userId (status, userId);

-- Composite index for Loan queries (status + createdAt) - untuk sorting dengan filter status
ALTER TABLE Loan ADD INDEX idx_status_createdAt (status, createdAt);

-- Composite index for DamageReport queries (status + userId) - untuk filter status per user
ALTER TABLE DamageReport ADD INDEX idx_status_userId (status, userId);

-- Composite index for DamageReport queries (status + createdAt) - untuk sorting dengan filter status
ALTER TABLE DamageReport ADD INDEX idx_status_createdAt (status, createdAt);

-- Index for Item queries (condition + stock) - untuk filter alat tersedia
ALTER TABLE Item ADD INDEX idx_condition_stock (`condition`, stock);

-- Composite index for Item queries (category + createdAt) - untuk sorting per kategori
ALTER TABLE Item ADD INDEX idx_category_createdAt (category, createdAt);

-- Index for Notification queries (userId + isRead + createdAt) - untuk notifikasi per user
ALTER TABLE Notification ADD INDEX idx_userId_isRead_createdAt (userId, isRead, createdAt);

-- Index untuk Loan analytics (createdAt untuk trend analysis)
ALTER TABLE Loan ADD INDEX idx_createdAt_status (createdAt, status);

-- Index untuk User queries dengan role
ALTER TABLE User ADD INDEX idx_role (role);

-- Index untuk Loan dengan itemId dan status (untuk analytics)
ALTER TABLE Loan ADD INDEX idx_itemId_status (itemId, status);

