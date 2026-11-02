-- Migration: Add gallery column to destinations table
-- Supports JSON array of 10-12 authentic destination photographs and captions

ALTER TABLE destinations
ADD COLUMN gallery LONGTEXT NULL AFTER image;
