-- ============================================================================
-- ROAMLY — TRAVEL PACKAGES, PARTNERS & EXPENSES MIGRATION
-- Database: roamly_db
-- ============================================================================

-- 1. TRAVEL PACKAGES TABLE
-- Multiple packages per destination (e.g. Kerala Explorer, Comfort Escape, Premium Experience)
CREATE TABLE IF NOT EXISTS `travel_packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `destination_id` INT NOT NULL,
  `package_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `tagline` VARCHAR(255) NULL,
  `tier` ENUM('standard', 'comfort', 'premium', 'luxury') NOT NULL DEFAULT 'standard',
  `description` TEXT NOT NULL,
  `duration_days` INT NOT NULL DEFAULT 4,
  `duration_nights` INT NOT NULL DEFAULT 3,
  `accommodation_type` VARCHAR(150) NULL,
  `meal_plan` VARCHAR(100) NULL,
  `transport_type` VARCHAR(150) NULL,
  `pickup_drop` VARCHAR(255) NULL,
  `inclusions` JSON NOT NULL,
  `exclusions` JSON NOT NULL,
  `itinerary` JSON NOT NULL,
  `important_instructions` TEXT NULL,
  `cancellation_policy` TEXT NULL,
  `price_per_person` DECIMAL(12,2) NOT NULL,
  `original_price` DECIMAL(12,2) NULL,
  `pricing_type` ENUM('per_person', 'per_group', 'flat_package') NOT NULL DEFAULT 'per_person',
  `max_capacity` INT NOT NULL DEFAULT 20,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('draft', 'active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_pkg_destination` (`destination_id`),
  INDEX `idx_pkg_tier` (`tier`),
  INDEX `idx_pkg_status` (`status`),
  INDEX `idx_pkg_code` (`package_code`),

  CONSTRAINT `fk_pkg_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PARTNERS TABLE
-- Manages local service partners, suppliers, transporters, guides, and hotels
CREATE TABLE IF NOT EXISTS `partners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `partner_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(200) NOT NULL,
  `contact_person` VARCHAR(150) NULL,
  `email` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `service_category` ENUM('hotel', 'transport', 'tour_operator', 'guide', 'activity', 'other') NOT NULL,
  `destination_id` INT NULL,
  `operating_area` VARCHAR(150) NULL,
  `address` TEXT NULL,
  `payment_terms` VARCHAR(150) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `internal_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_partner_category` (`service_category`),
  INDEX `idx_partner_destination` (`destination_id`),
  INDEX `idx_partner_status` (`status`),
  INDEX `idx_partner_code` (`partner_code`),

  CONSTRAINT `fk_partner_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PACKAGE PARTNER SERVICES TABLE
-- Links specific partner services to packages with agreed cost amounts and pricing basis
CREATE TABLE IF NOT EXISTS `package_partner_services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `package_id` INT NOT NULL,
  `partner_id` INT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `service_type` ENUM('accommodation', 'transport', 'meals', 'activity', 'guide', 'other') NOT NULL,
  `cost_amount` DECIMAL(12,2) NOT NULL,
  `pricing_basis` ENUM('per_traveler', 'per_room', 'per_night', 'per_trip', 'fixed_charge') NOT NULL DEFAULT 'per_traveler',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_pps_package` (`package_id`),
  INDEX `idx_pps_partner` (`partner_id`),
  INDEX `idx_pps_type` (`service_type`),

  CONSTRAINT `fk_pps_package`
    FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pps_partner`
    FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BUSINESS EXPENSES TABLE
-- Records actual operating and direct expenses (marketing, operations, manual partner costs)
CREATE TABLE IF NOT EXISTS `business_expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expense_code` VARCHAR(50) NOT NULL UNIQUE,
  `category` ENUM('accommodation', 'transport', 'meals', 'activities', 'guides', 'gateway_fee', 'marketing', 'operations', 'miscellaneous') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `expense_date` DATE NOT NULL,
  `booking_id` INT NULL,
  `package_id` INT NULL,
  `destination_id` INT NULL,
  `partner_id` INT NULL,
  `vendor_name` VARCHAR(150) NULL,
  `description` TEXT NOT NULL,
  `payment_status` ENUM('paid', 'pending', 'reimbursed') NOT NULL DEFAULT 'paid',
  `invoice_ref` VARCHAR(100) NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_exp_category` (`category`),
  INDEX `idx_exp_date` (`expense_date`),
  INDEX `idx_exp_booking` (`booking_id`),
  INDEX `idx_exp_package` (`package_id`),
  INDEX `idx_exp_destination` (`destination_id`),
  INDEX `idx_exp_partner` (`partner_id`),

  CONSTRAINT `fk_exp_booking`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exp_package`
    FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exp_destination`
    FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exp_partner`
    FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exp_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
