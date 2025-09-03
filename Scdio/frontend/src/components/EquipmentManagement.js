import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  Badge,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Engineering as EquipmentIcon,
  Inventory as InventoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Build as BuildIcon,
  Computer as ComputerIcon,
  Kitchen as KitchenIcon,
  DirectionsCar as VehicleIcon,
  Business as OfficeIcon,
  Home as HomeIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import api from '../api';

const EquipmentManagement = ({ token }) => {
  const [equipments, setEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('tools');
  const [condition, setCondition] = useState('excellent');
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = [
    { id: 'tools', label: 'ツール・工具', icon: BuildIcon },
    { id: 'computer', label: 'コンピューター', icon: ComputerIcon },
    { id: 'kitchen', label: 'キッチン用品', icon: KitchenIcon },
    { id: 'vehicle', label: '車両', icon: VehicleIcon },
    { id: 'office', label: 'オフィス用品', icon: OfficeIcon },
    { id: 'furniture', label: '家具', icon: HomeIcon },
    { id: 'other', label: 'その他', icon: CategoryIcon },
  ];

  const conditions = [
    { id: 'excellent', label: '優秀', color: 'success' },
    { id: 'good', label: '良好', color: 'info' },
    { id: 'fair', label: '普通', color: 'warning' },
    { id: 'poor', label: '悪い', color: 'error' },
  ];

  useEffect(() => {
    fetchEquipments();
  }, [token]);

  useEffect(() => {
    filterEquipments();
  }, [equipments, searchQuery, filterCategory]);

  const filterEquipments = () => {
    let filtered = equipments;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(equipment => 
        equipment.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(equipment => equipment.category === filterCategory);
    }
    
    setFilteredEquipments(filtered);
  };

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipments(token);
      if (data) {
        // Defensive programming: ensure data is an array
        const equipmentsArray = Array.isArray(data) ? data : (data.equipments && Array.isArray(data.equipments)) ? data.equipments : [];
        setEquipments(equipmentsArray);
        setError('');
      } else {
        setError('設備の取得に失敗しました');
        setEquipments([]);
      }
    } catch (err) {
      setError('ネットワークエラーまたはサーバーがダウンしています');
      setEquipments([]);
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
      const equipmentData = { 
        name, 
        description, 
        quantity: parseInt(quantity),
        category,
        condition
      };
      
      if (editingEquipment) {
        data = await api.updateEquipment(editingEquipment.id, equipmentData, token);
        setMessage('設備が正常に更新されました！');
      } else {
        data = await api.createEquipment(equipmentData, token);
        setMessage('設備が正常に作成されました！');
      }
      
      if (data && !data.error) {
        fetchEquipments();
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
    setName('');
    setDescription('');
    setQuantity('');
    setCategory('tools');
    setCondition('excellent');
    setEditingEquipment(null);
  };

  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    setName(equipment.name || '');
    setDescription(equipment.description || '');
    setQuantity(equipment.quantity?.toString() || '');
    setCategory(equipment.category || 'tools');
    setCondition(equipment.condition || 'excellent');
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当にこの設備を削除しますか？')) {
      try {
        setLoading(true);
        const data = await api.deleteEquipment(id, token);
        if (data && !data.error) {
          setMessage('設備が正常に削除されました');
          fetchEquipments();
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

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    const IconComponent = category?.icon || CategoryIcon;
    return <IconComponent />;
  };

  const getCategoryLabel = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.label || 'その他';
  };

  const getConditionChip = (conditionId) => {
    const condition = conditions.find(cond => cond.id === conditionId);
    return (
      <Chip 
        label={condition?.label || '不明'} 
        color={condition?.color || 'default'} 
        size="small" 
      />
    );
  };

  const getTotalQuantity = () => {
    return equipments.reduce((total, eq) => total + (eq.quantity || 0), 0);
  };

  const getCategoryStats = () => {
    const stats = {};
    categories.forEach(cat => {
      stats[cat.id] = equipments.filter(eq => eq.category === cat.id).length;
    });
    return stats;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EquipmentIcon color="primary" />
          設備管理
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

      {/* Equipment Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon />
          設備サマリー
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {equipments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総設備数
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" gutterBottom>
                {getTotalQuantity()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総在庫数
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {categories.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                カテゴリー数
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
              placeholder="設備を検索..."
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

      {/* Equipment List */}
      <Grid container spacing={3}>
        {filteredEquipments.map((equipment) => (
          <Grid item xs={12} md={6} lg={4} key={equipment.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {getCategoryIcon(equipment.category)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                        {equipment.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getCategoryLabel(equipment.category)}
                      </Typography>
                    </Box>
                  </Box>
                  {getConditionChip(equipment.condition)}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {equipment.description || '説明なし'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={equipment.quantity || 0} color="secondary">
                    <InventoryIcon color="action" />
                  </Badge>
                  <Typography variant="body2">
                    在庫: {equipment.quantity || 0} 個
                  </Typography>
                </Box>
              </CardContent>
              
              <Divider />
              
              <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(equipment)}
                >
                  編集
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(equipment.id)}
                >
                  削除
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredEquipments.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <EquipmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery || filterCategory !== 'all' ? '検索条件に一致する設備がありません' : '設備がありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            右下の「+」ボタンから新しい設備を追加しましょう
          </Typography>
        </Paper>
      )}

      {/* Equipment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingEquipment ? '設備を編集' : '新しい設備を追加'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="設備名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="説明"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="数量"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>状態</InputLabel>
                  <Select
                    value={condition}
                    label="状態"
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    {conditions.map((cond) => (
                      <MenuItem key={cond.id} value={cond.id}>
                        {cond.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '保存中...' : editingEquipment ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EquipmentManagement;
