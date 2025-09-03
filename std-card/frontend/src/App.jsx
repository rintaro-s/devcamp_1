import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, TextField, Button, Box,
  Card, CardContent, Grid, IconButton, Snackbar, Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

function App() {
  const [query, setQuery] = useState('');
  const [generatedCard, setGeneratedCard] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const API_BASE_URL = 'http://127.0.0.1:8000'; // FastAPI backend URL

  useEffect(() => {
    fetchSavedCards();
  }, []);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleGenerateCard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-card/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGeneratedCard(data);
      showSnackbar('フラッシュカードが生成されました！', 'success');
    } catch (error) {
      console.error('カード生成エラー:', error);
      showSnackbar('フラッシュカードの生成に失敗しました。', 'error');
    }
  };

  const handleSaveCard = async () => {
    if (!generatedCard) {
      showSnackbar('保存するカードがありません。', 'warning');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/save-card/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatedCard),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      showSnackbar(data.message, 'success');
      setGeneratedCard(null); // Clear generated card after saving
      fetchSavedCards(); // Refresh saved cards list
    } catch (error) {
      console.error('カード保存エラー:', error);
      showSnackbar('フラッシュカードの保存に失敗しました。', 'error');
    }
  };

  const fetchSavedCards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSavedCards(data);
    } catch (error) {
      console.error('保存済みカード取得エラー:', error);
      showSnackbar('保存済みフラッシュカードの読み込みに失敗しました。', 'error');
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      showSnackbar(data.message, 'info');
      fetchSavedCards(); // Refresh saved cards list
    } catch (error) {
      console.error('カード削除エラー:', error);
      showSnackbar('フラッシュカードの削除に失敗しました。', 'error');
    }
  };

  const handleShareCard = (card) => {
    const cardText = `質問: ${card.question}\n回答: ${card.answer}`;
    navigator.clipboard.writeText(cardText)
      .then(() => showSnackbar('カード内容をクリップボードにコピーしました！', 'success'))
      .catch(err => {
        console.error('コピーに失敗しました: ', err);
        showSnackbar('カード内容のコピーに失敗しました。', 'error');
      });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            暗記カードAIツール
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* AI Interaction Section */}
        <Box sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            新しい暗記カードを生成
          </Typography>
          <TextField
            fullWidth
            label="AIに質問したいトピックや質問を入力してください"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleGenerateCard}
            disabled={!query}
          >
            フラッシュカードを生成
          </Button>

          {generatedCard && (
            <Card sx={{ mt: 3, bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  生成されたカード:
                </Typography>
                <Typography variant="body1" sx={{ mb: 1.5 }}>
                  <strong>質問:</strong> {generatedCard.question}
                </Typography>
                <Typography variant="body2">
                  <strong>回答:</strong> {generatedCard.answer}
                </Typography>
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={handleSaveCard}
                >
                  カードを保存
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Saved Flashcards Section */}
        <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            保存済み暗記カード
          </Typography>
          {savedCards.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              まだ暗記カードは保存されていません。生成して保存しましょう！
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {savedCards.map((card) => (
                <Grid item xs={12} sm={6} md={4} key={card.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body1" sx={{ mb: 1.5 }}>
                        <strong>Q:</strong> {card.question}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>A:</strong> {card.answer}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <IconButton
                          aria-label="share"
                          onClick={() => handleShareCard(card)}
                          color="primary"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          onClick={() => handleDeleteCard(card.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
