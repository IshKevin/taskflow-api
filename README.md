# TaskFlow API

A lightweight task management REST API built with Node.js and Express.
Developed over two sprints as a demonstration of Agile and DevOps practices.

## Quick Start

```bash
npm install
npm start        # http://localhost:3000
npm test         # run tests with coverage
```

## API Endpoints

| Method | Endpoint        | Description                       |
|--------|-----------------|-----------------------------------|
| GET    | /health         | Health check + uptime metrics     |
| GET    | /tasks          | List all tasks (?status= filter)  |
| POST   | /tasks          | Create a new task                 |
| GET    | /tasks/:id      | Get a specific task               |
| PATCH  | /tasks/:id      | Update task fields/status         |
| DELETE | /tasks/:id      | Delete a task                     |

## Task Schema

```json
{
  "id": 1,
  "title": "Write unit tests",
  "description": "Cover all endpoints",
  "status": "todo | in-progress | done",
  "priority": "low | medium | high",
  "createdAt": "2026-05-10T09:00:00.000Z",
  "updatedAt": "2026-05-10T09:00:00.000Z"
}
```

## CI/CD

GitHub Actions pipeline runs on every push:
1. **Test** — Jest with coverage on Node 18 & 20
2. **Build** — Install prod deps, verify `/health` responds
3. **Deploy** — Triggered on `main` branch merges