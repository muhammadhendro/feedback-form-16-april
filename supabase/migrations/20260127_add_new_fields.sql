-- Migration: Add toolkit interest and consent fields
-- Created: 2026-01-27

ALTER TABLE pdpl_surabaya_training_feedback 
ADD COLUMN IF NOT EXISTS interest_in_toolkit text,
ADD COLUMN IF NOT EXISTS consent boolean DEFAULT false;
