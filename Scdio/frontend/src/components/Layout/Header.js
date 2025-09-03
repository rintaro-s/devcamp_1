import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle'; // For user icon
import { useLocation } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
      case '/':
        return 'Dashboard';
      case '/equipments':
        return 'Equipment Management';
      case '/budgets':
        return 'Budget Management';
      case '/events':
        return 'Event Management';
      case '/tasks':
        return 'Task Management';
      case '/wiki':
        return 'Wiki';
      case '/posts':
        return 'Posts';
      case '/whiteboards':
        return 'Whiteboards';
      case '/stamps':
        return 'Stamp Management';
      case '/roles':
        return 'Role Management';
      case '/users':
        return 'User Management';
      case '/chat':
        return 'Chat';
      default:
        if (location.pathname.startsWith('/wiki/')) return 'Wiki Page';
        if (location.pathname.startsWith('/posts/')) return 'Post Detail';
        if (location.pathname.startsWith('/whiteboards/')) return 'Whiteboard';
        return 'Scdio Platform';
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {getTitle()}
        </Typography>
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
