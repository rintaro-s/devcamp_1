import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Alert,
  Stack,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  School,
  People,
  Settings,
  Delete,
  PersonAdd,
  AdminPanelSettings,
  ContentCopy,
  ExitToApp,
  WorkspacePremium,
  Groups,
  Chat,
  EventNote,
  Assignment,
} from '@mui/icons-material';
import { useAppContext } from '../App';
import api from '../api';
import { toast } from 'react-toastify';

const ServerManagement = () => {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [serverMembers, setServerMembers] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const { token, currentUser } = useAppContext();
  const theme = useTheme();

  const [newServer, setNewServer] = useState({
    name: '',
    description: '',
    server_type: 'school',
    template_type: '',
  });

  const serverTemplates = [
    { value: '高校生徒会', label: '高校生徒会', icon: '🏫' },
    { value: '中学生徒会', label: '中学生徒会', icon: '🏫' },
    { value: '部活動', label: '部活動', icon: '⚽' },
    { value: 'サークル', label: 'サークル', icon: '🎭' },
    { value: 'クラス', label: 'クラス', icon: '📚' },
    { value: '委員会', label: '委員会', icon: '📋' },
    { value: '研究室', label: '研究室', icon: '🔬' },
    { value: 'その他', label: 'その他', icon: '🏢' },
  ];

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const data = await api.getServers(token);
      setServers(data);
    } catch (error) {
      toast.error('サーバー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async () => {
    try {
      const data = await api.createServer(newServer, token);
      setServers([...servers, data]);
      setCreateDialogOpen(false);
      setNewServer({ name: '', description: '', server_type: 'school', template_type: '' });
      toast.success(`サーバー「${data.name}」を作成しました！`);
    } catch (error) {
      toast.error('サーバーの作成に失敗しました');
    }
  };

  const handleJoinServer = async () => {
    try {
      const data = await api.joinServer(inviteCode, token);
      setServers([...servers, data.server]);
      setJoinDialogOpen(false);
      setInviteCode('');
      toast.success(`サーバー「${data.server.name}」に参加しました！`);
    } catch (error) {
      toast.error('サーバーへの参加に失敗しました');
    }
  };

  const fetchServerMembers = async (serverId) => {
    try {
      const data = await api.getServerMembers(serverId, token);
      setServerMembers(data);
    } catch (error) {
      toast.error('メンバー一覧の取得に失敗しました');
    }
  };

  const handleShowMembers = (server) => {
    setSelectedServer(server);
    fetchServerMembers(server.id);
    setMembersDialogOpen(true);
  };

  const handlePromoteUser = async (userId) => {
    try {
      await api.promoteUser(selectedServer.id, userId, token);
      fetchServerMembers(selectedServer.id);
      toast.success('ユーザーを管理者に昇格させました');
    } catch (error) {
      toast.error('昇格処理に失敗しました');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.removeMember(selectedServer.id, userId, token);
      fetchServerMembers(selectedServer.id);
      toast.success('メンバーを削除しました');
    } catch (error) {
      toast.error('メンバー削除に失敗しました');
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('招待コードをコピーしました！');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>読み込み中...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <School sx={{ mr: 2, fontSize: 40, verticalAlign: 'middle' }} />
            サーバー管理
          </Typography>
          <Typography variant="body1" color="textSecondary">
            学習コミュニティを作成・管理しましょう
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            新しいサーバーを作成
          </Button>
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => setJoinDialogOpen(true)}
          >
            サーバーに参加
          </Button>
        </Stack>

        {/* Servers Grid */}
        <Grid container spacing={3}>
          {servers.map((server) => (
            <Grid item xs={12} md={6} lg={4} key={server.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    backdropFilter: 'blur(20px)',
                    background: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: 3,
                    '&:hover': {
                      boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 56,
                          height: 56,
                          mr: 2,
                        }}
                      >
                        <School />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h2">
                          {server.name}
                        </Typography>
                        <Chip
                          label={server.template_type || server.server_type}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      {server.owner_id === currentUser.id && (
                        <WorkspacePremium sx={{ color: 'gold', ml: 1 }} />
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 2 }}
                    >
                      {server.description || 'サーバーの説明なし'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">
                        招待コード:
                      </Typography>
                      <Chip
                        label={server.invite_code}
                        size="small"
                        onClick={() => copyInviteCode(server.invite_code)}
                        icon={<ContentCopy />}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      startIcon={<People />}
                      onClick={() => handleShowMembers(server)}
                    >
                      メンバー
                    </Button>
                    {server.owner_id === currentUser.id && (
                      <Button size="small" startIcon={<Settings />}>
                        設定
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {servers.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              background: alpha(theme.palette.background.paper, 0.5),
              borderRadius: 3,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              まだサーバーがありません
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              新しいサーバーを作成するか、既存のサーバーに参加してください
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                サーバーを作成
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={() => setJoinDialogOpen(true)}
              >
                サーバーに参加
              </Button>
            </Stack>
          </Box>
        )}
      </motion.div>

      {/* Create Server Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <School sx={{ mr: 2 }} />
            新しいサーバーを作成
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="サーバー名"
              value={newServer.name}
              onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="説明（任意）"
              multiline
              rows={3}
              value={newServer.description}
              onChange={(e) => setNewServer({ ...newServer, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>テンプレート</InputLabel>
              <Select
                value={newServer.template_type}
                onChange={(e) => setNewServer({ ...newServer, template_type: e.target.value })}
                label="テンプレート"
              >
                {serverTemplates.map((template) => (
                  <MenuItem key={template.value} value={template.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 1 }}>{template.icon}</Typography>
                      {template.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleCreateServer}
            variant="contained"
            disabled={!newServer.name}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Server Dialog */}
      <Dialog
        open={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAdd sx={{ mr: 2 }} />
            サーバーに参加
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              招待コードを入力してサーバーに参加しましょう
            </Alert>
            <TextField
              fullWidth
              label="招待コード"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="例: ABC123"
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleJoinServer}
            variant="contained"
            disabled={!inviteCode}
          >
            参加
          </Button>
        </DialogActions>
      </Dialog>

      {/* Members Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <People sx={{ mr: 2 }} />
            {selectedServer?.name} のメンバー
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {serverMembers.map((member) => (
              <ListItem key={member.id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: member.is_teacher ? 'secondary.main' : 'primary.main' }}>
                    {member.is_owner ? <WorkspacePremium /> : member.is_teacher ? <AdminPanelSettings /> : <People />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {member.username}
                      {member.is_owner && <Chip label="オーナー" size="small" color="warning" />}
                      {member.is_teacher && !member.is_owner && <Chip label="管理者" size="small" color="secondary" />}
                    </Box>
                  }
                  secondary={`参加日: ${new Date(member.joined_at).toLocaleDateString('ja-JP')}`}
                />
                {selectedServer?.owner_id === currentUser.id && !member.is_owner && (
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {!member.is_teacher && (
                        <Tooltip title="管理者に昇格">
                          <IconButton
                            size="small"
                            onClick={() => handlePromoteUser(member.id)}
                          >
                            <AdminPanelSettings />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="サーバーから削除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <ExitToApp />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServerManagement;
