import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Typography, Grid, Card, CardContent, CardHeader, Button, IconButton,
  Avatar, Chip, LinearProgress, Skeleton, Alert, Divider, Paper, Fade, Badge,
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction,
  CircularProgress, useTheme, alpha, Tooltip, AvatarGroup, Stack,
  Container, Fab, SpeedDial, SpeedDialAction, InputAdornment, TextField
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, Task as TaskIcon, Event as EventIcon, 
  TrendingUp, TrendingDown, Group, Assignment, Notifications,
  Schedule, MonetizationOn, School, Chat, Add, MoreVert,
  CheckCircle, AccessTime, Warning, Done, DoneAll, PlayArrow,
  Analytics, CalendarToday, AttachMoney, Groups, Brightness4,
  Brightness7, Settings, Search, FilterList, Sort, Refresh,
  Speed, Edit, Share, Save, NotificationsActive
} from '@mui/icons-material';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, LineChart, Line, 
  AreaChart, Area, RadialBarChart, RadialBar 
} from 'recharts';
import { AppContext } from '../App';
import api from '../api';

const Dashboard = ({ currentUser }) => {
  const { theme, isDark, toggleTheme } = useContext(AppContext);
  const muiTheme = useTheme();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
    totalMembers: 0,
    activeBudget: 0,
    monthlyExpenses: 0
  });
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [taskProgress, setTaskProgress] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Use safe helper methods that attach token from localStorage when available
        const [tasksData, eventsData, activitiesData] = await Promise.all([
          api.getTasksWithToken().catch(() => []),
          api.getEventsWithToken().catch(() => []),
          api.getActivitiesWithToken().catch(() => [])
        ]);

        const normalize = (v) => Array.isArray(v) ? v : (v && Array.isArray(v.tasks) ? v.tasks : []);

        const tasksArr = normalize(tasksData);
        const eventsArr = normalize(eventsData);
        const activitiesArr = normalize(activitiesData);

        setTasks(tasksArr.slice(0, 8));
        setEvents(eventsArr.slice(0, 6));
        setActivities(activitiesArr.slice(0, 10));

        // Calculate statistics
        const completedCount = tasksArr.filter(task => task.completed).length;
        setStats({
          totalTasks: tasksArr.length,
          completedTasks: completedCount,
          upcomingEvents: eventsArr.filter(event => new Date(event.start_time) > new Date()).length,
          totalMembers: 234, // Mock data
          activeBudget: 3200000,
          monthlyExpenses: 485000
        });

        // Enhanced budget data for charts (static)
        setBudgetData([
          { month: '4月', budget: 400000, spent: 320000, savings: 80000 },
          { month: '5月', budget: 450000, spent: 380000, savings: 70000 },
          { month: '6月', budget: 420000, spent: 290000, savings: 130000 },
          { month: '7月', budget: 480000, spent: 410000, savings: 70000 },
          { month: '8月', budget: 520000, spent: 485000, savings: 35000 },
          { month: '9月', budget: 500000, spent: 320000, savings: 180000 }
        ]);

        // Task progress by category (static)
        setTaskProgress([
          { name: '学習管理', completed: 15, total: 22, color: '#667eea', percentage: 68 },
          { name: 'イベント企画', completed: 12, total: 15, color: '#f093fb', percentage: 80 },
          { name: '予算管理', completed: 8, total: 10, color: '#4facfe', percentage: 80 },
          { name: '設備管理', completed: 6, total: 9, color: '#43e97b', percentage: 67 },
          { name: '文書管理', completed: 10, total: 12, color: '#38f9d7', percentage: 83 }
        ]);

        // Performance data over time (static)
        setPerformanceData([
          { week: 'W1', tasks: 45, events: 8, budget: 85 },
          { week: 'W2', tasks: 52, events: 12, budget: 78 },
          { week: 'W3', tasks: 48, events: 15, budget: 82 },
          { week: 'W4', tasks: 65, events: 10, budget: 88 },
          { week: 'W5', tasks: 58, events: 18, budget: 91 },
          { week: 'W6', tasks: 72, events: 14, budget: 85 }
        ]);

        // Mock online users
        setOnlineUsers([
          { id: 1, name: '田中先生', avatar: '/avatars/tanaka.jpg', status: 'online', role: 'teacher' },
          { id: 2, name: '佐藤学', avatar: '/avatars/sato.jpg', status: 'online', role: 'student' },
          { id: 3, name: '鈴木美咲', avatar: '/avatars/suzuki.jpg', status: 'away', role: 'student' },
          { id: 4, name: '山田太郎', avatar: '/avatars/yamada.jpg', status: 'online', role: 'student' },
          { id: 5, name: '高橋花子', avatar: '/avatars/takahashi.jpg', status: 'busy', role: 'student' }
        ]);

      } catch (err) {
        setError('データの取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Stat cards configuration
  const statCards = [
    {
      title: 'タスク完了率',
      value: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
      suffix: '%',
      icon: TaskIcon,
      color: '#8B5CF6',
      trend: '+5%',
      trendUp: true
    },
    {
      title: '今月の予算消化',
      value: Math.round((stats.monthlyExpenses / stats.activeBudget) * 100),
      suffix: '%',
      icon: MonetizationOn,
      color: '#06D6A0',
      trend: '-2%',
      trendUp: false
    },
    {
      title: '活動メンバー数',
      value: stats.totalMembers,
      suffix: '人',
      icon: Group,
      color: '#FFD60A',
      trend: '+12',
      trendUp: true
    },
    {
      title: '今月のイベント',
      value: stats.upcomingEvents,
      suffix: '件',
      icon: EventIcon,
      color: '#FF6B6B',
      trend: '+3',
      trendUp: true
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="30%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              おかえりなさい、{currentUser?.username || 'ユーザー'}さん！
            </Typography>
            <Typography variant="body1" color="text.secondary">
              今日も学校活動を効率的に管理しましょう
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            新規作成
          </Button>
        </Box>
      </motion.div>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                sx={{
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark ? '0 10px 40px rgba(255, 255, 255, 0.1)' : '0 10px 40px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Avatar sx={{ bgcolor: card.color, width: 48, height: 48 }}>
                      <card.icon />
                    </Avatar>
                    <Chip
                      label={card.trend}
                      size="small"
                      color={card.trendUp ? 'success' : 'error'}
                      icon={card.trendUp ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    />
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {card.value}{card.suffix}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Task Progress Chart */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{ height: 400 }}>
              <CardHeader
                title="タスク進捗状況"
                subheader="カテゴリ別の完了状況"
                action={
                  <IconButton>
                    <MoreVert />
                  </IconButton>
                }
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={taskProgress}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="completed"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {taskProgress.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Budget Chart */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{ height: 400 }}>
              <CardHeader
                title="予算推移"
                subheader="月別の予算と支出"
                action={
                  <IconButton>
                    <MoreVert />
                  </IconButton>
                }
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '']} />
                    <Bar dataKey="budget" fill="#8B5CF6" name="予算" />
                    <Bar dataKey="spent" fill="#06D6A0" name="支出" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{ height: 450 }}>
              <CardHeader
                title="最近のタスク"
                subheader="進行中と完了済み"
                action={
                  <Button size="small" color="primary">
                    すべて表示
                  </Button>
                }
              />
              <CardContent sx={{ height: 350, overflow: 'auto' }}>
                <List>
                  {tasks.length > 0 ? tasks.map((task, index) => (
                    <ListItem key={task.id || index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: task.completed ? '#06D6A0' : '#FFD60A' }}>
                          {task.completed ? <Done /> : <AccessTime />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={task.title || `タスク ${index + 1}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              期限: {task.due_date ? new Date(task.due_date).toLocaleDateString('ja-JP') : '未設定'}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={task.completed ? 100 : task.progress || 0}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={task.completed ? '完了' : '進行中'}
                          size="small"
                          color={task.completed ? 'success' : 'warning'}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  )) : (
                    <Typography textAlign="center" color="text.secondary">
                      タスクがありません
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Activity Feed */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card sx={{ height: 450 }}>
              <CardHeader
                title="最近のアクティビティ"
                subheader="チーム全体の動き"
                action={
                  <Badge badgeContent={3} color="error">
                    <Notifications color="action" />
                  </Badge>
                }
              />
              <CardContent sx={{ height: 350, overflow: 'auto' }}>
                <List>
                  {activities.length > 0 ? activities.map((activity, index) => (
                    <ListItem key={index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#8B5CF6' }}>
                          {activity.user?.username?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description || `アクティビティ ${index + 1}`}
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {activity.timestamp ? new Date(activity.timestamp).toLocaleString('ja-JP') : '今'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )) : (
                    // Mock activities for demo
                    [
                      { user: { username: '田中先生' }, description: '新しいイベント「文化祭準備」を作成しました', timestamp: new Date() },
                      { user: { username: '佐藤' }, description: 'タスク「予算案作成」を完了しました', timestamp: new Date(Date.now() - 3600000) },
                      { user: { username: '鈴木' }, description: '設備「プロジェクター」の使用予約をしました', timestamp: new Date(Date.now() - 7200000) },
                      { user: { username: '山田' }, description: 'Wikiページ「活動規則」を更新しました', timestamp: new Date(Date.now() - 10800000) }
                    ].map((activity, index) => (
                      <ListItem key={index} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#8B5CF6' }}>
                            {activity.user.username[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {activity.timestamp.toLocaleString('ja-JP')}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader
                title="クイックアクション"
                subheader="よく使う機能へのショートカット"
              />
              <CardContent>
                <Grid container spacing={2}>
                  {[
                    { label: '新しいタスク', icon: Assignment, color: '#8B5CF6' },
                    { label: 'イベント作成', icon: EventIcon, color: '#06D6A0' },
                    { label: 'チャット', icon: Chat, color: '#FFD60A' },
                    { label: '設備予約', icon: Schedule, color: '#FF6B6B' },
                    { label: '予算管理', icon: MonetizationOn, color: '#8B5CF6' },
                    { label: '学習資料', icon: School, color: '#06D6A0' }
                  ].map((action, index) => (
                    <Grid item xs={6} sm={4} md={2} key={action.label}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 25px ${action.color}40`
                          }
                        }}
                      >
                        <Avatar sx={{ bgcolor: action.color, mx: 'auto', mb: 1 }}>
                          <action.icon />
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {action.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;