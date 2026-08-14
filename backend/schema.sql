-- schema.sql
CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY(board_id) REFERENCES boards(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    position INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(column_id) REFERENCES columns(id)
);

-- Basic Seed Data
INSERT INTO boards (id, name) VALUES (1, 'Main Board') ON CONFLICT(id) DO NOTHING;

INSERT INTO columns (id, board_id, name, position) VALUES 
(1, 1, 'To Do', 0),
(2, 1, 'In Progress', 1),
(3, 1, 'Done', 2)
ON CONFLICT(id) DO NOTHING;

INSERT INTO tasks (id, column_id, title, description, priority, position) VALUES 
(1, 1, 'Setup Project', 'Initialize frontend and backend', 'High', 0),
(2, 1, 'Design DB Schema', 'Create tables for boards, columns, and tasks', 'Medium', 1),
(3, 2, 'Build API', 'Create REST endpoints', 'High', 0)
ON CONFLICT(id) DO NOTHING;
