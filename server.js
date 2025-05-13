const express = require('express');
const connectDB = require('./config/db');
const locksRouter = require('./routes/locks');
require('./jobs/cleanup');

const app = express();
const PORT = 5000;

connectDB();
app.use(express.json());
app.use('/api/locks', locksRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
