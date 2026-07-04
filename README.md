# ⚖️ Justice AI — Legal Case Analysis Platform

> Accelerating Legal Case Analysis through Generative Intelligence and Graph Theory  
> B.Tech Project — AKTU / Ajay Kumar Garg Engineering College

---

## 🏗️ Architecture

```
justice-ai/
├── backend/            # Node.js + Express REST API
│   ├── models/         # Sequelize ORM models (MySQL)
│   ├── routes/         # API endpoints
│   ├── graph/          # BFS/DFS graph engine
│   ├── middleware/      # Auth (JWT)
│   ├── server.js       # Entry point
│   └── seed.js         # Demo data seeder
├── frontend/           # React 18 + Recharts dashboard
│   └── src/
│       ├── pages/      # Dashboard, Cases, Suspects, Graph, AI
│       ├── components/ # Sidebar, shared UI
│       ├── hooks/      # useAuth
│       └── utils/      # axios API client
└── python-service/     # FastAPI microservice (BFS/DFS + NLP)
    └── main.py
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MySQL 8.0

### 1. Database Setup

Create a MySQL database and user before starting the app:

```sql
CREATE DATABASE justice_ai;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set DB credentials, JWT secret, and optional AI keys
npm install
PORT=5001 npm start
```

The backend will run on port 5001 by default for local development.

### 3. Python Service

```bash
cd python-service
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The Python service will run on port 8000.

### 4. Frontend

```bash
cd frontend
npm install
PORT=3000 BROWSER=none npm start
```

The frontend will run on port 3000.

---

## 🐳 Docker (Recommended)

```bash
# Set your runtime secrets before starting
export MYSQL_ROOT_PASSWORD=change_me
export DB_PASSWORD=change_me
export JWT_SECRET=change_me
export REACT_APP_API_URL=http://localhost:5000

docker compose up --build
```

Access: http://localhost:3000

> Note: the Docker setup uses environment variables for secrets. Do not hardcode passwords or API keys in the repository.

---

## 🔑 Demo Login

Demo credentials are only used for local testing. For AWS deployment, set strong environment-based secrets and avoid shipping demo accounts in production.

## 🚀 AWS Deployment Notes

For deployment on AWS, the project should be prepared with:

- A managed MySQL or RDS instance for the backend database
- Environment variables for DB credentials, JWT secret, and API keys
- A public frontend host or static hosting for the React build
- The backend and Python service exposed through a load balancer or reverse proxy
- Proper CORS settings via the CORS_ORIGIN environment variable

For a production build of the frontend:

```bash
cd frontend
npm run build
```

The build output in the build/ folder can be served from S3 + CloudFront or any static web server.

---

## 🔌 API Reference

### Auth
| Method | Endpoint          | Description     |
|--------|-------------------|-----------------|
| POST   | /api/auth/register | Create account |
| POST   | /api/auth/login    | Login          |
| GET    | /api/auth/me       | Current user   |

### Cases
| Method | Endpoint          | Description         |
|--------|-------------------|---------------------|
| GET    | /api/cases        | List (paginated)    |
| POST   | /api/cases        | Create case         |
| GET    | /api/cases/:id    | Get with suspects+evidence |
| PUT    | /api/cases/:id    | Update              |
| DELETE | /api/cases/:id    | Delete              |
| POST   | /api/cases/:id/suspects | Link suspect |

### Suspects
| Method | Endpoint              | Description      |
|--------|-----------------------|------------------|
| GET    | /api/suspects         | List suspects    |
| POST   | /api/suspects         | Create           |
| PUT    | /api/suspects/:id     | Update           |
| POST   | /api/suspects/:id/relations | Add relation |

### Graph Theory Engine
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/graph/data             | Full graph for viz    |
| GET    | /api/graph/bfs/:suspectId   | BFS traversal         |
| GET    | /api/graph/path/:from/:to   | DFS path finding      |
| GET    | /api/graph/linked-cases/:id | Cases linked by suspects |
| GET    | /api/graph/clusters         | Criminal clusters (DFS) |

### AI Module (requires ANTHROPIC_API_KEY)
| Method | Endpoint                      | Description            |
|--------|-------------------------------|------------------------|
| POST   | /api/ai/summarize/case/:id    | AI case summary        |
| POST   | /api/ai/summarize/document    | Summarize legal text   |
| POST   | /api/ai/query                 | Legal Q&A chatbot      |
| POST   | /api/ai/report/:caseId        | Generate full report   |
| POST   | /api/ai/analyze/evidence/:id  | Analyze evidence       |

### Python AI Service (:8000)
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| POST   | /graph/traverse    | BFS or DFS traversal |
| POST   | /graph/path        | Path finding DFS     |
| POST   | /graph/clusters    | Connected components |
| POST   | /nlp/keywords      | Keyword extraction   |
| POST   | /nlp/entities      | Legal NER            |

---

## 🧠 Core Algorithms

### BFS — Breadth-First Search (`graph/engine.js`)
Used to discover all suspects reachable within N hops from a given suspect.
Reveals criminal networks and hidden associations.

### DFS — Depth-First Search (`graph/engine.js`)
Used to find specific paths between two suspects and detect criminal clusters
(connected components via DFS).

### Graph Model
- **Nodes**: Cases + Suspects
- **Edges**: Suspect-Suspect relations (accomplice, family, associate)
           + Suspect-Case links (role: primary, accomplice, witness)

---

## 🛠️ Tech Stack

| Layer       | Technology                         |
|-------------|------------------------------------|
| Frontend    | React 18, Recharts, React Router   |
| Backend     | Node.js, Express.js, Sequelize ORM |
| Database    | MySQL 8.0                          |
| AI Engine   | Anthropic Claude API (claude-sonnet-4) |
| Graph/NLP   | Python 3.11, FastAPI               |
| Auth        | JWT (jsonwebtoken + bcryptjs)      |
| DevOps      | Docker, Docker Compose             |

---

## 👥 Team

- Rudra Chaubey (2200271530095)
- Rishabh Mishra (2200271530090)
- Rajendra Yadav (2200271530089)
- Sheikh Sabbir (2200271530108)

**Supervisor**: Ms. Ritika Dhyani  
**Institution**: Ajay Kumar Garg Engineering College, Ghaziabad  
**University**: Dr. A.P.J Abdul Kalam Technical University, Lucknow

---

*Justice AI — B.Tech Synopsis Project, September 2025*
