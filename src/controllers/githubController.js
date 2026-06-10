const {
  analyzeGitHubProfile,
  calculateAccountAgeYears,
  calculateFollowerRatio,
} = require('../services/githubService');
const {
  upsertProfile,
  getAllProfiles,
  getProfileByUsername,
  searchProfiles,
  deleteProfile,
} = require('../models/githubModel');

/**
 * POST /api/github/analyze/:username
 * Fetches fresh data from GitHub, computes insights, and upserts into DB.
 */
const analyzeProfile = async (req, res) => {
  const { username } = req.params;

  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Check DB first for caching (24h)
    const existingProfile = await getProfileByUsername(username.trim());
    if (existingProfile && existingProfile.analyzed_at) {
      const lastAnalyzed = new Date(existingProfile.analyzed_at);
      const now = new Date();
      const diffHours = (now - lastAnalyzed) / (1000 * 60 * 60);

      if (diffHours < 24) {
        existingProfile.account_age_years = calculateAccountAgeYears(existingProfile.account_created);
        existingProfile.follower_ratio = calculateFollowerRatio(existingProfile.followers, existingProfile.following);

        return res.status(200).json({
          message: 'Profile retrieved from cache (analyzed within last 24h)',
          data: existingProfile,
        });
      }
    }

    // Step 1: Analyze via GitHub API + compute insights
    const insights = await analyzeGitHubProfile(username.trim());

    // Step 2: Persist to MySQL
    await upsertProfile(insights);

    // Step 3: Return success + a summary of what was calculated
    return res.status(200).json({
      message: 'Profile analyzed successfully',
      data: {
        username: insights.username,
        name: insights.name,
        avatar_url: insights.avatar_url,
        followers: insights.followers,
        following: insights.following,
        public_repos: insights.public_repos,
        total_stars: insights.total_stars,
        total_forks: insights.total_forks,
        most_starred_repo: insights.most_starred_repo,
        top_language: insights.top_language,
        developer_score: insights.developer_score,
        rank_level: insights.rank_level,
        account_age_years: insights.account_age_years,
        follower_ratio: insights.follower_ratio,
        account_created: insights.account_created,
      },
    });
  } catch (error) {
    // Handle GitHub API 404 (user not found)
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: `GitHub user '${username}' not found` });
    }

    // Handle GitHub API rate limiting
    if (error.response && error.response.status === 403) {
      return res.status(429).json({
        error: 'GitHub API rate limit exceeded. Add a GITHUB_TOKEN in .env to increase limits.',
      });
    }

    console.error(`Error analyzing profile for '${username}':`, error.message);
    return res.status(500).json({
      error: 'Internal server error. Please try again later.',
      // Show real error in development to help debugging
      detail: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      hint: process.env.NODE_ENV !== 'production' ? (error.code || error.stack?.split('\n')[1]) : undefined,
    });
  }
};

/**
 * GET /api/github/profiles
 * Returns all analyzed profiles sorted by developer score (highest first).
 * Feature 3: Pagination
 */
const getProfiles = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  try {
    const { rows: profiles, total } = await getAllProfiles(limit, offset);
    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/github/profiles/:username
 * Returns full details of a single analyzed profile.
 */
const getProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const profile = await getProfileByUsername(username.trim());

    if (!profile) {
      return res.status(404).json({
        error: `Profile for '${username}' not found. Run POST /api/github/analyze/${username} first.`,
      });
    }

    profile.account_age_years = calculateAccountAgeYears(profile.account_created);
    profile.follower_ratio = calculateFollowerRatio(profile.followers, profile.following);

    return res.status(200).json(profile);
  } catch (error) {
    console.error(`Error fetching profile for '${username}':`, error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/github/profiles/search?username=query
 * Searches profiles by partial username or name match.
 * Feature 5: Search API
 */
const searchProfilesHandler = async (req, res) => {
  const queryUsername = Array.isArray(req.query.username) 
    ? req.query.username[0] 
    : req.query.username;

  if (!queryUsername || String(queryUsername).trim() === '') {
    return res.status(400).json({ error: 'Query parameter "username" is required' });
  }

  const safeUsername = String(queryUsername).trim();

  try {
    const results = await searchProfiles(safeUsername);
    return res.status(200).json({
      query: safeUsername,
      count: results.length,
      profiles: results,
    });
  } catch (error) {
    console.error('Error searching profiles:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/github/profiles/:username
 * Removes a profile from the database.
 */
const removeProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const result = await deleteProfile(username.trim());

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Profile for '${username}' not found` });
    }

    return res.status(200).json({ message: `Profile for '${username}' deleted successfully` });
  } catch (error) {
    console.error(`Error deleting profile for '${username}':`, error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/github/profiles/:username/refresh
 * Forces a fresh fetch from GitHub, bypassing the 24h cache.
 */
const refreshProfile = async (req, res) => {
  const { username } = req.params;

  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const insights = await analyzeGitHubProfile(username.trim());
    await upsertProfile(insights);

    return res.status(200).json({
      message: 'Profile refreshed successfully',
      data: insights,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: `GitHub user '${username}' not found` });
    }
    console.error(`Error refreshing profile for '${username}':`, error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/github/compare/:user1/:user2
 * Compares two users by developer score. Analyzes them on the fly if not found.
 */
const compareUsers = async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    // Helper to get or fetch a profile
    const getOrFetchProfile = async (username) => {
      let profile = await getProfileByUsername(username);
      if (!profile) {
        const insights = await analyzeGitHubProfile(username);
        await upsertProfile(insights);
        profile = await getProfileByUsername(username);
      }
      return profile;
    };

    const [profile1, profile2] = await Promise.all([
      getOrFetchProfile(user1),
      getOrFetchProfile(user2)
    ]);

    let winner, loser, scoreDifference;

    if (profile1.developer_score > profile2.developer_score) {
      winner = profile1.username;
      loser = profile2.username;
      scoreDifference = profile1.developer_score - profile2.developer_score;
    } else if (profile2.developer_score > profile1.developer_score) {
      winner = profile2.username;
      loser = profile1.username;
      scoreDifference = profile2.developer_score - profile1.developer_score;
    } else {
      winner = 'Tie';
      scoreDifference = 0;
    }

    return res.status(200).json({
      winner,
      scoreDifference,
      profiles: {
        [profile1.username]: profile1.developer_score,
        [profile2.username]: profile2.developer_score,
      }
    });

  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: `One of the users was not found on GitHub` });
    }
    console.error(`Error comparing users:`, error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { analyzeProfile, getProfiles, getProfile, searchProfilesHandler, removeProfile, refreshProfile, compareUsers };
