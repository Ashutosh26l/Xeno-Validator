-- schema.sql
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Spec §4, Step 4.

-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploads table (one record per CSV upload)
CREATE TABLE uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    quality_score FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'pending',           -- pending | processing | completed | failed
    is_chunked BOOLEAN DEFAULT FALSE,
    chunk_count INTEGER DEFAULT 0,
    column_mapping JSONB,                           -- stores { extra_col: expected_col | null }
    zip_storage_path TEXT,                          -- Supabase storage path for ZIP
    clean_csv_storage_path TEXT,                    -- raw CSV path (pending) / clean CSV path (completed)
    invalid_csv_storage_path TEXT,                  -- Supabase storage path for invalid rows CSV
    error_report_storage_path TEXT,                 -- Supabase storage path for error report CSV
    ai_summary_storage_path TEXT,                   -- Supabase storage path for AI summary PDF
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Errors table (one record per error found in a row)
CREATE TABLE errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    field_name VARCHAR(100),
    error_type VARCHAR(100),  -- phone | date | payment | integrity | duplicate | missing | corrected
    error_message TEXT,
    original_value TEXT,
    suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Reports table
CREATE TABLE ai_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL UNIQUE REFERENCES uploads(id) ON DELETE CASCADE,
    summary TEXT,
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_errors_upload_id ON errors(upload_id);
CREATE INDEX idx_errors_type ON errors(error_type);
