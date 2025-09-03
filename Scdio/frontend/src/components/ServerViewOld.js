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
  Collapse
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
  Article as PostIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Routes, Route } from 'react-router-dom';
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
  const [selectedView, setSelectedView] = useState('general'); // 'general', 'tasks', 'events', etc.
  const [expandedCategories, setExpandedCategories] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } else {
        toast.error('サーバー情報の取得に失敗しました');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Fetch server error:', error);
      toast.error('ネットワークエラーが発生しました');
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
        
        // 最初のテキストチャンネルを選択
        if (data.categories.length > 0 && data.categories[0].channels.length > 0) {
          setSelectedChannel(data.categories[0].channels[0]);
        } else if (data.uncategorized_channels.length > 0) {
          setSelectedChannel(data.uncategorized_channels[0]);
        }
      }
    } catch (error) {
      console.error('Fetch channels error:', error);
      toast.error('チャンネル情報の取得に失敗しました');
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
        setMembers(data);
      }
    } catch (error) {
      console.error('Fetch members error:', error);
    }
  };

  useEffect(() => {
    if (serverId && token) {
      fetchServerInfo();
      fetchChannels();
      fetchMembers();
    }
  }, [serverId, token]);

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

  const renderChannelList = () => (
    <List dense>
      {/* カテゴリー付きチャンネル */}
      {channels.categories.map((category) => (
        <Box key={category.id}>
          <ListItemButton onClick={() => toggleCategory(category.id)}>
            <ListItemIcon>
              {expandedCategories[category.id] ? <ExpandLess /> : <ExpandMore />}
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
                    bgcolor: selectedChannel?.id === channel.id ? 'action.selected' : 'transparent'
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
                bgcolor: selectedChannel?.id === channel.id ? 'action.selected' : 'transparent'
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
      <ListItem>
        <Typography variant="subtitle2" color="text.secondary">
          メンバー — {members.length}
        </Typography>
      </ListItem>
      {members.map((member) => (
        <ListItem key={member.id} sx={{ py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(member.status),
                    border: '2px solid',
                    borderColor: 'background.paper'
                  }}
                />
              }
            >
              <Avatar
                src={member.avatar_url}
                sx={{ width: 32, height: 32 }}
              >
                {member.username.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary={member.username}
            primaryTypographyProps={{ fontSize: '14px' }}
          />
        </ListItem>
      ))}
    </List>
  );

  if (!server) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* サーバーサイドバー */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: darkMode ? '#2f3136' : '#f6f6f6',
            borderRight: 'none'
          },
        }}
      >
        {/* サーバーヘッダー */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: darkMode ? '#27292d' : '#ffffff'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar
                src={server.icon_url}
                sx={{ width: 32, height: 32, mr: 1 }}
              >
                {server.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" noWrap>
                {server.name}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {/* チャンネル一覧 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {renderChannelList()}
        </Box>

        {/* ユーザー情報 */}
        <Box
          sx={{
            p: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: darkMode ? '#292b2f' : '#eeeef0'
          }}
        >
          <Box display="flex" alignItems="center">
            <Avatar
              src={currentUser?.avatar_url}
              sx={{ width: 32, height: 32, mr: 1 }}
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1}>
              <Typography variant="body2" fontWeight="bold">
                {currentUser?.username}
              </Typography>
            </Box>
            <IconButton size="small">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      {/* メインコンテンツエリア */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* チャンネルヘッダー */}
        <AppBar
          position="static"
          color="default"
          elevation={1}
          sx={{ bgcolor: darkMode ? '#36393f' : '#ffffff' }}
        >
          <Toolbar variant="dense">
            <Box display="flex" alignItems="center">
              {selectedChannel && getChannelIcon(selectedChannel.type)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {selectedChannel ? selectedChannel.name : 'チャンネルを選択してください'}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <IconButton>
                <NotificationIcon />
              </IconButton>
              <IconButton>
                <PeopleIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* チャットエリア */}
        <Box sx={{ flex: 1, display: 'flex' }}>
          <Box sx={{ flex: 1 }}>
            {selectedChannel ? (
              <ChatView
                channel={selectedChannel}
                token={token}
                currentUser={currentUser}
              />
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <Typography variant="h6" color="text.secondary">
                  チャンネルを選択してください
                </Typography>
              </Box>
            )}
          </Box>

          {/* メンバーサイドバー */}
          <Drawer
            variant="permanent"
            anchor="right"
            sx={{
              width: MEMBER_DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: MEMBER_DRAWER_WIDTH,
                boxSizing: 'border-box',
                bgcolor: darkMode ? '#2f3136' : '#f6f6f6',
                borderLeft: 'none',
                position: 'relative',
                height: 'auto'
              },
            }}
          >
            {renderMemberList()}
          </Drawer>
        </Box>
      </Box>

      {/* サーバーメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => navigate('/dashboard')}>
          <ListItemIcon>
            <ExitIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>サーバーを離れる</ListItemText>
        </MenuItem>
      </Menu>

      {/* チャンネル作成ダイアログ */}
      <Dialog open={createChannelOpen} onClose={() => setCreateChannelOpen(false)}>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateChannelOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleCreateChannel} variant="contained">
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerView;
