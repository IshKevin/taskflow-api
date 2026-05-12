const express = require('express');
const app = express();

app.use(express.json());

// In-memory store (Sprint 1 scope)
let tasks = [];
let nextId = 1;

// === LOGGING MIDDLEWARE (Sprint 2: Monitoring) ===
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// === HEALTH ENDPOINT (Sprint 2: Monitoring) ===
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    taskCount: tasks.length,
  });
});

// === TASK ENDPOINTS ===

// GET /tasks — list all tasks (with optional ?status= filter)
app.get('/tasks', (req, res) => {
  const { status } = req.query;
  const result = status ? tasks.filter(t => t.status === status) : tasks;
  res.json(result);
});

// POST /tasks — create a task
app.post('/tasks', (req, res) => {
  const { title, description, priority } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${validPriorities.join(', ')}` });
  }
  const task = {
    id: nextId++,
    title: title.trim(),
    description: description || '',
    status: 'todo',
    priority: priority || 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(task);
  res.status(201).json(task);
});

// GET /tasks/:id — get single task
app.get('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// PATCH /tasks/:id — update task fields
app.patch('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status, priority } = req.body;
  const validStatuses = ['todo', 'in-progress', 'done'];
  const validPriorities = ['low', 'medium', 'high'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${validPriorities.join(', ')}` });
  }

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  task.updatedAt = new Date().toISOString();

  res.json(task);
});

// DELETE /tasks/:id — delete a task
app.delete('/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(index, 1);
  res.status(204).send();
});

// === ERROR HANDLER (Sprint 2: Monitoring) ===
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Reset helper for tests
app.resetForTests = () => { tasks = []; nextId = 1; };

module.exports = app;