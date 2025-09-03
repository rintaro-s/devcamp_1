import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Typography,
  Avatar,
  Badge,
  Collapse,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  School,
  Chat,
  Assignment,
  Event,
  AccountBalance,
  Build,
  MenuBook,
  PhotoLibrary,
  Draw,
  EmojiEvents,
  People,
  Settings,
  ExpandLess,
  ExpandMore,
  Logout,
  Add,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../App';
import api from '../api';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setToken, token } = useAppContext();
  const muiTheme = useTheme();
  
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    management: false,
    admin: false,
  });
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [serverMenuAnchor, setServerMenuAnchor] = useState(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const data = await api.getServers(token);
      setServers(data);
      if (data.length > 0 && !selectedServer) {
        setSelectedServer(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    }
  };

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleServerSelect = (server) => {
    setSelectedServer(server);
    setServerMenuAnchor(null);
  };

  const mainMenuItems = [
    { icon: Dashboard, label: 'ダッシュボード', path: '/dashboard' },
    { icon: Chat, label: 'チャット', path: '/chat', badge: 3 },
    { icon: Assignment, label: 'タスク', path: '/tasks' },
    { icon: Event, label: 'イベント', path: '/events' },
    { icon: MenuBook, label: 'Wiki', path: '/wiki' },
    { icon: PhotoLibrary, label: '投稿', path: '/posts' },
  ];

  const managementItems = [
    { icon: Build, label: '備品管理', path: '/equipments' },
    { icon: AccountBalance, label: '予算管理', path: '/budgets' },
    { icon: Draw, label: 'ホワイトボード', path: '/whiteboards' },
    { icon: EmojiEvents, label: 'スタンプ', path: '/stamps' },
  ];

  const adminItems = [
    { icon: People, label: 'ユーザー管理', path: '/users' },
    { icon: Settings, label: '役職管理', path: '/roles' },
    { icon: School, label: 'サーバー管理', path: '/servers' },
  ];

  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha('#667eea', 0.1)} 0%, ${alpha('#764ba2', 0.1)} 100%)`,
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha('#667eea', 0.2)} 0%, ${alpha('#764ba2', 0.2)} 100%)`,
          borderBottom: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              mr: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <School />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Scdio
          </Typography>
        </Box>

        {/* Server Selector */}
        {selectedServer && (
          <Box
            sx={{
              p: 2,
              background: alpha(muiTheme.palette.background.paper, 0.7),
              borderRadius: 2,
              cursor: 'pointer',
              border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.2)}`,
            }}
            onClick={(e) => setServerMenuAnchor(e.currentTarget)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
                  <School sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedServer.name}
                  </Typography>
                  <Chip
                    label={selectedServer.template_type || 'サーバー'}
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 16 }}
                  />
                </Box>
              </Box>
              <ExpandMore sx={{ fontSize: 20 }} />
            </Box>
          </Box>
        )}

        <Menu
          anchorEl={serverMenuAnchor}
          open={Boolean(serverMenuAnchor)}
          onClose={() => setServerMenuAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 250,
              backdropFilter: 'blur(20px)',
              background: alpha(muiTheme.palette.background.paper, 0.9),
            },
          }}
        >
          {servers.map((server) => (
            <MenuItem
              key={server.id}
              onClick={() => handleServerSelect(server)}
              selected={selectedServer?.id === server.id}
            >
              <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'primary.main' }}>
                <School sx={{ fontSize: 16 }} />
              </Avatar>
              <Box>
                <Typography variant="body2">{server.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {server.template_type}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={() => navigate('/servers')}>
            <Add sx={{ mr: 2 }} />
            サーバーを管理
          </MenuItem>
        </Menu>
      </Box>

      {/* User Info */}
      <Box
        sx={{
          p: 2,
          background: alpha(muiTheme.palette.background.paper, 0.5),
          borderBottom: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#4CAF50',
                  border: '2px solid white',
                }}
              />
            }
          >
            <Avatar
              sx={{
                bgcolor: currentUser?.is_teacher ? 'secondary.main' : 'primary.main',
                mr: 2,
              }}
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {currentUser?.username}
            </Typography>
            <Chip
              label={currentUser?.is_teacher ? '管理者' : 'メンバー'}
              size="small"
              color={currentUser?.is_teacher ? 'secondary' : 'primary'}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{ color: 'text.secondary' }}
          >
            <Logout sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ py: 1 }}>
          {/* Main Section */}
          <ListItem sx={{ py: 0 }}>
            <ListItemButton
              onClick={() => handleSectionToggle('main')}
              sx={{
                borderRadius: 1,
                '&:hover': { backgroundColor: alpha(muiTheme.palette.primary.main, 0.1) },
              }}
            >
              <ListItemIcon>
                <Dashboard sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="メイン"
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              />
              {expandedSections.main ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={expandedSections.main} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {mainMenuItems.map((item) => (
                <ListItem key={item.path} sx={{ py: 0, pl: 2 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        backgroundColor: alpha(muiTheme.palette.primary.main, 0.15),
                        '&:hover': {
                          backgroundColor: alpha(muiTheme.palette.primary.main, 0.2),
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Badge badgeContent={item.badge} color="error">
                        <item.icon sx={{ fontSize: 20 }} />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          {/* Management Section */}
          <ListItem sx={{ py: 0 }}>
            <ListItemButton
              onClick={() => handleSectionToggle('management')}
              sx={{
                borderRadius: 1,
                '&:hover': { backgroundColor: alpha(muiTheme.palette.secondary.main, 0.1) },
              }}
            >
              <ListItemIcon>
                <Settings sx={{ color: 'secondary.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="管理"
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              />
              {expandedSections.management ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={expandedSections.management} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {managementItems.map((item) => (
                <ListItem key={item.path} sx={{ py: 0, pl: 2 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        backgroundColor: alpha(muiTheme.palette.secondary.main, 0.15),
                        '&:hover': {
                          backgroundColor: alpha(muiTheme.palette.secondary.main, 0.2),
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <item.icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          {/* Admin Section - Only for teachers */}
          {currentUser?.is_teacher && (
            <>
              <ListItem sx={{ py: 0 }}>
                <ListItemButton
                  onClick={() => handleSectionToggle('admin')}
                  sx={{
                    borderRadius: 1,
                    '&:hover': { backgroundColor: alpha(muiTheme.palette.error.main, 0.1) },
                  }}
                >
                  <ListItemIcon>
                    <People sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="管理者"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  />
                  {expandedSections.admin ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>

              <Collapse in={expandedSections.admin} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {adminItems.map((item) => (
                    <ListItem key={item.path} sx={{ py: 0, pl: 2 }}>
                      <ListItemButton
                        onClick={() => navigate(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                          borderRadius: 1,
                          '&.Mui-selected': {
                            backgroundColor: alpha(muiTheme.palette.error.main, 0.15),
                            '&:hover': {
                              backgroundColor: alpha(muiTheme.palette.error.main, 0.2),
                            },
                          },
                        }}
                      >
                        <ListItemIcon>
                          <item.icon sx={{ fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </>
          )}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(muiTheme.palette.divider, 0.1)}`,
          background: alpha(muiTheme.palette.background.paper, 0.3),
        }}
      >
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
          © 2024 Scdio Platform
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          border: 'none',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
