-- ============================================================================
-- ROAMLY — SAVED AI ITINERARIES TABLE MIGRATION
-- Database: roamly_db
-- Additive and non-destructive: Preserves all existing tables and records
-- ============================================================================

CREATE TABLE IF NOT EXISTS `saved_itineraries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `destination_name` VARCHAR(150) NOT NULL,
  `destination_id` VARCHAR(100) NULL,
  `start_location` VARCHAR(150) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `duration_days` INT NOT NULL DEFAULT 3,
  `travellers_count` INT NOT NULL DEFAULT 1,
  `budget_total` DECIMAL(12,2) NULL,
  `budget_tier` VARCHAR(50) NULL,
  `mood` VARCHAR(100) NULL,
  `activities` JSON NULL,
  `itinerary_data` JSON NOT NULL,
  `summary` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_saved_itineraries_user` (`user_id`),
  INDEX `idx_saved_itineraries_dest` (`destination_id`),
  CONSTRAINT `fk_saved_itineraries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

