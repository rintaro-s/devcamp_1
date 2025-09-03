import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd,
  School,
  Groups,
  Chat,
} from '@mui/icons-material';
import { useAppContext } from '../App';
import api from '../api';

const LoginPage = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { darkMode, toggleTheme } = useAppContext();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await api.login({ username, password });
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーまたはサーバーがダウンしています');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: darkMode
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${alpha('#00f5ff', 0.1)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${alpha('#ff00aa', 0.1)} 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, ${alpha('#ffaa00', 0.1)} 0%, transparent 50%)`,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card
            sx={{
              backdropFilter: 'blur(20px)',
              background: darkMode
                ? alpha('#1a1a1a', 0.8)
                : alpha('#ffffff', 0.9),
              border: `1px solid ${alpha('#ffffff', 0.2)}`,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box textAlign="center" mb={4}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      mb: 2,
                    }}
                  >
                    <School sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                </motion.div>
                
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    background: darkMode
                      ? 'linear-gradient(45deg, #667eea, #764ba2)'
                      : 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Scdio
                </Typography>
                
                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                  学習コミュニティプラットフォーム
                </Typography>

                {/* Feature Icons */}
                <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 3 }}>
                  <Box textAlign="center">
                    <Groups sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="caption" display="block">
                      グループ学習
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Chat sx={{ fontSize: 32, color: theme.palette.secondary.main, mb: 1 }} />
                    <Typography variant="caption" display="block">
                      リアルタイムチャット
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <School sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
                    <Typography variant="caption" display="block">
                      学習管理
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Login Form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Stack spacing={3}>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {error}
                      </Alert>
                    </motion.div>
                  )}

                  <TextField
                    fullWidth
                    type="text"
                    label="ユーザー名またはメールアドレス"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                            aria-label="toggle password visibility"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<LoginIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                      },
                    }}
                  >
                    {loading ? 'ログイン中...' : 'ログイン'}
                  </Button>
                </Stack>
              </motion.form>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  または
                </Typography>
              </Divider>

              {/* Register Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<PersonAdd />}
                  component="a"
                  href="/register"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      background: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  新規アカウント作成
                </Button>
              </motion.div>

              {/* Theme Toggle */}
              <Box textAlign="center" mt={3}>
                <Button
                  variant="text"
                  size="small"
                  onClick={toggleTheme}
                  sx={{ color: 'text.secondary' }}
                >
                  {darkMode ? '🌙 ダークモード' : '☀️ ライトモード'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginPage;
