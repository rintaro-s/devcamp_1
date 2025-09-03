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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Alert,
  Fab,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Flag as FlagIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import api from '../api';

const TaskManagement = ({ token }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending, overdue
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completed, setCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [token]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, filterStatus]);

  const filterTasks = () => {
    let filtered = tasks;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (filterStatus === 'completed') {
      filtered = filtered.filter(task => task.completed);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filterStatus === 'overdue') {
      filtered = filtered.filter(task => !task.completed && task.due_date && isPast(parseISO(task.due_date)));
    }
    
    setFilteredTasks(filtered);
  };

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
        console.warn('fetchTasks: unexpected response shape', data);
        setTasks([]);
        setError('タスクの取得に失敗しました（予期しないレスポンス）');
      }
    } catch (err) {
      console.error('fetchTasks error:', err);
      setError('ネットワークエラーまたはサーバーがダウンしています');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let data;
      if (editingTask) {
        data = await api.updateTask(editingTask.id, { title, description, due_date: dueDate, completed }, token);
        setMessage('タスクが正常に更新されました！');
      } else {
        data = await api.createTask({ title, description, due_date: dueDate }, token);
        setMessage('タスクが正常に作成されました！');
      }
      
      if (data && !data.error) {
        fetchTasks();
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
    setTitle('');
    setDescription('');
    setDueDate('');
    setCompleted(false);
    setEditingTask(null);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setDueDate(task.due_date ? task.due_date.substring(0, 16) : '');
    setCompleted(task.completed || false);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当にこのタスクを削除しますか？')) {
      try {
        setLoading(true);
        const data = await api.deleteTask(id, token);
        if (data && !data.error) {
          setMessage('タスクが正常に削除されました');
          fetchTasks();
        } else {
          setError(data?.error || '削除に失敗しました');
        }
      } catch (err) {
        setError('ネットワークエラーまたはサーバーがダウンしています');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleTaskComplete = async (task) => {
    try {
      const data = await api.updateTask(task.id, { ...task, completed: !task.completed }, token);
      if (data && !data.error) {
        fetchTasks();
      }
    } catch (err) {
      setError('タスクの更新に失敗しました');
    }
  };

  const getPriorityChip = (task) => {
    if (!task.due_date) return null;
    
    const dueDate = parseISO(task.due_date);
    const daysLeft = differenceInDays(dueDate, new Date());
    
    if (task.completed) {
      return <Chip label="完了" color="success" size="small" icon={<CheckCircleIcon />} />;
    } else if (isPast(dueDate)) {
      return <Chip label="期限切れ" color="error" size="small" icon={<FlagIcon />} />;
    } else if (daysLeft <= 1) {
      return <Chip label="緊急" color="warning" size="small" icon={<TimeIcon />} />;
    } else if (daysLeft <= 3) {
      return <Chip label="今週" color="info" size="small" />;
    }
    return null;
  };

  const getCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TaskIcon color="primary" />
          タスク管理
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

      {/* Progress Overview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>進捗状況</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={getCompletionRate()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2">{getCompletionRate()}%</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {tasks.filter(task => task.completed).length} / {tasks.length} 完了
        </Typography>
      </Paper>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="タスクを検索..."
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
                <MenuItem value="pending">未完了</MenuItem>
                <MenuItem value="completed">完了</MenuItem>
                <MenuItem value="overdue">期限切れ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks List */}
      <Grid container spacing={3}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              opacity: task.completed ? 0.7 : 1,
              border: task.completed ? 'none' : undefined
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                    <Tooltip title={task.completed ? '完了済み' : '未完了'}>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleTaskComplete(task)}
                        sx={{ mt: -0.5 }}
                      >
                        {task.completed ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon />}
                      </IconButton>
                    </Tooltip>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 'bold',
                          textDecoration: task.completed ? 'line-through' : 'none'
                        }}
                      >
                        {task.title}
                      </Typography>
                    </Box>
                  </Box>
                  {getPriorityChip(task)}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {task.description}
                </Typography>

                {task.due_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      期限: {format(parseISO(task.due_date), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(task)}
                >
                  編集
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(task.id)}
                >
                  削除
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredTasks.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery || filterStatus !== 'all' ? '検索条件に一致するタスクがありません' : 'タスクがありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            右下の「+」ボタンから新しいタスクを作成しましょう
          </Typography>
        </Paper>
      )}

      {/* Task Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTask ? 'タスクを編集' : '新しいタスクを作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="タスク名"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="期限日時"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {editingTask && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox 
                      checked={completed} 
                      onChange={(e) => setCompleted(e.target.checked)} 
                    />
                    <Typography>完了済み</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '保存中...' : editingTask ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TaskManagement;
