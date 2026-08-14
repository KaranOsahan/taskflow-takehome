import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FiEdit2, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';

const API_URL = 'https://taskflow-takehome.onrender.com/api';

export default function App() {
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPriority, setFilterPriority] = useState('All');

  // Modal State
  const [viewingTask, setViewingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeColumnId, setActiveColumnId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'Medium' });

  const fetchBoard = async () => {
    try {
      const res = await fetch(`${API_URL}/board`);
      if (!res.ok) throw new Error('Failed to fetch board data');
      const data = await res.json();
      setBoard(data.board);
      setColumns(data.columns);
      setTasks(data.tasks);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update UI
    const movedTaskId = parseInt(draggableId.split('-')[1]);
    const destColId = parseInt(destination.droppableId.split('-')[1]);

    const newTasks = tasks.map(t => {
      if (t.id === movedTaskId) {
        return { ...t, column_id: destColId, position: destination.index };
      }
      return t;
    });
    setTasks(newTasks);

    // Call API
    try {
      await fetch(`${API_URL}/tasks/${movedTaskId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: destColId, position: destination.index })
      });
    } catch (err) {
      console.error('Failed to move task:', err);
      // Rollback on fail
      fetchBoard();
    }
  };

  const openCreateModal = (columnId) => {
    setEditingTask(null);
    setActiveColumnId(columnId);
    setFormData({ title: '', description: '', priority: 'Medium' });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description || '', priority: task.priority });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('Title is required');

    try {
      if (editingTask) {
        // Edit
        const res = await fetch(`${API_URL}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to update task');
        const updatedTask = await res.json();
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      } else {
        // Create
        const res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, column_id: activeColumnId })
        });
        if (!res.ok) throw new Error('Failed to create task');
        const newTask = await res.json();
        setTasks([...tasks, newTask]);
      }
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      const res = await fetch(`${API_URL}/tasks/${taskToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;

  return (
    <>
      <header className="app-header">
        <h1 className="app-title">{board?.name || 'TaskFlow'}</h1>
        <div className="filters">
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Filter by Priority:</span>
          <select
            className="filter-select"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <main className="board-container">
          {columns.map(column => {
            const columnTasks = tasks
              .filter(t => t.column_id === column.id)
              .filter(t => filterPriority === 'All' ? true : t.priority === filterPriority)
              .sort((a, b) => {
                const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
                const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
                if (weightDiff !== 0) return weightDiff;
                return a.position - b.position;
              });

            return (
              <div key={column.id} className="column">
                <div className="column-header">
                  <div className="column-title">{column.name}</div>
                  <div className="task-count">{columnTasks.length}</div>
                </div>

                <Droppable droppableId={`col-${column.id}`}>
                  {(provided) => (
                    <div
                      className="task-list"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className="task-card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1
                              }}
                            >
                              {taskToDelete?.id === task.id && (
                                <div className="delete-popover">
                                  <p>Delete Task?</p>
                                  <div className="actions">
                                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setTaskToDelete(null)}>Cancel</button>
                                    <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger-color)', padding: '6px 10px', fontSize: 12 }} onClick={confirmDelete}>Delete</button>
                                  </div>
                                </div>
                              )}
                              <div className="task-header">
                                <div className="task-title">{task.title}</div>
                                <div className="task-actions">
                                  <button className="icon-btn" onClick={() => setViewingTask(task)} title="View Task">
                                    <FiEye size={14} />
                                  </button>
                                  <button className="icon-btn" onClick={() => openEditModal(task)} title="Edit Task">
                                    <FiEdit2 size={14} />
                                  </button>
                                  <button className="icon-btn delete" onClick={() => setTaskToDelete(task)} title="Delete Task">
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              {task.description && <div className="task-desc">{task.description}</div>}
                              <div className="task-footer">
                                <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                  {task.priority}
                                </span>
                                <span className="task-date">
                                  {new Date(task.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div style={{ padding: '0 16px 16px' }}>
                  <button className="btn btn-secondary btn-full" onClick={() => openCreateModal(column.id)}>
                    <FiPlus style={{ marginRight: 6 }} /> Add a task
                  </button>
                </div>
              </div>
            );
          })}
        </main>
      </DragDropContext>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button className="icon-btn" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Modal */}
      {viewingTask && (
        <div className="modal-overlay" onClick={() => setViewingTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{viewingTask.title}</h2>
              <button className="icon-btn" onClick={() => setViewingTask(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span className={`priority-badge priority-${viewingTask.priority.toLowerCase()}`}>
                {viewingTask.priority} Priority
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 12 }}>
                Added {new Date(viewingTask.created_at).toLocaleDateString()}
              </span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {viewingTask.description || <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>No description provided.</span>}
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={() => setViewingTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
