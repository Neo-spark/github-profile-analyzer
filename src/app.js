const express = require('express');
const cors = require('cors');
require('dotenv').config();

const githubRoutes = require('./routes/githubRoutes');
const { requestLogger, errorHandler, notFound } = require('./middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    status: 'running',
    docs: {
      analyze: 'POST /api/github/analyze/:username',
      allProfiles: 'GET /api/github/profiles',
      singleProfile: 'GET /api/github/profiles/:username',
      search: 'GET /api/github/profiles/search?username=query',
      delete: 'DELETE /api/github/profiles/:username',
    },
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/github', githubRoutes);

// ─── Swagger Documentation ───────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ─── Error Handling (must be last) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
