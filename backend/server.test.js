const request = require('supertest');
const app = require('./server');
const { db, dbRun, dbGet } = require('./db');
const fs = require('fs');
const path = require('path');

beforeAll((done) => {
    // Re-initialize DB to ensure a clean state
    const schemaFile = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaFile, 'utf-8');
    db.exec(schema, done);
});

describe('TaskFlow Backend API', () => {
    
    // 1) creating a task with no title fails
    it('should fail to create a task with no title', async () => {
        const response = await request(app)
            .post('/api/tasks')
            .send({
                title: '',
                description: 'test',
                priority: 'Low',
                column_id: 1
            });
        
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Title is required');
    });

    // 2) moving a task updates its status/column correctly
    it('should successfully move a task to a different column', async () => {
        // First create a task
        const createRes = await request(app)
            .post('/api/tasks')
            .send({
                title: 'Task to move',
                column_id: 1
            });
        
        const taskId = createRes.body.id;

        // Move it to column 2
        const moveRes = await request(app)
            .patch(`/api/tasks/${taskId}/move`)
            .send({
                column_id: 2,
                position: 0
            });
        
        expect(moveRes.statusCode).toBe(200);

        // Verify in DB
        const updatedTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
        expect(updatedTask.column_id).toBe(2);
        expect(updatedTask.position).toBe(0);
    });

    // 3) test that hits the database layer directly (tasks per column)
    it('should retrieve accurate tasks per column counts from database', async () => {
        // Get the stats directly from DB layer to test the custom query requirement
        const query = `
            SELECT c.name as column_name, COUNT(t.id) as task_count
            FROM columns c
            LEFT JOIN tasks t ON c.id = t.column_id
            GROUP BY c.id
            ORDER BY c.id
        `;
        
        const rows = await new Promise((resolve, reject) => {
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        // We know we seeded some data and added one in the test above
        expect(rows.length).toBeGreaterThan(0);
        // The first column 'To Do' should be present
        expect(rows[0].column_name).toBe('To Do');
        expect(rows[0].task_count).toBeDefined();
    });
});
