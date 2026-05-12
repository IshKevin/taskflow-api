const request = require('supertest');
const app = require('../src/app');

beforeEach(() => {
  app.resetForTests();
});

// ─────────────────────────────────────────────
// US-001: Create tasks
// ─────────────────────────────────────────────
describe('POST /tasks — Create a task', () => {
  test('creates a task with valid title', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Buy groceries' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBe('Buy groceries');
    expect(res.body.status).toBe('todo');
    expect(res.body.priority).toBe('medium');
    expect(res.body.createdAt).toBeDefined();
  });

  test('creates a task with all optional fields', async () => {
    const res = await request(app).post('/tasks').send({
      title: 'Write tests',
      description: 'Unit and integration',
      priority: 'high',
    });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Unit and integration');
    expect(res.body.priority).toBe('high');
  });

  test('rejects missing title', async () => {
    const res = await request(app).post('/tasks').send({ description: 'No title here' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  test('rejects empty title', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  test('rejects invalid priority', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Test', priority: 'urgent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/priority/);
  });
});

// ─────────────────────────────────────────────
// US-002: List tasks
// ─────────────────────────────────────────────
describe('GET /tasks — List tasks', () => {
  test('returns empty array when no tasks', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Task A' });
    await request(app).post('/tasks').send({ title: 'Task B' });
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('filters tasks by status', async () => {
    await request(app).post('/tasks').send({ title: 'Task A' });
    const created = await request(app).post('/tasks').send({ title: 'Task B' });
    await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'done' });

    const res = await request(app).get('/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Task B');
  });
});

// ─────────────────────────────────────────────
// US-003: Get single task
// ─────────────────────────────────────────────
describe('GET /tasks/:id — Get single task', () => {
  test('returns task by id', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Find me' });
    const res = await request(app).get(`/tasks/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find me');
  });

  test('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/tasks/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

// ─────────────────────────────────────────────
// US-004: Update task status
// ─────────────────────────────────────────────
describe('PATCH /tasks/:id — Update task', () => {
  test('updates task status to in-progress', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Start me' });
    const res = await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'in-progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in-progress');
  });

  test('updates task status to done', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Finish me' });
    const res = await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('updates title and priority', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Old title' });
    const res = await request(app).patch(`/tasks/${created.body.id}`).send({
      title: 'New title',
      priority: 'high',
    });
    expect(res.body.title).toBe('New title');
    expect(res.body.priority).toBe('high');
  });

  test('rejects invalid status', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });
    const res = await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });

  test('returns 404 for non-existent task', async () => {
    const res = await request(app).patch('/tasks/999').send({ status: 'done' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// US-005: Delete task
// ─────────────────────────────────────────────
describe('DELETE /tasks/:id — Delete task', () => {
  test('deletes an existing task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Delete me' });
    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/tasks/${created.body.id}`);
    expect(check.status).toBe(404);
  });

  test('returns 404 when deleting non-existent task', async () => {
    const res = await request(app).delete('/tasks/999');
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// US-006: Health endpoint (Sprint 2)
// ─────────────────────────────────────────────
describe('GET /health — Health check', () => {
  test('returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.taskCount).toBe('number');
  });

  test('reflects current task count', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1' });
    await request(app).post('/tasks').send({ title: 'Task 2' });
    const res = await request(app).get('/health');
    expect(res.body.taskCount).toBe(2);
  });
});