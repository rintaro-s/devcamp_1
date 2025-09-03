import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  MenuBook as WikiIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import api from '../api';

const WikiManagement = ({ token }) => {
  const navigate = useNavigate();
  const [wikiPages, setWikiPages] = useState([]);
  const [filteredPages, setFilteredPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState('');
  const [editingWikiPage, setEditingWikiPage] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = [
    { id: 'general', label: '一般', color: 'default' },
    { id: 'tutorial', label: 'チュートリアル', color: 'primary' },
    { id: 'documentation', label: 'ドキュメント', color: 'info' },
    { id: 'faq', label: 'FAQ', color: 'warning' },
    { id: 'guide', label: 'ガイド', color: 'success' },
    { id: 'reference', label: 'リファレンス', color: 'secondary' },
  ];

  useEffect(() => {
    fetchWikiPages();
  }, [token]);

  useEffect(() => {
    filterPages();
  }, [wikiPages, searchQuery, filterCategory]);

  const filterPages = () => {
    let filtered = wikiPages;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(page => 
        page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.tags?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(page => page.category === filterCategory);
    }
    
    setFilteredPages(filtered);
  };

  const fetchWikiPages = async () => {
    setLoading(true);
    try {
      const data = await api.getWikiPages(token);
      if (Array.isArray(data)) {
        setWikiPages(data);
        setError('');
      } else if (data && typeof data === 'object' && Array.isArray(data.pages)) {
        setWikiPages(data.pages);
        setError('');
      } else {
        console.warn('fetchWikiPages: unexpected response shape', data);
        setWikiPages([]);
        setError('Wikiページの取得に失敗しました（予期しないレスポンス）');
      }
    } catch (err) {
      console.error('fetchWikiPages error:', err);
      setError('ネットワークエラーまたはサーバーがダウンしています');
      setWikiPages([]);
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
      const wikiData = { 
        title, 
        content, 
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      if (editingWikiPage) {
        data = await api.updateWikiPage(editingWikiPage.slug, wikiData, token);
        setMessage('Wikiページが正常に更新されました！');
      } else {
        data = await api.createWikiPage({ ...wikiData, slug }, token);
        setMessage('Wikiページが正常に作成されました！');
      }
      
      if (data && !data.error) {
        fetchWikiPages();
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
    setSlug('');
    setContent('');
    setCategory('general');
    setTags('');
    setEditingWikiPage(null);
  };

  const handleEdit = (wikiPage) => {
    setEditingWikiPage(wikiPage);
    setTitle(wikiPage.title || '');
    setSlug(wikiPage.slug || '');
    setContent(wikiPage.content || '');
    setCategory(wikiPage.category || 'general');
    setTags(wikiPage.tags ? wikiPage.tags.join(', ') : '');
    setDialogOpen(true);
  };

  const handleDelete = async (slugToDelete) => {
    if (window.confirm('本当にこのWikiページを削除しますか？')) {
      try {
        setLoading(true);
        const data = await api.deleteWikiPage(slugToDelete, token);
        if (data && !data.error) {
          setMessage('Wikiページが正常に削除されました');
          fetchWikiPages();
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

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!editingWikiPage && newTitle) {
      setSlug(generateSlug(newTitle));
    }
  };

  const getCategoryChip = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return (
      <Chip 
        label={category?.label || 'その他'} 
        color={category?.color || 'default'} 
        size="small" 
      />
    );
  };

  const getCategoryStats = () => {
    const stats = {};
    categories.forEach(cat => {
      stats[cat.id] = wikiPages.filter(page => page.category === cat.id).length;
    });
    return stats;
  };

  const truncateContent = (content, maxLength = 200) => {
    if (!content) return '内容なし';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WikiIcon color="primary" />
          Wiki管理
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

      {/* Wiki Statistics */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderIcon />
          Wiki統計
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {wikiPages.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総ページ数
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" gutterBottom>
                {categories.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                カテゴリー数
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {wikiPages.filter(page => page.updated_at && new Date(page.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今週の更新
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Wikiページを検索..."
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
              <InputLabel>カテゴリー</InputLabel>
              <Select
                value={filterCategory}
                label="カテゴリー"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Wiki Pages List */}
      <Grid container spacing={3}>
        {filteredPages.map((page) => (
          <Grid item xs={12} md={6} lg={4} key={page.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <ArticleIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {page.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        /{page.slug}
                      </Typography>
                    </Box>
                  </Box>
                  {getCategoryChip(page.category)}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4 }}>
                  {truncateContent(page.content)}
                </Typography>

                {page.tags && page.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {page.tags.slice(0, 3).map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {page.tags.length > 3 && (
                      <Chip 
                        label={`+${page.tags.length - 3}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                  {page.updated_at && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon fontSize="inherit" />
                      <Typography variant="caption">
                        {format(parseISO(page.updated_at), 'MM/dd', { locale: ja })}
                      </Typography>
                    </Box>
                  )}
                  {page.author && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon fontSize="inherit" />
                      <Typography variant="caption">
                        {page.author}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
                <Box>
                  <Tooltip title="編集">
                    <IconButton size="small" onClick={() => handleEdit(page)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="削除">
                    <IconButton size="small" color="error" onClick={() => handleDelete(page.slug)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Button
                  component={Link}
                  to={`/wiki/${page.slug}`}
                  size="small"
                  startIcon={<VisibilityIcon />}
                  sx={{ fontSize: '0.75rem' }}
                >
                  表示
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPages.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <WikiIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery || filterCategory !== 'all' ? '検索条件に一致するWikiページがありません' : 'Wikiページがありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            右下の「+」ボタンから新しいWikiページを作成しましょう
          </Typography>
        </Paper>
      )}

      {/* Wiki Page Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingWikiPage ? 'Wikiページを編集' : '新しいWikiページを作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="タイトル"
                  value={title}
                  onChange={handleTitleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="スラッグ (URL パス)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  disabled={!!editingWikiPage}
                  helperText="URLの一部になります（例: /wiki/slug）"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">/wiki/</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>カテゴリー</InputLabel>
                  <Select
                    value={category}
                    label="カテゴリー"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="タグ"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="タグ1, タグ2, タグ3"
                  helperText="カンマ区切りで入力"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="内容"
                  multiline
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  helperText="Markdownがサポートされています"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '保存中...' : editingWikiPage ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default WikiManagement;
