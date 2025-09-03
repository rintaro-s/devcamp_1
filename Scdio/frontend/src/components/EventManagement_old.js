import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Fab,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { format, parseISO, isFuture, isToday, isTomorrow } from 'date-fns';
import { ja } from 'date-fns/locale';
import api from '../api';

const EventManagement = ({ token, serverId }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, past
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [token, serverId]);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, filterStatus]);

  const filterEvents = () => {
    let filtered = events;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (filterStatus === 'upcoming') {
      filtered = filtered.filter(event => isFuture(parseISO(event.start_time)));
    } else if (filterStatus === 'past') {
      filtered = filtered.filter(event => !isFuture(parseISO(event.start_time)));
    }
    
    setFilteredEvents(filtered);
  };

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents(token);
      if (data) {
        // Defensive programming: ensure data is an array
        const eventsArray = Array.isArray(data) ? data : (data.events && Array.isArray(data.events)) ? data.events : [];
        setEvents(eventsArray);
      } else {
        setError(data?.error || 'Failed to fetch events');
        setEvents([]);
      }
    } catch (err) {
      setError('Network error or server is down');
      setEvents([]);
    }
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const eventData = {
        title: name,
        description,
        location,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        start_time: startTime,
        end_time: endTime,
        server_id: serverId
      };
      
      let data;
      if (editingEvent) {
        data = await api.updateEvent(editingEvent.id, eventData, token);
        setMessage('イベントが正常に更新されました！');
      } else {
        data = await api.createEvent(eventData, token);
        setMessage('イベントが正常に作成されました！');
      }
      
      if (data && !data.error) {
        fetchEvents();
        resetForm();
        setDialogOpen(false);
      } else {
        setError(data?.error || '操作が失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーまたはサーバーがダウンしています');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setLocation('');
    setMaxParticipants('');
    setStartTime('');
    setEndTime('');
    setEditingEvent(null);
  };

  const handleEdit = (event) => {
    setName(event.title || '');
    setDescription(event.description || '');
    setLocation(event.location || '');
    setMaxParticipants(event.max_participants || '');
    setStartTime(event.start_time ? event.start_time.slice(0, 16) : '');
    setEndTime(event.end_time ? event.end_time.slice(0, 16) : '');
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当にこのイベントを削除しますか？')) {
      try {
        setLoading(true);
        await api.deleteEvent(id, token);
        setMessage('イベントが正常に削除されました');
        fetchEvents();
      } catch (err) {
        setError('削除に失敗しました');
      } finally {
        setLoading(false);
      }
    }
  };

  const getEventStatusChip = (event) => {
    const startDate = parseISO(event.start_time);
    if (isToday(startDate)) {
      return <Chip label="今日" color="primary" size="small" />;
    } else if (isTomorrow(startDate)) {
      return <Chip label="明日" color="secondary" size="small" />;
    } else if (isFuture(startDate)) {
      return <Chip label="予定" color="success" size="small" />;
    } else {
      return <Chip label="終了" color="default" size="small" />;
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setName(event.name);
    setDescription(event.description);
    setStartTime(event.start_time);
    setEndTime(event.end_time);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const data = await api.deleteEvent(id, token);
        if (data) {
          setMessage('Event deleted successfully!');
          fetchEvents();
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
      <h2>Event Management</h2>
      <form onSubmit={handleSubmit}>
        <h3>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
        <div>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        <div>
          <label>Start Time:</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div>
          <label>End Time:</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
        <button type="submit">{editingEvent ? 'Update' : 'Add'}</button>
        {editingEvent && <button type="button" onClick={() => setEditingEvent(null)}>Cancel</button>}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Event List</h3>
      <ul>
        {events.map((ev) => (
          <li key={ev.id}>
            {ev.name} ({new Date(ev.start_time).toLocaleString()} - {new Date(ev.end_time).toLocaleString()}) - {ev.description}
            <button onClick={() => handleEdit(ev)}>Edit</button>
            <button onClick={() => handleDelete(ev.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventManagement;
