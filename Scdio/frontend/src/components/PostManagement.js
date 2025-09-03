import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Fab,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Article as ArticleIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import api from '../api';

const PostManagement = ({ token }) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, diary, album
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('diary');
  const [editingPost, setEditingPost] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [token]);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, filterType]);

  const filterPosts = () => {
    let filtered = posts;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(post => post.type === filterType);
    }
    
    setFilteredPosts(filtered);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getPosts(token);
      if (data) {
        // Defensive programming: ensure data is an array
        const postsArray = Array.isArray(data) ? data : (data.posts && Array.isArray(data.posts)) ? data.posts : [];
        setPosts(postsArray);
        setError('');
      } else {
        setError('投稿の取得に失敗しました');
        setPosts([]);
      }
    } catch (err) {
      setError('ネットワークエラーまたはサーバーがダウンしています');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let data;
      if (editingPost) {
        data = await api.updatePost(editingPost.id, { title, content, type }, token);
        setMessage('投稿が正常に更新されました！');
      } else {
        data = await api.createPost({ title, content, type }, token);
        setMessage('投稿が正常に作成されました！');
      }
      
      if (data && !data.error) {
        fetchPosts();
        resetForm();
        setDialogOpen(false);
      } else {
        setError(data?.error || '操作が失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーまたはサーバーがダウンしています');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('diary');
    setEditingPost(null);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setTitle(post.title || '');
    setContent(post.content || '');
    setType(post.type || 'diary');
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当にこの投稿を削除しますか？')) {
      try {
        setLoading(true);
        const data = await api.deletePost(id, token);
        if (data && !data.error) {
          setMessage('投稿が正常に削除されました');
          fetchPosts();
        } else {
          setError(data?.error || '削除に失敗しました');
        }
      } catch (err) {
        setError('ネットワークエラーまたはサーバーがダウンしています');
      } finally {
        setLoading(false);
      }
    }
  };

  const getTypeIcon = (postType) => {
    return postType === 'album' ? <PhotoLibraryIcon /> : <ArticleIcon />;
  };

  const getTypeChip = (postType) => {
    return postType === 'album' ? 
      <Chip label="アルバム" color="secondary" size="small" icon={<PhotoLibraryIcon />} /> :
      <Chip label="日記" color="primary" size="small" icon={<ArticleIcon />} />;
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon color="primary" />
          投稿管理 (日記・アルバム)
        </Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="投稿を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>タイプ</InputLabel>
              <Select
                value={filterType}
                label="タイプ"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="diary">日記</MenuItem>
                <MenuItem value="album">アルバム</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Posts List */}
      <Grid container spacing={3}>
        {filteredPosts.map((post) => (
          <Grid item xs={12} md={6} lg={4} key={post.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {post.title}
                  </Typography>
                  {getTypeChip(post.type)}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {truncateContent(post.content)}
                </Typography>

                {post.created_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {format(parseISO(post.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </Typography>
                  </Box>
                )}

                {post.author && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {post.author}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Box>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(post)}
                  >
                    編集
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(post.id)}
                  >
                    削除
                  </Button>
                </Box>
                <Button
                  component={Link}
                  to={`/posts/${post.id}`}
                  size="small"
                  startIcon={<VisibilityIcon />}
                  sx={{ ml: 'auto' }}
                >
                  詳細
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPosts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery || filterType !== 'all' ? '検索条件に一致する投稿がありません' : '投稿がありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            右下の「+」ボタンから新しい投稿を作成しましょう
          </Typography>
        </Paper>
      )}

      {/* Post Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingPost ? '投稿を編集' : '新しい投稿を作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="タイトル"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="内容"
                  multiline
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>タイプ</InputLabel>
                  <Select
                    value={type}
                    label="タイプ"
                    onChange={(e) => setType(e.target.value)}
                  >
                    <MenuItem value="diary">日記</MenuItem>
                    <MenuItem value="album">アルバム</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '保存中...' : editingPost ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PostManagement;
