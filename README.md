# 🔍 GitHub Profile Analyzer API

A production-ready REST API built with **Node.js + Express.js** that analyzes GitHub profiles, computes developer insights, and stores results in **MySQL**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔗 GitHub API Integration | Fetches user profile + all repos via GitHub REST API |
| 📊 Repository Analysis | Total stars, total forks, most-starred repo |
| 🏆 Developer Score | `followers×2 + repos×3 + stars×5` |
| 🎖️ Rank Level | Beginner / Intermediate / Advanced |
| 📅 Account Age | Years since GitHub account was created |
| 🔄 Follower Ratio | followers ÷ following |
| 🔍 Search API | Partial username/name search |
| ⚡ Upsert Logic | Re-analyzing a profile refreshes existing data |
| 🗄️ MySQL Persistence | Connection pool with auto-schema initialization |
| 🛡️ Error Handling | 404, 403 (rate limit), and 500 errors handled gracefully |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd github-profile-analyzer
npm install
```

### 2. Configure Environment

Copy and edit the `.env` file:

```bash
cp .env .env.local   # optional
```

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional: Increases rate limit from 60 to 5,000 req/hr
GITHUB_TOKEN=your_github_personal_access_token
```

### 3. Start MySQL

Make sure MySQL is running on your machine or use a cloud service (see Deployment section).

### 4. Run the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

> ℹ️ The server **automatically creates** the `github_analyzer` database and `github_profiles` table on first run.

---

## 📡 API Reference

### Base URL
```
http://localhost:3000/api/github
```

---

### `POST /analyze/:username`

Fetches data from GitHub, computes insights, and stores them in MySQL.

**Example:**
```bash
curl -X POST http://localhost:3000/api/github/analyze/octocat
```

**Response:**
```json
{
  "message": "Profile analyzed successfully",
  "data": {
    "username": "octocat",
    "name": "The Octocat",
    "followers": 16966,
    "following": 9,
    "public_repos": 8,
    "total_stars": 2850,
    "total_forks": 2100,
    "most_starred_repo": "Hello-World",
    "developer_score": 48686,
    "rank_level": "Advanced",
    "account_age_years": "13.4",
    "follower_ratio": "1884.00",
    "account_created": "2011-01-25"
  }
}
```

---

### `GET /profiles`

Returns all analyzed profiles sorted by developer score.

```bash
curl http://localhost:3000/api/github/profiles
```

**Response:**
```json
{
  "count": 3,
  "profiles": [
    {
      "username": "octocat",
      "name": "The Octocat",
      "followers": 16966,
      "public_repos": 8,
      "developer_score": 48686,
      "rank_level": "Advanced",
      "analyzed_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### `GET /profiles/:username`

Returns full details of a single profile.

```bash
curl http://localhost:3000/api/github/profiles/octocat
```

---

### `GET /profiles/search?username=query`

Searches profiles by partial username or display name.

```bash
curl "http://localhost:3000/api/github/profiles/search?username=octo"
```

**Response:**
```json
{
  "query": "octo",
  "count": 1,
  "profiles": [ ... ]
}
```

---

### `DELETE /profiles/:username`

Removes a profile from the database.

```bash
curl -X DELETE http://localhost:3000/api/github/profiles/octocat
```

---

## 🏗️ Project Structure

```
github-profile-analyzer/
├── src/
│   ├── config/
│   │   └── db.js              # MySQL pool + auto-init
│   ├── controllers/
│   │   └── githubController.js # Request handlers
│   ├── models/
│   │   └── githubModel.js      # SQL queries (CRUD)
│   ├── routes/
│   │   └── githubRoutes.js     # Express router
│   ├── services/
│   │   └── githubService.js    # GitHub API + insight calculations
│   ├── middleware/
│   │   └── index.js            # Logger, error handler, 404
│   └── app.js                  # Express app setup
├── server.js                   # Entry point
├── schema.sql                  # Manual DB setup script
├── .env                        # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🧮 Developer Score Formula

```
score = followers × 2 + public_repos × 3 + total_stars × 5
```

| Score Range | Rank |
|---|---|
| 0 – 100 | 🟢 Beginner |
| 101 – 500 | 🔵 Intermediate |
| 501+ | 🔴 Advanced |

---

## 🗄️ Database Schema

```sql
CREATE TABLE github_profiles (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    username          VARCHAR(255) UNIQUE NOT NULL,
    name              VARCHAR(255),
    bio               TEXT,
    location          VARCHAR(255),
    blog              VARCHAR(500),
    company           VARCHAR(255),
    email             VARCHAR(255),
    avatar_url        VARCHAR(500),
    followers         INT DEFAULT 0,
    following         INT DEFAULT 0,
    public_repos      INT DEFAULT 0,
    total_stars       INT DEFAULT 0,
    total_forks       INT DEFAULT 0,
    most_starred_repo VARCHAR(255),
    developer_score   INT DEFAULT 0,
    rank_level        VARCHAR(50),
    account_created   DATE,
    analyzed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## ☁️ Deployment

### Backend (Choose one)
- **[Render](https://render.com)** — Connect GitHub repo → New Web Service → Set env vars
- **[Railway](https://railway.app)** — `railway up` after `railway init`

### Database (Choose one)
- **[Aiven](https://aiven.io)** — Free MySQL cloud instance
- **[Railway MySQL](https://railway.app)** — Provision alongside your app

### Required Environment Variables for Deployment
```
PORT=3000
NODE_ENV=production
DB_HOST=<cloud-host>
DB_PORT=<cloud-port>
DB_USER=<cloud-user>
DB_PASSWORD=<cloud-password>
DB_NAME=github_analyzer
GITHUB_TOKEN=<your-token>
```

---

## 🔑 Getting a GitHub Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select **no scopes** (public data only)
4. Copy and paste into `.env` as `GITHUB_TOKEN`

This increases your rate limit from **60 req/hr** to **5,000 req/hr**.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via mysql2 with connection pooling)
- **HTTP Client**: Axios
- **Environment**: dotenv
- **Dev Tool**: nodemon
