const express = require('express');
const mysql = require('mysql2/promise');
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));



// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    await connection.end();
    res.json({ 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      database: 'error',
      message: error.message 
    });
  }
});

/*
GET ALL TASKS
*/
app.get("/tasks", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks");

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

/*
ADD TASK
*/
app.post("/tasks", async (req, res) => {
  try {
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({ error: "Task text required" });
    }

    const taskId = uuidv4();

    await db.query(
      "INSERT INTO tasks (taskId, task, createdAt) VALUES (?, ?, NOW())",
      [taskId, task]
    );

    res.json({
      message: "Task added",
      taskId: taskId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add task" });
  }
});

/*
DELETE TASK
*/
app.delete("/tasks/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;

    await db.query(
      "DELETE FROM tasks WHERE taskId = ?",
      [taskId]
    );

    res.json({
      message: "Task deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

app.get("/", (req, res) => {
  res.send("Task Manager API Running");
});
const PORT = 80;

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});