const express = require('express');
const cors = require('cors');
const { dbRun, dbAll, dbGet } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoints

// Get full board with columns and tasks
app.get('/api/board', async (req, res) => {
    try {
        const board = await dbGet('SELECT * FROM boards LIMIT 1');
        if (!board) return res.status(404).json({ error: 'Board not found' });

        const columns = await dbAll('SELECT * FROM columns WHERE board_id = ? ORDER BY position', [board.id]);
        const tasks = await dbAll('SELECT * FROM tasks ORDER BY position');

        res.json({ board, columns, tasks });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch board data' });
    }
});

// Create a task
app.post('/api/tasks', async (req, res) => {
    const { title, description, priority, column_id } = req.body;
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }
    const prio = priority || 'Medium';
    
    try {
        const result = await dbRun(
            'INSERT INTO tasks (column_id, title, description, priority, position) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(position) + 1, 0) FROM tasks WHERE column_id = ?))',
            [column_id, title, description, prio, column_id]
        );
        const newTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Edit a task
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, priority } = req.body;
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    try {
        await dbRun(
            'UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?',
            [title, description, priority, id]
        );
        const updatedTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await dbRun('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Move a task (Drag & Drop support)
app.patch('/api/tasks/:id/move', async (req, res) => {
    const { id } = req.params;
    const { column_id, position } = req.body; // new column and new position
    
    try {
        await dbRun('UPDATE tasks SET column_id = ?, position = ? WHERE id = ?', [column_id, position, id]);
        // Note: For a fully robust drag-and-drop, you typically need to update the position of other tasks.
        // For this assignment, we will do a simple update or allow position collision if simple.
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to move task' });
    }
});

// Assignment Requirement: Custom queries
app.get('/api/stats/tasks-per-column', async (req, res) => {
    try {
        const query = `
            SELECT c.name as column_name, COUNT(t.id) as task_count
            FROM columns c
            LEFT JOIN tasks t ON c.id = t.column_id
            GROUP BY c.id
        `;
        const data = await dbAll(query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Query failed' });
    }
});

app.get('/api/stats/tasks-by-priority', async (req, res) => {
    const { priority } = req.query;
    try {
        const query = `
            SELECT * FROM tasks 
            WHERE priority = ? 
            ORDER BY created_at DESC
        `;
        const data = await dbAll(query, [priority]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Query failed' });
    }
});

// Only start the server if we're not testing
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Backend running on http://localhost:${port}`);
    });
}

module.exports = app;
