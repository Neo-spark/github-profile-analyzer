const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    description: 'A REST API to analyze GitHub profiles and calculate a developer score.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          name: { type: 'string' },
          bio: { type: 'string' },
          location: { type: 'string' },
          blog: { type: 'string' },
          company: { type: 'string' },
          email: { type: 'string' },
          avatar_url: { type: 'string' },
          followers: { type: 'integer' },
          following: { type: 'integer' },
          public_repos: { type: 'integer' },
          total_stars: { type: 'integer' },
          total_forks: { type: 'integer' },
          most_starred_repo: { type: 'string' },
          top_language: { type: 'string' },
          developer_score: { type: 'integer' },
          rank_level: { type: 'string' },
          account_created: { type: 'string', format: 'date' },
          analyzed_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/github/analyze/{username}': {
      post: {
        summary: 'Analyze a GitHub profile',
        description: 'Fetches profile and repo data from GitHub, computes insights, and stores them.',
        parameters: [
          {
            in: 'path',
            name: 'username',
            required: true,
            schema: { type: 'string' },
            description: 'GitHub username',
          },
        ],
        responses: {
          200: {
            description: 'Profile analyzed successfully',
          },
        },
      },
    },
    '/api/github/profiles': {
      get: {
        summary: 'Get all analyzed profiles',
        description: 'Returns a list of all profiles analyzed so far, ordered by developer score.',
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Page number for pagination',
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Number of items per page',
          },
        ],
        responses: {
          200: {
            description: 'A list of profiles',
          },
        },
      },
    },
    '/api/github/profiles/{username}': {
      get: {
        summary: 'Get a single profile',
        description: 'Returns the full details of a specific analyzed profile.',
        parameters: [
          {
            in: 'path',
            name: 'username',
            required: true,
            schema: { type: 'string' },
            description: 'GitHub username',
          },
        ],
        responses: {
          200: {
            description: 'Profile data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Profile' },
              },
            },
          },
          404: {
            description: 'Profile not found',
          },
        },
      },
      delete: {
        summary: 'Delete a profile',
        description: 'Removes a profile from the database.',
        parameters: [
          {
            in: 'path',
            name: 'username',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Profile deleted successfully',
          },
        },
      },
    },
    '/api/github/profiles/search': {
      get: {
        summary: 'Search profiles',
        description: 'Searches for profiles by partial username or name.',
        parameters: [
          {
            in: 'query',
            name: 'username',
            required: true,
            schema: { type: 'string' },
            description: 'Search query',
          },
        ],
        responses: {
          200: {
            description: 'Search results',
          },
        },
      },
    },
    '/api/github/profiles/{username}/refresh': {
      put: {
        summary: 'Refresh a profile',
        description: 'Forces a fresh fetch from GitHub, bypassing the cache.',
        parameters: [
          {
            in: 'path',
            name: 'username',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Profile refreshed',
          },
        },
      },
    },
    '/api/github/compare/{user1}/{user2}': {
      get: {
        summary: 'Compare two users',
        description: 'Compares the developer score of two GitHub users.',
        parameters: [
          {
            in: 'path',
            name: 'user1',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'user2',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Comparison results',
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [], // Define all paths directly in the definition above
};

const swaggerDocs = swaggerJSDoc(options);

module.exports = swaggerDocs;
