import React, { useState, useEffect } from 'react';
import api from '../api';

const EquipmentManagement = ({ token }) => {
  const [equipments, setEquipments] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEquipments();
  }, [token]);

  const fetchEquipments = async () => {
    try {
      const data = await api.getEquipments(token);
      if (data) {
        // Defensive programming: ensure data is an array
        const equipmentsArray = Array.isArray(data) ? data : (data.equipments && Array.isArray(data.equipments)) ? data.equipments : [];
        setEquipments(equipmentsArray);
      } else {
        setError(data?.error || 'Failed to fetch equipments');
        setEquipments([]);
      }
    } catch (err) {
      setError('Network error or server is down');
      setEquipments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (editingEquipment) {
        data = await api.updateEquipment(editingEquipment.id, { name, description, quantity }, token);
        setMessage('Equipment updated successfully!');
      } else {
        data = await api.createEquipment({ name, description, quantity }, token);
        setMessage('Equipment created successfully!');
      }
      if (data) {
        fetchEquipments();
        setName('');
        setDescription('');
        setQuantity(1);
        setEditingEquipment(null);
        setError('');
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error or server is down');
    }
  };

  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    setName(equipment.name);
    setDescription(equipment.description);
    setQuantity(equipment.quantity);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        const data = await api.deleteEquipment(id, token);
        if (data) {
          setMessage('Equipment deleted successfully!');
          fetchEquipments();
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
      <h2>Equipment Management</h2>
      <form onSubmit={handleSubmit}>
        <h3>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</h3>
        <div>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        <div>
          <label>Quantity:</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
        <button type="submit">{editingEquipment ? 'Update' : 'Add'}</button>
        {editingEquipment && <button type="button" onClick={() => setEditingEquipment(null)}>Cancel</button>}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Equipment List</h3>
      <ul>
        {equipments.map((eq) => (
          <li key={eq.id}>
            {eq.name} ({eq.quantity}) - {eq.description}
            <button onClick={() => handleEdit(eq)}>Edit</button>
            <button onClick={() => handleDelete(eq.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EquipmentManagement;
