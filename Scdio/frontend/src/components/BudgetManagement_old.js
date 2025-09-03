import React, { useState, useEffect } from 'react';
import api from '../api';

const BudgetManagement = ({ token }) => {
  const [budgets, setBudgets] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState('income');
  const [editingBudget, setEditingBudget] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, [token]);

  const fetchBudgets = async () => {
    try {
      const data = await api.getBudgets(token);
      if (data) {
        setBudgets(data);
      } else {
        setError(data.error || 'Failed to fetch budgets');
      }
    } catch (err) {
      setError('Network error or server is down');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (editingBudget) {
        data = await api.updateBudget(editingBudget.id, { name, description, amount: parseInt(amount), type }, token);
        setMessage('Budget updated successfully!');
      } else {
        data = await api.createBudget({ name, description, amount: parseInt(amount), type }, token);
        setMessage('Budget created successfully!');
      }
      if (data) {
        fetchBudgets();
        setName('');
        setDescription('');
        setAmount(0);
        setType('income');
        setEditingBudget(null);
        setError('');
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error or server is down');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setName(budget.name);
    setDescription(budget.description);
    setAmount(budget.amount);
    setType(budget.type);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        const data = await api.deleteBudget(id, token);
        if (data) {
          setMessage('Budget deleted successfully!');
          fetchBudgets();
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
      <h2>Budget Management</h2>
      <form onSubmit={handleSubmit}>
        <h3>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</h3>
        <div>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        <div>
          <label>Amount:</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <button type="submit">{editingBudget ? 'Update' : 'Add'}</button>
        {editingBudget && <button type="button" onClick={() => setEditingBudget(null)}>Cancel</button>}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Budget List</h3>
      <ul>
        {budgets.map((b) => (
          <li key={b.id}>
            {b.name} ({b.type}): {b.amount} - {b.description}
            <button onClick={() => handleEdit(b)}>Edit</button>
            <button onClick={() => handleDelete(b.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BudgetManagement;
