const { pool } = require('../config/db');

/**
 * Upsert (INSERT or UPDATE) a GitHub profile into the database.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE so re-analyzing a user refreshes their data.
 */
const upsertProfile = async (profileData) => {
  const {
    username, name, bio, location, blog, company, email, avatar_url,
    followers, following, public_repos, total_stars, total_forks,
    most_starred_repo, top_language, developer_score, rank_level, account_created,
  } = profileData;

  const sql = `
    INSERT INTO github_profiles
      (username, name, bio, location, blog, company, email, avatar_url,
       followers, following, public_repos, total_stars, total_forks,
       most_starred_repo, top_language, developer_score, rank_level, account_created, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name            = VALUES(name),
      bio             = VALUES(bio),
      location        = VALUES(location),
      blog            = VALUES(blog),
      company         = VALUES(company),
      email           = VALUES(email),
      avatar_url      = VALUES(avatar_url),
      followers       = VALUES(followers),
      following       = VALUES(following),
      public_repos    = VALUES(public_repos),
      total_stars     = VALUES(total_stars),
      total_forks     = VALUES(total_forks),
      most_starred_repo = VALUES(most_starred_repo),
      top_language    = VALUES(top_language),
      developer_score = VALUES(developer_score),
      rank_level      = VALUES(rank_level),
      account_created = VALUES(account_created),
      analyzed_at     = NOW()
  `;

  const values = [
    username, name, bio, location, blog, company, email, avatar_url,
    followers, following, public_repos, total_stars, total_forks,
    most_starred_repo, top_language, developer_score, rank_level, account_created,
  ];

  const [result] = await pool.execute(sql, values);
  return result;
};

/**
 * Retrieve all analyzed profiles — lightweight list for GET /profiles
 */
const getAllProfiles = async (limit = 10, offset = 0) => {
  // Use string interpolation for LIMIT/OFFSET as some mysql2 versions struggle with ? for them
  const [rows] = await pool.execute(`
    SELECT
      username, name, avatar_url, followers, following,
      public_repos, total_stars, developer_score, rank_level, analyzed_at
    FROM github_profiles
    ORDER BY developer_score DESC
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `);

  const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM github_profiles');

  return { rows, total };
};

/**
 * Retrieve a single profile by exact username match.
 */
const getProfileByUsername = async (username) => {
  const [rows] = await pool.execute(
    'SELECT * FROM github_profiles WHERE username = ?',
    [username]
  );
  return rows[0] || null;
};

/**
 * Search profiles by partial username match — Feature 5
 */
const searchProfiles = async (query) => {
  const [rows] = await pool.execute(
    `SELECT username, name, avatar_url, followers, public_repos,
            developer_score, rank_level, analyzed_at
     FROM github_profiles
     WHERE username LIKE ? OR name LIKE ?
     ORDER BY developer_score DESC
     LIMIT 20`,
    [`%${query}%`, `%${query}%`]
  );
  return rows;
};

/**
 * Delete a profile by username.
 */
const deleteProfile = async (username) => {
  const [result] = await pool.execute(
    'DELETE FROM github_profiles WHERE username = ?',
    [username]
  );
  return result;
};

module.exports = { upsertProfile, getAllProfiles, getProfileByUsername, searchProfiles, deleteProfile };
