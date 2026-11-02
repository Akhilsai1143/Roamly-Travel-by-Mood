-- ============================================================================
-- ROAMLY — RAZORPAY PAYMENTS & WEBHOOK EVENTS TABLE MIGRATION
-- Database: roamly_db
-- ============================================================================

-- 1. PAYMENTS TABLE
-- Tracks local order creation, Razorpay order IDs, payments, signatures, amounts and status
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `razorpay_order_id` VARCHAR(100) NOT NULL UNIQUE,
  `razorpay_payment_id` VARCHAR(100) NULL UNIQUE,
  `razorpay_signature` VARCHAR(255) NULL,
  `amount` INT NOT NULL COMMENT 'Amount in paise (integer)',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` ENUM('created', 'attempted', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'created',
  `method` VARCHAR(50) NULL,
  `error_code` VARCHAR(100) NULL,
  `error_description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_payments_booking` (`booking_id`),
  INDEX `idx_payments_user` (`user_id`),
  INDEX `idx_payments_status` (`status`),
  INDEX `idx_payments_order` (`razorpay_order_id`),
  INDEX `idx_payments_payment_id` (`razorpay_payment_id`),

  CONSTRAINT `fk_payments_booking`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. WEBHOOK EVENTS TABLE
-- Ensures idempotent delivery and replay attack protection
CREATE TABLE IF NOT EXISTS `payment_webhook_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` VARCHAR(100) NOT NULL UNIQUE,
  `event_type` VARCHAR(100) NOT NULL,
  `razorpay_payment_id` VARCHAR(100) NULL,
  `razorpay_order_id` VARCHAR(100) NULL,
  `payload` JSON NULL,
  `processed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_webhook_event_id` (`event_id`),
  INDEX `idx_webhook_event_type` (`event_type`),
  INDEX `idx_webhook_order_id` (`razorpay_order_id`),
  INDEX `idx_webhook_payment_id` (`razorpay_payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
