import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Collapse,
  Paper
} from '@mui/material';
import {
  Tag as TagIcon,
  VolumeUp as VoiceIcon,
  Announcement as AnnouncementIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  ExitToApp as ExitIcon,
  Notifications as NotificationIcon,
  Assignment as TaskIcon,
  Event as EventIcon,
  MenuBook as WikiIcon,
  AccountBalance as BudgetIcon,
  Engineering as EquipmentIcon,
  Article as PostIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../api';
import { useAppContext } from '../App';

// サーバー内コンポーネントのインポート
import ChatView from './ChatView';
import TaskManagement from './TaskManagement';
import EventManagement from './EventManagement';
import WikiManagement from './WikiManagement';
import BudgetManagement from './BudgetManagement';
import EquipmentManagement from './EquipmentManagement';
import PostManagement from './PostManagement';

const DRAWER_WIDTH = 240;
const MEMBER_DRAWER_WIDTH = 200;

const ServerView = ({ token, currentUser }) => {
  const { serverId, '*': subPath } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useAppContext();
  
  const [server, setServer] = useState(null);
  const [channels, setChannels] = useState({ categories: [], uncategorized_channels: [] });
  const [members, setMembers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'channel', 'tasks', 'events', etc.
  const [expandedCategories, setExpandedCategories] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // サーバー内のメニュー項目
  const serverMenuItems = [
    { id: 'overview', label: 'サーバー概要', icon: HomeIcon },
    { id: 'tasks', label: 'タスク管理', icon: TaskIcon },
    { id: 'events', label: 'イベント管理', icon: EventIcon },
    { id: 'wiki', label: 'Wiki', icon: WikiIcon },
    { id: 'budgets', label: '予算管理', icon: BudgetIcon },
    { id: 'equipment', label: '設備管理', icon: EquipmentIcon },
    { id: 'posts', label: '掲示板', icon: PostIcon },
  ];

  // サーバー情報を取得
  const fetchServerInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServer(data);
      } else if (response.status === 403) {
        toast.error('このサーバーにアクセスする権限がありません');
        navigate('/servers');
      } else {
        toast.error('サーバー情報の取得に失敗しました');
        navigate('/servers');
      }
    } catch (error) {
      console.error('Fetch server error:', error);
      toast.error('ネットワークエラーが発生しました');
      navigate('/servers');
    }
  };

  // チャンネル一覧を取得
  const fetchChannels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/channels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(data);
        
        // 最初のテキストチャンネルを選択（チャンネルビューの場合）
        if (selectedView === 'channel' && !selectedChannel) {
          if (data.categories.length > 0 && data.categories[0].channels.length > 0) {
            setSelectedChannel(data.categories[0].channels[0]);
          } else if (data.uncategorized_channels.length > 0) {
            setSelectedChannel(data.uncategorized_channels[0]);
          }
        }
      }
    } catch (error) {
      console.error('Fetch channels error:', error);
    }
  };

  // メンバー一覧を取得
  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch members error:', error);
      setMembers([]);
    }
  };

  useEffect(() => {
    if (serverId && token) {
      setLoading(true);
      Promise.all([
        fetchServerInfo(),
        fetchChannels(),
        fetchMembers()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [serverId, token]);

  // URL パスに基づいてビューを設定
  useEffect(() => {
    if (subPath) {
      const pathParts = subPath.split('/');
      const viewType = pathParts[0];
      
      if (viewType === 'channels' && pathParts[1]) {
        setSelectedView('channel');
        // チャンネルIDから該当チャンネルを検索して設定
        const channelId = parseInt(pathParts[1]);
        const allChannels = [
          ...channels.uncategorized_channels,
          ...channels.categories.flatMap(cat => cat.channels)
        ];
        const channel = allChannels.find(ch => ch.id === channelId);
        if (channel) {
          setSelectedChannel(channel);
        }
      } else if (serverMenuItems.find(item => item.id === viewType)) {
        setSelectedView(viewType);
      } else {
        setSelectedView('overview');
      }
    } else {
      setSelectedView('overview');
    }
  }, [subPath, channels]);

  // カテゴリーの展開/折りたたみ
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // チャンネル選択
  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setSelectedView('channel');
    navigate(`/servers/${serverId}/channels/${channel.id}`);
  };

  // メニュー項目選択
  const handleMenuSelect = (menuId) => {
    setSelectedView(menuId);
    navigate(`/servers/${serverId}/${menuId}`);
  };

  // チャンネルアイコンを取得
  const getChannelIcon = (type) => {
    switch (type) {
      case 'voice':
        return <VoiceIcon />;
      case 'announcement':
        return <AnnouncementIcon />;
      default:
        return <TagIcon />;
    }
  };

  // ユーザーステータスの色を取得
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#43b581';
      case 'idle':
        return '#faa61a';
      case 'dnd':
        return '#f04747';
      default:
        return '#747f8d';
    }
  };

  // チャンネル作成
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error('チャンネル名を入力してください');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newChannelName,
          type: newChannelType,
          category_id: selectedCategory?.id
        })
      });

      if (response.ok) {
        toast.success('チャンネルを作成しました');
        setCreateChannelOpen(false);
        setNewChannelName('');
        fetchChannels();
      } else {
        const error = await response.json();
        toast.error(error.error || 'チャンネルの作成に失敗しました');
      }
    } catch (error) {
      console.error('Create channel error:', error);
      toast.error('ネットワークエラーが発生しました');
    }
  };

  // サーバー概要コンポーネント
  const ServerOverview = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {server?.name} へようこそ
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {server?.description || 'このサーバーの説明はありません。'}
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          サーバー情報
        </Typography>
        <Typography variant="body2" gutterBottom>
          メンバー数: {server?.member_count || 0}人
        </Typography>
        <Typography variant="body2" gutterBottom>
          作成日: {server?.created_at ? new Date(server.created_at).toLocaleDateString('ja-JP') : '-'}
        </Typography>
        <Typography variant="body2">
          招待コード: {server?.invite_code || '-'}
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom>
        利用できる機能
      </Typography>
      <List>
        {serverMenuItems.filter(item => item.id !== 'overview').map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => handleMenuSelect(item.id)}
            sx={{ borderRadius: 1, mb: 1 }}
          >
            <ListItemIcon>
              <item.icon />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  // メインコンテンツのレンダリング
  const renderMainContent = () => {
    switch (selectedView) {
      case 'channel':
        return selectedChannel ? (
          <ChatView 
            token={token} 
            currentUser={currentUser} 
            channel={selectedChannel}
            serverId={serverId}
          />
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              チャンネルを選択してください
            </Typography>
          </Box>
        );
      case 'tasks':
        return <TaskManagement token={token} currentUser={currentUser} serverId={serverId} />;
      case 'events':
        return <EventManagement token={token} currentUser={currentUser} serverId={serverId} />;
      case 'wiki':
        return <WikiManagement token={token} currentUser={currentUser} serverId={serverId} />;
      case 'budgets':
        return <BudgetManagement token={token} currentUser={currentUser} serverId={serverId} />;
      case 'equipment':
        return <EquipmentManagement token={token} currentUser={currentUser} serverId={serverId} />;
      case 'posts':
        return <PostManagement token={token} currentUser={currentUser} serverId={serverId} />;
      case 'overview':
      default:
        return <ServerOverview />;
    }
  };

  const renderChannelList = () => (
    <List dense>
      {/* カテゴリー付きチャンネル */}
      {channels.categories.map((category) => (
        <Box key={category.id}>
          <ListItemButton onClick={() => toggleCategory(category.id)}>
            <ListItemIcon>
              {expandedCategories[category.id] !== false ? <ExpandLess /> : <ExpandMore />}
            </ListItemIcon>
            <ListItemText
              primary={category.name.toUpperCase()}
              primaryTypographyProps={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'text.secondary'
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategory(category);
                setCreateChannelOpen(true);
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
          
          <Collapse in={expandedCategories[category.id] !== false} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {category.channels.map((channel) => (
                <ListItemButton
                  key={channel.id}
                  sx={{ 
                    pl: 4,
                    bgcolor: selectedChannel?.id === channel.id && selectedView === 'channel' ? 'action.selected' : 'transparent'
                  }}
                  onClick={() => handleChannelSelect(channel)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getChannelIcon(channel.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={channel.name}
                    primaryTypographyProps={{ fontSize: '14px' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </Box>
      ))}

      {/* カテゴリーなしチャンネル */}
      {channels.uncategorized_channels.length > 0 && (
        <Box>
          <Divider sx={{ my: 1 }} />
          {channels.uncategorized_channels.map((channel) => (
            <ListItemButton
              key={channel.id}
              sx={{
                bgcolor: selectedChannel?.id === channel.id && selectedView === 'channel' ? 'action.selected' : 'transparent'
              }}
              onClick={() => handleChannelSelect(channel)}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {getChannelIcon(channel.type)}
              </ListItemIcon>
              <ListItemText
                primary={channel.name}
                primaryTypographyProps={{ fontSize: '14px' }}
              />
            </ListItemButton>
          ))}
        </Box>
      )}
    </List>
  );

  const renderMemberList = () => (
    <List dense>
      <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
        メンバー — {members.length}
      </Typography>
      {members.map((member) => (
        <ListItem key={member.user_id} sx={{ py: 0.5, px: 2 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              mr: 1,
              border: `2px solid ${getStatusColor(member.status || 'offline')}`
            }}
          >
            {member.username?.charAt(0).toUpperCase()}
          </Avatar>
          <ListItemText
            primary={member.username || member.user?.username}
            primaryTypographyProps={{ fontSize: '14px' }}
          />
        </ListItem>
      ))}
    </List>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (!server) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>サーバーが見つかりません</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* メインサイドバー（チャンネル & サーバー機能） */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: darkMode ? '#2f3136' : '#f6f6f6'
          },
        }}
      >
        {/* サーバーヘッダー */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton onClick={() => navigate('/servers')} size="small">
              <BackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
              {server.name}
            </Typography>
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {/* サーバー機能メニュー */}
        <Box sx={{ p: 1 }}>
          <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', textTransform: 'uppercase' }}>
            サーバー機能
          </Typography>
          <List dense>
            {serverMenuItems.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleMenuSelect(item.id)}
                sx={{ 
                  borderRadius: 1,
                  bgcolor: selectedView === item.id ? 'action.selected' : 'transparent'
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '14px' }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Divider />

        {/* チャンネル一覧 */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', textTransform: 'uppercase' }}>
              チャンネル
            </Typography>
            {renderChannelList()}
          </Box>
        </Box>
      </Drawer>

      {/* メインコンテンツエリア */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* トップバー */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: darkMode ? '#36393f' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedView === 'channel' && selectedChannel 
                ? `# ${selectedChannel.name}`
                : serverMenuItems.find(item => item.id === selectedView)?.label || 'サーバー概要'
              }
            </Typography>
            <IconButton color="inherit">
              <NotificationIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* コンテンツエリア */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'background.default' }}>
          {renderMainContent()}
        </Box>
      </Box>

      {/* メンバーサイドバー */}
      {selectedView === 'channel' && (
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: MEMBER_DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: MEMBER_DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: darkMode ? '#2f3136' : '#f6f6f6'
            },
          }}
        >
          {renderMemberList()}
        </Drawer>
      )}

      {/* チャンネル作成ダイアログ */}
      <Dialog open={createChannelOpen} onClose={() => setCreateChannelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新しいチャンネルを作成</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="チャンネル名"
            fullWidth
            variant="outlined"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="チャンネルタイプ"
            fullWidth
            variant="outlined"
            value={newChannelType}
            onChange={(e) => setNewChannelType(e.target.value)}
            SelectProps={{
              native: true,
            }}
          >
            <option value="text">テキスト</option>
            <option value="voice">ボイス</option>
            <option value="announcement">アナウンス</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateChannelOpen(false)}>キャンセル</Button>
          <Button onClick={handleCreateChannel} variant="contained">作成</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerView;
