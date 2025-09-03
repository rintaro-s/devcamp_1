import React from 'react';
import { Box, Toolbar } from '@mui/material';

const MainContent = ({ children }) => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: { sm: 'calc(100% - 240px)' },
        ml: { sm: '240px' },
      }}
    >
      <Toolbar />
      {children}
    </Box>
  );
};

export default MainContent;
