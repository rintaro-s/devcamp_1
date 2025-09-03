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
  Chip,
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
    setName(event.title || event.name || '');
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon color="primary" />
          イベント管理
        </Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="イベントを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>フィルター</InputLabel>
              <Select
                value={filterStatus}
                label="フィルター"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="upcoming">予定</MenuItem>
                <MenuItem value="past">終了</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Events List */}
      <Grid container spacing={3}>
        {filteredEvents.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {event.title || event.name}
                  </Typography>
                  {getEventStatusChip(event)}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {event.description}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {format(parseISO(event.start_time), 'yyyy/MM/dd HH:mm', { locale: ja })}
                      {event.end_time && ` - ${format(parseISO(event.end_time), 'HH:mm', { locale: ja })}`}
                    </Typography>
                  </Box>
                  
                  {event.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2">{event.location}</Typography>
                    </Box>
                  )}
                  
                  {event.max_participants && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">最大 {event.max_participants}名</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(event)}
                >
                  編集
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(event.id)}
                >
                  削除
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredEvents.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery || filterStatus !== 'all' ? '検索条件に一致するイベントがありません' : 'イベントがありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            右下の「+」ボタンから新しいイベントを作成しましょう
          </Typography>
        </Paper>
      )}

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingEvent ? 'イベントを編集' : '新しいイベントを作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="イベント名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="説明"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="場所"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="最大参加者数"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="開始日時"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="終了日時"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '保存中...' : editingEvent ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EventManagement;
