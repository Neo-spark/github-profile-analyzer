const express = require('express');
const router = express.Router();
const {
  analyzeProfile,
  getProfiles,
  getProfile,
  searchProfilesHandler,
  removeProfile,
  refreshProfile,
  compareUsers,
} = require('../controllers/githubController');

// ─── Analyze ────────────────────────────────────────────────────────────────
// POST /api/github/analyze/:username
// Fetches GitHub data, computes insights, and stores in DB
router.post('/analyze/:username', analyzeProfile);

// ─── Search ─────────────────────────────────────────────────────────────────
// GET /api/github/profiles/search?username=query
// IMPORTANT: /search must be registered BEFORE /:username to avoid route conflict
router.get('/profiles/search', searchProfilesHandler);

// ─── All Profiles ────────────────────────────────────────────────────────────
// GET /api/github/profiles
router.get('/profiles', getProfiles);

// ─── Single Profile ──────────────────────────────────────────────────────────
// GET /api/github/profiles/:username
router.get('/profiles/:username', getProfile);

// ─── Delete Profile ──────────────────────────────────────────────────────────
// DELETE /api/github/profiles/:username
router.delete('/profiles/:username', removeProfile);

// ─── Refresh Profile ─────────────────────────────────────────────────────────
// PUT /api/github/profiles/:username/refresh
router.put('/profiles/:username/refresh', refreshProfile);

// ─── Compare Profiles ────────────────────────────────────────────────────────
// GET /api/github/compare/:user1/:user2
router.get('/compare/:user1/:user2', compareUsers);

module.exports = router;
