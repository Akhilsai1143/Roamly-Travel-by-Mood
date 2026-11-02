-- ============================================================================
-- ROAMLY — TRIP BOOKINGS TABLE MIGRATION
-- Database: roamly_db
-- ============================================================================

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_reference` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `destination_id` INT NOT NULL,
  `destination_name_snapshot` VARCHAR(255) NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `travellers` INT NOT NULL DEFAULT 1,
  `contact_name` VARCHAR(150) NOT NULL,
  `contact_email` VARCHAR(150) NOT NULL,
  `contact_phone` VARCHAR(50) NULL,
  `estimated_budget` DECIMAL(12,2) NULL,
  `estimated_total` DECIMAL(12,2) NULL,
  `special_requests` TEXT NULL,
  `status` ENUM('pending','confirmed','rejected','cancelled','completed') NOT NULL DEFAULT 'pending',
  `rejection_reason` TEXT NULL,
  `confirmed_by` INT NULL,
  `confirmed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_bookings_user` (`user_id`),
  INDEX `idx_bookings_destination` (`destination_id`),
  INDEX `idx_bookings_status` (`status`),
  INDEX `idx_bookings_reference` (`booking_reference`),
  INDEX `idx_bookings_start_date` (`start_date`),
  
  CONSTRAINT `fk_bookings_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_destination` 
    FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_confirmed_by` 
    FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
