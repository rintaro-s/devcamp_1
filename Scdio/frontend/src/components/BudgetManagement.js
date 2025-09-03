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
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as BudgetIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Savings as SavingsIcon,
  MonetizationOn as MoneyIcon,
  Assessment as ChartIcon,
} from '@mui/icons-material';
import api from '../api';

const BudgetManagement = ({ token }) => {
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [editingBudget, setEditingBudget] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [token]);

  useEffect(() => {
    filterBudgets();
  }, [budgets, searchQuery, filterType]);

  const filterBudgets = () => {
    let filtered = budgets;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(budget => 
        budget.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        budget.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(budget => budget.type === filterType);
    }
    
    setFilteredBudgets(filtered);
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets(token);
      if (data) {
        // Defensive programming: ensure data is an array
        const budgetsArray = Array.isArray(data) ? data : (data.budgets && Array.isArray(data.budgets)) ? data.budgets : [];
        setBudgets(budgetsArray);
        setError('');
      } else {
        setError('予算の取得に失敗しました');
        setBudgets([]);
      }
    } catch (err) {
      setError('ネットワークエラーまたはサーバーがダウンしています');
      setBudgets([]);
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
      const budgetData = { 
        name, 
        description, 
        amount: parseInt(amount), 
        type 
      };
      
      if (editingBudget) {
        data = await api.updateBudget(editingBudget.id, budgetData, token);
        setMessage('予算が正常に更新されました！');
      } else {
        data = await api.createBudget(budgetData, token);
        setMessage('予算が正常に作成されました！');
      }
      
      if (data && !data.error) {
        fetchBudgets();
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
    setAmount('');
    setType('income');
    setEditingBudget(null);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setName(budget.name || '');
    setDescription(budget.description || '');
    setAmount(budget.amount?.toString() || '');
    setType(budget.type || 'income');
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当にこの予算を削除しますか？')) {
      try {
        setLoading(true);
        const data = await api.deleteBudget(id, token);
        if (data && !data.error) {
          setMessage('予算が正常に削除されました');
          fetchBudgets();
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

  const getTypeIcon = (budgetType) => {
    return budgetType === 'income' ? <IncomeIcon /> : <ExpenseIcon />;
  };

  const getTypeChip = (budgetType) => {
    return budgetType === 'income' ? 
      <Chip label="収入" color="success" size="small" icon={<IncomeIcon />} /> :
      <Chip label="支出" color="error" size="small" icon={<ExpenseIcon />} />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const getTotalIncome = () => {
    return budgets.filter(b => b.type === 'income').reduce((total, b) => total + (b.amount || 0), 0);
  };

  const getTotalExpense = () => {
    return budgets.filter(b => b.type === 'expense').reduce((total, b) => total + (b.amount || 0), 0);
  };

  const getNetBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BudgetIcon color="primary" />
          予算管理
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

      {/* Budget Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChartIcon />
          予算サマリー
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {formatCurrency(getTotalIncome())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総収入
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" gutterBottom>
                {formatCurrency(getTotalExpense())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総支出
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={getNetBalance() >= 0 ? 'success.main' : 'error.main'} 
                gutterBottom
              >
                {formatCurrency(getNetBalance())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                純利益
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {budgets.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                予算項目数
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
              placeholder="予算を検索..."
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
                <MenuItem value="income">収入</MenuItem>
                <MenuItem value="expense">支出</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Budget List */}
      <Grid container spacing={3}>
        {filteredBudgets.map((budget) => (
          <Grid item xs={12} md={6} lg={4} key={budget.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {budget.name}
                  </Typography>
                  {getTypeChip(budget.type)}
                </Box>
                
                <Typography 
                  variant="h4" 
                  color={budget.type === 'income' ? 'success.main' : 'error.main'}
                  sx={{ mb: 2, fontWeight: 'bold' }}
                >
                  {formatCurrency(budget.amount || 0)}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {budget.description || '説明なし'}
                </Typography>
              </CardContent>
              
              <Divider />
              
              <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(budget)}
                >
                  編集
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(budget.id)}
                >
                  削除
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredBudgets.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <SavingsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery || filterType !== 'all' ? '検索条件に一致する予算がありません' : '予算がありません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            右下の「+」ボタンから新しい予算項目を作成しましょう
          </Typography>
        </Paper>
      )}

      {/* Budget Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingBudget ? '予算を編集' : '新しい予算を作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="予算名"
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="金額"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>タイプ</InputLabel>
                  <Select
                    value={type}
                    label="タイプ"
                    onChange={(e) => setType(e.target.value)}
                  >
                    <MenuItem value="income">収入</MenuItem>
                    <MenuItem value="expense">支出</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '保存中...' : editingBudget ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BudgetManagement;
