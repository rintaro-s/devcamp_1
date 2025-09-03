import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
  Badge,
  IconButton,
  Collapse,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Event as EventIcon,
  Assignment as TaskIcon,
  Inventory as EquipmentIcon,
  AccountBalance as BudgetIcon,
  MenuBook as WikiIcon,
  Photo as AlbumIcon,
  Edit as DiaryIcon,
  Brush as WhiteboardIcon,
  EmojiEmotions as StampIcon,
  Group as UserIcon,
  Security as RoleIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  VolumeUp as AnnouncementIcon,
  Lock as PrivateIcon,
  Tag as TagIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Notifications as NotificationIcon,
  Circle as OnlineIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const drawerWidth = 280;

const Sidebar = ({ mobileOpen, handleDrawerToggle, currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    channels: true,
    management: true,
    content: true,
  });
  const [channels, setChannels] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  // 初期データの設定
  useEffect(() => {
    setChannels([
      { 
        id: 1, 
        name: '一般', 
        type: 'text', 
        unread: 3,
        description: 'メインの連絡チャンネル',
        isPrivate: false,
      },
      { 
        id: 2, 
        name: '重要連絡', 
        type: 'announcement', 
        unread: 1,
        description: '先生からの重要なお知らせ',
        isPrivate: false,
      },
      { 
        id: 3, 
        name: '雑談', 
        type: 'text', 
        unread: 0,
        description: '自由なおしゃべり',
        isPrivate: false,
      },
      { 
        id: 4, 
        name: '役員会議', 
        type: 'text', 
        unread: 2,
        description: '役員専用チャンネル',
        isPrivate: true,
      },
    ]);

    setOnlineUsers([
      { id: 1, name: '田中先生', status: 'online', role: '顧問' },
      { id: 2, name: '佐藤会長', status: 'online', role: '会長' },
      { id: 3, name: '鈴木副会長', status: 'away', role: '副会長' },
      { id: 4, name: '山田会計', status: 'busy', role: '会計' },
    ]);

    setNotifications([
      { id: 1, type: 'mention', count: 2 },
      { id: 2, type: 'event', count: 1 },
      { id: 3, type: 'task', count: 3 },
    ]);
  }, []);

  const mainMenuItems = [
    { text: 'ダッシュボード', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'チャット', icon: <ChatIcon />, path: '/chat', badge: notifications.find(n => n.type === 'mention')?.count },
  ];

  const managementItems = [
    { text: 'イベント管理', icon: <EventIcon />, path: '/events', badge: notifications.find(n => n.type === 'event')?.count },
    { text: 'タスク管理', icon: <TaskIcon />, path: '/tasks', badge: notifications.find(n => n.type === 'task')?.count },
    { text: '備品管理', icon: <EquipmentIcon />, path: '/equipments' },
    { text: '予算管理', icon: <BudgetIcon />, path: '/budgets' },
    { text: 'ユーザー管理', icon: <UserIcon />, path: '/users', adminOnly: true },
    { text: '役職管理', icon: <RoleIcon />, path: '/roles', adminOnly: true },
  ];

  const contentItems = [
    { text: 'Wiki', icon: <WikiIcon />, path: '/wiki' },
    { text: 'アルバム', icon: <AlbumIcon />, path: '/posts?type=album' },
    { text: '日記', icon: <DiaryIcon />, path: '/posts?type=diary' },
    { text: 'ホワイトボード', icon: <WhiteboardIcon />, path: '/whiteboards' },
    { text: 'スタンプ', icon: <StampIcon />, path: '/stamps' },
  ];

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const getChannelIcon = (channel) => {
    if (channel.type === 'announcement') {
      return <AnnouncementIcon />;
    }
    if (channel.isPrivate) {
      return <PrivateIcon />;
    }
    return <TagIcon />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#2eb67d';
      case 'away': return '#ecb22e';
      case 'busy': return '#e01e5a';
      default: return '#868686';
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      bgcolor: 'background.sidebar',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* サーバーヘッダー */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        bgcolor: 'rgba(0,0,0,0.2)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              桜高校生徒会
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {onlineUsers.filter(u => u.status === 'online').length}人がオンライン
            </Typography>
          </Box>
          
          <IconButton 
            size="small" 
            onClick={handleMenuOpen}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <MoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* メインナビゲーション */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ py: 1 }}>
          {/* メインメニュー */}
          {mainMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  color: isActiveRoute(item.path) ? 'white' : 'rgba(255,255,255,0.7)',
                  bgcolor: isActiveRoute(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'inherit',
                  minWidth: 36,
                }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActiveRoute(item.path) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />

          {/* チャンネル */}
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleSectionToggle('channels')}
              sx={{ 
                px: 2, 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              }}
            >
              <ListItemText 
                primary="チャンネル"
                primaryTypographyProps={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
              <IconButton size="small" sx={{ color: 'inherit' }}>
                <AddIcon fontSize="small" />
              </IconButton>
              {expandedSections.channels ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={expandedSections.channels} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <AnimatePresence>
                {channels.map((channel) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigation(`/chat?channel=${channel.id}`)}
                        sx={{
                          pl: 3,
                          mx: 1,
                          borderRadius: 1,
                          color: 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                            color: 'white',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          color: 'inherit',
                          minWidth: 32,
                        }}>
                          {getChannelIcon(channel)}
                        </ListItemIcon>
                        
                        <ListItemText 
                          primary={channel.name}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                          }}
                        />
                        
                        {channel.unread > 0 && (
                          <Chip
                            label={channel.unread}
                            size="small"
                            sx={{
                              bgcolor: '#e01e5a',
                              color: 'white',
                              fontSize: '0.6rem',
                              height: 18,
                              minWidth: 18,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          </Collapse>

          <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />

          {/* 管理機能 */}
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleSectionToggle('management')}
              sx={{ 
                px: 2, 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              }}
            >
              <ListItemText 
                primary="管理"
                primaryTypographyProps={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
              {expandedSections.management ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={expandedSections.management} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {managementItems.map((item) => {
                if (item.adminOnly && !currentUser?.is_teacher) return null;
                
                return (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        pl: 3,
                        mx: 1,
                        borderRadius: 1,
                        color: isActiveRoute(item.path) ? 'white' : 'rgba(255,255,255,0.7)',
                        bgcolor: isActiveRoute(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: 'inherit',
                        minWidth: 32,
                      }}>
                        {item.badge ? (
                          <Badge badgeContent={item.badge} color="error">
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>

          <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />

          {/* コンテンツ */}
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleSectionToggle('content')}
              sx={{ 
                px: 2, 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              }}
            >
              <ListItemText 
                primary="コンテンツ"
                primaryTypographyProps={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
              {expandedSections.content ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={expandedSections.content} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {contentItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      pl: 3,
                      mx: 1,
                      borderRadius: 1,
                      color: isActiveRoute(item.path) ? 'white' : 'rgba(255,255,255,0.7)',
                      bgcolor: isActiveRoute(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: 'inherit',
                      minWidth: 32,
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      {/* オンラインユーザー */}
      <Box sx={{ 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        bgcolor: 'rgba(0,0,0,0.2)',
        maxHeight: 200,
        overflow: 'auto',
      }}>
        <Box sx={{ p: 2 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            オンライン — {onlineUsers.filter(u => u.status === 'online').length}人
          </Typography>
          
          <List sx={{ py: 1 }}>
            {onlineUsers.map((user) => (
              <ListItem key={user.id} sx={{ px: 0, py: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <OnlineIcon 
                        sx={{ 
                          color: getStatusColor(user.status),
                          fontSize: 12,
                        }} 
                      />
                    }
                  >
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                      {user.name.charAt(0)}
                    </Avatar>
                  </Badge>
                  
                  <Box sx={{ ml: 1, flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                      noWrap
                    >
                      {user.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.6rem',
                      }}
                    >
                      {user.role}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* ユーザー情報 */}
      <Box sx={{ 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        bgcolor: 'rgba(0,0,0,0.3)',
        p: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ ml: 1, flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              noWrap
            >
              {currentUser?.username || 'ユーザー'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.7rem',
              }}
            >
              {currentUser?.is_teacher ? '先生' : '生徒'}
            </Typography>
          </Box>
          <Tooltip title="設定">
            <IconButton 
              size="small" 
              onClick={() => handleNavigation('/settings')}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* サーバーメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <NotificationIcon sx={{ mr: 1 }} fontSize="small" />
          通知設定
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
          サーバー設定
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          招待リンクを作成
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
