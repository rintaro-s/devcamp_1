import React, { useContext } from 'react';
import { Box, CssBaseline, useMediaQuery } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Sidebar from './Sidebar';
import { AppContext } from '../App';

const Layout = ({ children, currentUser }) => {
  const { theme } = useContext(AppContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <Sidebar currentUser={currentUser} isMobile={isMobile} />
        
        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            backgroundColor: theme.palette.background.default,
            marginLeft: isMobile ? 0 : '240px', // Adjust based on sidebar width
            transition: theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
