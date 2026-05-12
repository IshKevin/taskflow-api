const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] TaskFlow API started on port ${PORT}`);
});