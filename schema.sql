-- ============================================================
-- GitHub Profile Analyzer — Database Schema
-- Run this file to manually set up the database and table.
-- NOTE: The server also auto-creates these on startup.
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

-- Main profiles table
CREATE TABLE IF NOT EXISTS github_profiles (
    id                INT AUTO_INCREMENT PRIMARY KEY,

    -- Identity
    username          VARCHAR(255) UNIQUE NOT NULL COMMENT 'GitHub login (unique key)',
    name              VARCHAR(255)        COMMENT 'Display name',
    bio               TEXT                COMMENT 'Profile bio',
    location          VARCHAR(255)        COMMENT 'User-stated location',
    blog              VARCHAR(500)        COMMENT 'Personal website / blog URL',
    company           VARCHAR(255)        COMMENT 'Company name',
    email             VARCHAR(255)        COMMENT 'Public email (if provided)',
    avatar_url        VARCHAR(500)        COMMENT 'GitHub avatar URL',

    -- GitHub stats
    followers         INT DEFAULT 0       COMMENT 'Number of followers',
    following         INT DEFAULT 0       COMMENT 'Number of accounts followed',
    public_repos      INT DEFAULT 0       COMMENT 'Number of public repositories',

    -- Repository analysis (Feature 1)
    total_stars       INT DEFAULT 0       COMMENT 'Sum of stars across all repos',
    total_forks       INT DEFAULT 0       COMMENT 'Sum of forks across all repos',
    most_starred_repo VARCHAR(255)        COMMENT 'Name of repo with most stars',
    top_language      VARCHAR(50)         COMMENT 'Most commonly used programming language',

    -- Computed insights (Features 2 & 3)
    developer_score   INT DEFAULT 0       COMMENT 'Score = followers*2 + public_repos*3 + total_stars*5',
    rank_level        VARCHAR(50)         COMMENT 'Beginner | Intermediate | Advanced',

    -- Timestamps (Feature 4)
    account_created   DATE                COMMENT 'When the GitHub account was created',
    analyzed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP
                      COMMENT 'Last time this profile was analyzed',

    -- Indexes for common query patterns
    INDEX idx_username       (username),
    INDEX idx_developer_score (developer_score DESC),
    INDEX idx_rank_level     (rank_level)
);

-- ============================================================
-- Sample queries for verification
-- ============================================================

-- View all profiles sorted by score
-- SELECT username, developer_score, rank_level FROM github_profiles ORDER BY developer_score DESC;

-- Search by partial username
-- SELECT username, name FROM github_profiles WHERE username LIKE '%octo%';

-- Count by rank
-- SELECT rank_level, COUNT(*) AS total FROM github_profiles GROUP BY rank_level;
