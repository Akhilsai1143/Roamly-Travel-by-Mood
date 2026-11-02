-- ============================================================================
-- Roamly User Management Schema Migration
-- Adds account status (is_active), last_login tracking, and soft-delete support
-- ============================================================================

-- 1. Add is_active column (1 = Active, 0 = Deactivated/Suspended)
-- Default is 1 so all existing users remain active.
ALTER TABLE users 
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 
AFTER role;

-- 2. Add last_login timestamp column (Updated upon successful login)
-- NULL until user completes their next login.
ALTER TABLE users 
ADD COLUMN last_login DATETIME NULL 
AFTER is_active;

-- 3. Add deleted_at timestamp column (Enables safe soft-deletion preserving FKs)
ALTER TABLE users 
ADD COLUMN deleted_at DATETIME NULL 
AFTER last_login;

-- 4. Add performance indexes for filtering by status and role
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_role ON users(role);
