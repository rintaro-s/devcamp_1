import React, { useState, useEffect } from 'react';
import api from '../api';

const TaskManagement = ({ token }) => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completed, setCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks(token);
      if (Array.isArray(data)) {
        setTasks(data);
        setError('');
      } else if (data && typeof data === 'object' && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        setError('');
      } else {
        // unexpected shape -> set empty array to avoid crash
        console.warn('fetchTasks: unexpected response shape', data);
        setTasks([]);
        setError('Failed to fetch tasks (unexpected response)');
      }
    } catch (err) {
      console.error('fetchTasks error:', err);
      setError('Network error or server is down');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (editingTask) {
        data = await api.updateTask(editingTask.id, { title, description, due_date: dueDate, completed }, token);
        setMessage('Task updated successfully!');
      } else {
        data = await api.createTask({ title, description, due_date: dueDate }, token);
        setMessage('Task created successfully!');
      }
      if (data) {
        fetchTasks();
        setTitle('');
        setDescription('');
        setDueDate('');
        setCompleted(false);
        setEditingTask(null);
        setError('');
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error or server is down');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.due_date ? task.due_date.substring(0, 16) : ''); // Format for datetime-local input
    setCompleted(task.completed);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const data = await api.deleteTask(id, token);
        if (data) {
          setMessage('Task deleted successfully!');
          fetchTasks();
          setError('');
        } else {
          setError(data.error || 'Deletion failed');
        }
      } catch (err) {
        setError('Network error or server is down');
      }
    }
  };

  return (
    <div>
      <h2>Task Management</h2>
      <form onSubmit={handleSubmit}>
        <h3>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        <div>
          <label>Due Date:</label>
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        {editingTask && (
          <div>
            <label>
              <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
              Completed
            </label>
          </div>
        )}
        <button type="submit">{editingTask ? 'Update' : 'Add'}</button>
        {editingTask && <button type="button" onClick={() => setEditingTask(null)}>Cancel</button>}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Task List</h3>
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks && Array.isArray(tasks) && tasks.length > 0 ? (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {task.title} {task.completed ? '(Completed)' : ''} - {task.description} (Due: {task.due_date ? new Date(task.due_date).toLocaleString() : 'N/A'})
              <button onClick={() => handleEdit(task)}>Edit</button>
              <button onClick={() => handleDelete(task.id)}>Delete</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tasks found.</p>
      )}
    </div>
  );
};

export default TaskManagement;
