const axios = require('axios');
require('dotenv').config();

const GITHUB_BASE = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';

// Build headers — add Authorization only if a token is provided
const buildHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'github-profile-analyzer',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

/**
 * Fetch basic profile data from GitHub
 * GET https://api.github.com/users/:username
 */
const fetchUserProfile = async (username) => {
  const response = await axios.get(`${GITHUB_BASE}/users/${username}`, {
    headers: buildHeaders(),
    timeout: 10000,
  });
  return response.data;
};

/**
 * Fetch up to 100 repos for a user (sorted by stars descending)
 * GET https://api.github.com/users/:username/repos
 */
const fetchUserRepos = async (username) => {
  const response = await axios.get(`${GITHUB_BASE}/users/${username}/repos`, {
    headers: buildHeaders(),
    params: {
      per_page: 100,
      sort: 'pushed',
      type: 'owner',   // Only repos owned by the user, not forks
    },
    timeout: 10000,
  });
  return response.data;
};

/**
 * Calculate the number of complete years between two dates.
 */
const calculateAccountAgeYears = (createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  return (diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
};

/**
 * Derive follower/following ratio — returns 'N/A' when following is 0
 */
const calculateFollowerRatio = (followers, following) => {
  if (following === 0) return followers > 0 ? 'Infinity' : '0';
  return (followers / following).toFixed(2);
};

/**
 * Calculate a developer score from profile + repo stats
 * score = followers * 2 + publicRepos * 3 + totalStars * 5
 */
const calculateDeveloperScore = (followers, publicRepos, totalStars) => {
  return followers * 2 + publicRepos * 3 + totalStars * 5;
};

/**
 * Assign a rank level based on the developer score
 * 0–100:     Beginner
 * 101–500:   Intermediate
 * 501+:      Advanced
 */
const calculateRankLevel = (score) => {
  if (score <= 100) return 'Beginner';
  if (score <= 500) return 'Intermediate';
  return 'Advanced';
};

/**
 * Analyze repository statistics from the list of repos.
 * Returns: { totalStars, totalForks, mostStarredRepo, topLanguage }
 */
const analyzeRepos = (repos) => {
  let totalStars = 0;
  let totalForks = 0;
  let mostStarredRepo = null;
  let maxStars = -1;
  const languageCounts = {};

  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    if (repo.stargazers_count > maxStars) {
      maxStars = repo.stargazers_count;
      mostStarredRepo = repo.name;
    }

    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  }

  let topLanguage = null;
  let maxLangCount = 0;
  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > maxLangCount) {
      maxLangCount = count;
      topLanguage = lang;
    }
  }

  return { totalStars, totalForks, mostStarredRepo, topLanguage };
};

/**
 * Main orchestration function — fetches profile + repos, computes all insights,
 * and returns a structured object ready to be saved to the DB.
 */
const analyzeGitHubProfile = async (username) => {
  // Parallel fetch: profile data and repo data simultaneously for speed
  const [profileData, reposData] = await Promise.all([
    fetchUserProfile(username),
    fetchUserRepos(username),
  ]);

  const { totalStars, totalForks, mostStarredRepo, topLanguage } = analyzeRepos(reposData);

  const followers = profileData.followers || 0;
  const following = profileData.following || 0;
  const publicRepos = profileData.public_repos || 0;

  const developerScore = calculateDeveloperScore(followers, publicRepos, totalStars);
  const rankLevel = calculateRankLevel(developerScore);
  const accountAgeYears = calculateAccountAgeYears(profileData.created_at);
  const followerRatio = calculateFollowerRatio(followers, following);

  // ISO date string to DATE column (YYYY-MM-DD)
  const accountCreated = profileData.created_at
    ? profileData.created_at.split('T')[0]
    : null;

  return {
    // Raw profile fields
    username: profileData.login,
    name: profileData.name || null,
    bio: profileData.bio || null,
    location: profileData.location || null,
    blog: profileData.blog || null,
    company: profileData.company || null,
    email: profileData.email || null,
    avatar_url: profileData.avatar_url || null,

    // Metrics
    followers,
    following,
    public_repos: publicRepos,
    total_stars: totalStars,
    total_forks: totalForks,
    most_starred_repo: mostStarredRepo,
    top_language: topLanguage,

    // Computed insights
    developer_score: developerScore,
    rank_level: rankLevel,
    account_created: accountCreated,

    // Extra info for response (not stored separately)
    account_age_years: accountAgeYears,
    follower_ratio: followerRatio,
    total_repo_count: reposData.length,
  };
};

module.exports = {
  analyzeGitHubProfile,
  calculateAccountAgeYears,
  calculateFollowerRatio,
};
