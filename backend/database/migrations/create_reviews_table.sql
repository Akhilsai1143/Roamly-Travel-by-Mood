-- Roamly Community Reviews Table Migration
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  destination_id VARCHAR(100) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  title VARCHAR(255) NULL,
  comment TEXT NOT NULL,
  mood VARCHAR(50) NULL,
  duration VARCHAR(100) NULL,
  budget VARCHAR(100) NULL,
  season VARCHAR(100) NULL,
  insider_tip TEXT NULL,
  photo_url TEXT NULL,
  helpful_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reviews_destination (destination_id),
  INDEX idx_reviews_rating (rating),
  INDEX idx_reviews_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
