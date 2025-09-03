import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
  Card,
  CardContent,
  useTheme,
  alpha,
  Stack,
  MenuItem,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  PersonAdd,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  School,
  Groups,
  Chat,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAppContext } from '../App';
import api from '../api';

const RegisterPage = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { darkMode, toggleTheme } = useAppContext();
  const theme = useTheme();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      setLoading(false);
      return;
    }

    try {
      const data = await api.register({ 
        username, 
        email, 
        password, 
        enrollment_year: enrollmentYear || null, 
        is_teacher: isTeacher 
      });
      
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setMessage('アカウント作成が完了しました！ログインしています...');
        setError('');
      } else {
        setError(data.error || 'アカウント作成に失敗しました');
        setMessage('');
      }
    } catch (err) {
      setError('ネットワークエラーまたはサーバーがダウンしています');
      setMessage('');
    } finally {
      setLoading(false);
    }
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
        py: 3,
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
                    <PersonAdd sx={{ fontSize: 40, color: 'white' }} />
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
                  アカウント作成
                </Typography>
                
                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                  Scdioコミュニティに参加しよう
                </Typography>
              </Box>

              {/* Register Form */}
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

                  {message && (
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        {message}
                      </Alert>
                    </motion.div>
                  )}

                  <TextField
                    fullWidth
                    label="ユーザー名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    type="email"
                    label="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="パスワード確認"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    select
                    label="入学年度（任意）"
                    value={enrollmentYear}
                    onChange={(e) => setEnrollmentYear(e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem value="">選択しない</MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}年度
                      </MenuItem>
                    ))}
                  </TextField>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isTeacher}
                        onChange={(e) => setIsTeacher(e.target.checked)}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AdminPanelSettings sx={{ fontSize: 20 }} />
                        <Typography variant="body2">
                          先生・管理者として登録
                        </Typography>
                      </Box>
                    }
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<PersonAdd />}
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
                    {loading ? 'アカウント作成中...' : 'アカウント作成'}
                  </Button>
                </Stack>
              </motion.form>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  または
                </Typography>
              </Divider>

              {/* Login Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<LoginIcon />}
                  component="a"
                  href="/login"
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
                  既にアカウントをお持ちの方はこちら
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

export default RegisterPage;
