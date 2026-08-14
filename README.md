# TaskFlow

TaskFlow is a lightweight task board for small teams built with React, Node.js, Express, and SQLite.

## Setup Instructions (From a Clean Clone)

To run this project locally, you will need two terminal windows to start the backend and frontend separately.

### 1. Start the Backend
Open a terminal and run the following commands:
```bash
cd backend
npm install
npm start
```
*Note: The SQLite database is automatically initialized and seeded with columns and sample tasks on the very first run. You do not need to manually create the schema or tables.*

### 2. Start the Frontend
Open a second terminal and run:
```bash
cd frontend
npm install
npm run dev
```
Once the server starts, open [http://localhost:5173](http://localhost:5173) in your browser.

## Testing
To run the backend API test suite:
```bash
cd backend
npm test
```

## Assignment Reflection

**Decisions & Assumptions:**
- I used raw SQL queries with the `sqlite3` driver instead of an ORM to properly demonstrate my database querying skills as requested. I also explicitly enabled `PRAGMA foreign_keys = ON;` to ensure strict schema constraints.
- I assumed a single global board state since user authentication was out of scope. 
- I chose to implement the Drag-and-Drop stretch goal using `@hello-pangea/dnd`, utilizing optimistic UI updates for a snappy user experience.
- I opted for a clean, light UI using standard Vanilla CSS to demonstrate proficiency with native web styling over utility frameworks.

**Interesting Learnings:**
- I learned that the popular `react-beautiful-dnd` library has issues with React 18's Strict Mode, which led me to research and successfully implement its modern, community-maintained fork `@hello-pangea/dnd`.
