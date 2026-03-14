require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});