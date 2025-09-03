import { createTheme } from '@mui/material/styles';

// Discord/Slack風のダークテーマとライトテーマ
const baseTheme = {
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont', 
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
  },
};

// Light Theme (Slack風)
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#611f69', // Slack purple
      light: '#7b3f7d',
      dark: '#4a1a54',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#007a5a', // Slack green
      light: '#4db6ac',
      dark: '#00695c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
      sidebar: '#3f0e40',
      channel: '#f8f9fa',
      hover: '#f1f3f4',
    },
    text: {
      primary: '#1d1c1d',
      secondary: '#616061',
      disabled: '#868686',
    },
    divider: '#e1e5e9',
    success: {
      main: '#2eb67d',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ecb22e',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#e01e5a',
      light: '#f44336',
      dark: '#c62828',
    },
    info: {
      main: '#36c5f0',
      light: '#2196f3',
      dark: '#1565c0',
    },
  },
});

// Dark Theme (Discord風)
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#5865f2', // Discord blurple
      light: '#7289da',
      dark: '#4752c4',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#57f287', // Discord green
      light: '#3ba55d',
      dark: '#2d7d32',
      contrastText: '#000000',
    },
    background: {
      default: '#36393f',
      paper: '#2f3136',
      sidebar: '#202225',
      channel: '#36393f',
      hover: '#40444b',
    },
    text: {
      primary: '#dcddde',
      secondary: '#b9bbbe',
      disabled: '#72767d',
    },
    divider: '#40444b',
    success: {
      main: '#57f287',
      light: '#66bb6a',
      dark: '#2e7d32',
    },
    warning: {
      main: '#fee75c',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#ed4245',
      light: '#ef5350',
      dark: '#c62828',
    },
    info: {
      main: '#5865f2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
  },
});

// テーマセレクター
export const createAppTheme = (mode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export default lightTheme;
