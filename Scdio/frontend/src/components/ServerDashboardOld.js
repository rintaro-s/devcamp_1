import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  IconButton,
  Chip,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Container
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitIcon,
  ContentCopy as CopyIcon,
  School as SchoolIcon,
  SportsEsports as GamingIcon,
  Work as WorkIcon,
  Lightbulb as CreativeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { API_BASE_URL } from '../api';
import { useAppContext } from '../App';

const ServerDashboard = ({ token, currentUser }) => {
  const navigate = useNavigate();
  const { darkMode } = useAppContext();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerDescription, setNewServerDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedServer, setSelectedServer] = useState(null);
  const [serverDetailsOpen, setServerDetailsOpen] = useState(false);

  // サーバー一覧を取得
  const fetchServers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/servers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch servers:', response.status);
        setServers([]);
      }
    } catch (error) {
      console.error('Fetch servers error:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [token]);

  // サーバー作成
  const handleCreateServer = async () => {
    if (!newServerName.trim()) {
      toast.error('サーバー名を入力してください');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newServerName);
      formData.append('description', newServerDescription);

      const response = await fetch(`${API_BASE_URL}/servers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const newServer = await response.json();
        toast.success('サーバーを作成しました');
        setServers([...servers, newServer]);
        setCreateDialogOpen(false);
        setNewServerName('');
        setNewServerDescription('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'サーバーの作成に失敗しました');
      }
    } catch (error) {
      console.error('Create server error:', error);
      toast.error('ネットワークエラーが発生しました');
    }
  };

  // サーバー参加
  const handleJoinServer = async () => {
    if (!inviteCode.trim()) {
      toast.error('招待コードを入力してください');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/servers/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inviteCode })
      });

      if (response.ok) {
        const joinedServer = await response.json();
        toast.success('サーバーに参加しました');
        setServers([...servers, joinedServer]);
        setJoinDialogOpen(false);
        setInviteCode('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'サーバーへの参加に失敗しました');
      }
    } catch (error) {
      console.error('Join server error:', error);
      toast.error('ネットワークエラーが発生しました');
    }
  };

  // サーバー詳細表示
  const handleShowServerDetails = (server) => {
    setSelectedServer(server);
    setServerDetailsOpen(true);
  };

  // 招待コードコピー
  const handleCopyInviteCode = (inviteCode) => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('招待コードをコピーしました');
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ bgcolor: darkMode ? '#36393f' : '#f8f9fa' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // サーバー未参加時の画面
  if (servers.length === 0) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: darkMode ? '#36393f' : '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 2 }}
            >
              コミュニティに参加しよう！
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              paragraph
              sx={{ mb: 4 }}
            >
              サーバーを作成するか、招待コードで既存のサーバーに参加してください。
              <br />
              各サーバーでタスク管理、イベント企画、チャットなどの機能を利用できます。
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 6 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a67d8 30%, #6b4596 90%)',
                  }
                }}
              >
                サーバーを作成
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => setJoinDialogOpen(true)}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  }
                }}
              >
                サーバーに参加
              </Button>
            </Box>

            <Grid container spacing={3} sx={{ mt: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: darkMode ? '#2f3136' : '#ffffff',
                    border: '1px solid',
                    borderColor: darkMode ? '#40444b' : '#e0e0e0'
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    学習コミュニティ
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    課題管理、勉強会の企画、知識の共有などができます
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: darkMode ? '#2f3136' : '#ffffff',
                    border: '1px solid',
                    borderColor: darkMode ? '#40444b' : '#e0e0e0'
                  }}
                >
                  <WorkIcon sx={{ fontSize: 48, color: '#43e97b', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    部活動・サークル
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    活動計画、予算管理、設備予約などを効率的に行えます
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    bgcolor: darkMode ? '#2f3136' : '#ffffff',
                    border: '1px solid',
                    borderColor: darkMode ? '#40444b' : '#e0e0e0'
                  }}
                >
                  <CreativeIcon sx={{ fontSize: 48, color: '#f093fb', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    創作・プロジェクト
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    アイデアの共有、進捗管理、コラボレーションが簡単に
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    );
  }

  // サーバー参加済みの場合の表示
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: darkMode ? '#36393f' : '#f8f9fa',
        p: 3
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              あなたのサーバー
            </Typography>
            <Typography variant="body1" color="text.secondary">
              参加中のサーバー一覧です。サーバーを選択して活動を開始しましょう。
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              サーバー作成
            </Button>
            <Button
              variant="outlined"
              onClick={() => setJoinDialogOpen(true)}
            >
              サーバー参加
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {servers.map((server) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={server.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => navigate(`/servers/${server.id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        mr: 2, 
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                        fontSize: '1.5rem'
                      }}
                    >
                      {server.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        component="h3"
                        sx={{ 
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {server.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {server.description || 'サーバーの説明がありません'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${server.member_count || 0}人`}
                      size="small"
                      variant="outlined"
                      sx={{ bgcolor: 'background.paper' }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowServerDetails(server);
                      }}
                      sx={{ 
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );

      {/* サーバー作成ダイアログ */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新しいサーバーを作成</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="サーバー名"
            fullWidth
            variant="outlined"
            value={newServerName}
            onChange={(e) => setNewServerName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="サーバーの説明（任意）"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newServerDescription}
            onChange={(e) => setNewServerDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleCreateServer} variant="contained">作成</Button>
        </DialogActions>
      </Dialog>

      {/* サーバー参加ダイアログ */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>サーバーに参加</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="招待コード"
            fullWidth
            variant="outlined"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="例: ABC123"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleJoinServer} variant="contained">参加</Button>
        </DialogActions>
      </Dialog>

      {/* サーバー詳細ダイアログ */}
      <Dialog open={serverDetailsOpen} onClose={() => setServerDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {selectedServer?.name?.charAt(0).toUpperCase()}
            </Avatar>
            {selectedServer?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedServer && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedServer.description || 'サーバーの説明がありません'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  招待コード:
                </Typography>
                <Chip
                  label={selectedServer.invite_code}
                  size="small"
                  onClick={() => handleCopyInviteCode(selectedServer.invite_code)}
                  icon={<ContentCopyIcon />}
                  clickable
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                作成日: {selectedServer.created_at ? new Date(selectedServer.created_at).toLocaleDateString('ja-JP') : '-'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServerDetailsOpen(false)}>閉じる</Button>
          <Button
            onClick={() => {
              if (selectedServer) {
                navigate(`/servers/${selectedServer.id}`);
                setServerDetailsOpen(false);
              }
            }}
            variant="contained"
          >
            サーバーに入る
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerDashboard;