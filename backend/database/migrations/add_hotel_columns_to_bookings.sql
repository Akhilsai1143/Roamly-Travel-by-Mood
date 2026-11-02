-- ============================================================================
-- ROAMLY - ADD HOTEL & ROOM BOOKING SUPPORT TO BOOKINGS TABLE
-- ============================================================================

ALTER TABLE `bookings`
  MODIFY COLUMN `destination_id` INT NULL,
  MODIFY COLUMN `user_id` INT NULL,
  ADD COLUMN `booking_type` ENUM('destination', 'hotel', 'package') NOT NULL DEFAULT 'destination' AFTER `destination_id`,
  ADD COLUMN `hotel_id` VARCHAR(100) NULL AFTER `booking_type`,
  ADD COLUMN `hotel_name` VARCHAR(255) NULL AFTER `hotel_id`,
  ADD COLUMN `hotel_location` VARCHAR(255) NULL AFTER `hotel_name`,
  ADD COLUMN `hotel_image` VARCHAR(500) NULL AFTER `hotel_location`,
  ADD COLUMN `room_type` VARCHAR(150) NULL AFTER `hotel_image`,
  ADD COLUMN `room_number` VARCHAR(50) NULL AFTER `room_type`,
  ADD COLUMN `rooms_count` INT NOT NULL DEFAULT 1 AFTER `room_number`;

