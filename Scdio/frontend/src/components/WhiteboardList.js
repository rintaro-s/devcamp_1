import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../api'; // Assuming api.js handles API calls

const WhiteboardList = ({ token }) => {
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newWhiteboardName, setNewWhiteboardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWhiteboards = async () => {
      try {
        setLoading(true);
        // Assuming a getWhiteboards API call exists or needs to be added to api.js
        // For now, let's assume the backend has a GET /api/whiteboards endpoint
        const data = await api.getWhiteboards(token); // Need to add this to api.js
        setWhiteboards(data);
      } catch (err) {
        setError('Failed to fetch whiteboards.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchWhiteboards();
    }
  }, [token]);

  const handleCreateWhiteboard = async () => {
    if (!newWhiteboardName.trim()) {
      setError('Whiteboard name cannot be empty.');
      return;
    }
    try {
      setIsCreating(true);
      // Assuming a createWhiteboard API call exists or needs to be added to api.js
      const newWhiteboard = await api.createWhiteboard({ name: newWhiteboardName, data: [] }, token); // Need to add this to api.js
      setWhiteboards((prev) => [...prev, newWhiteboard]);
      setNewWhiteboardName('');
      setOpenDialog(false);
      navigate(`/whiteboards/${newWhiteboard.id}`); // Navigate to the new whiteboard
    } catch (err) {
      setError('Failed to create whiteboard.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWhiteboard = async (id) => {
    try {
      // Assuming a deleteWhiteboard API call exists or needs to be added to api.js
      await api.deleteWhiteboard(id, token); // Need to add this to api.js
      setWhiteboards((prev) => prev.filter((wb) => wb.id !== id));
    } catch (err) {
      setError('Failed to delete whiteboard.');
      console.error(err);
    }
  };

  if (!token) {
    return <Typography>Please log in to view this page.</Typography>;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Whiteboard List
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Create New Whiteboard
      </Button>

      {whiteboards.length > 0 ? (
        <List>
          {whiteboards.map((whiteboard) => (
            <ListItem
              key={whiteboard.id}
              component={Link}
              to={`/whiteboards/${whiteboard.id}`}
              sx={{ border: '1px solid #eee', mb: 1, borderRadius: '4px' }}
            >
              <ListItemText primary={whiteboard.name} secondary={`Created: ${new Date(whiteboard.created_at).toLocaleDateString()}`} />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete" onClick={(e) => { e.preventDefault(); handleDeleteWhiteboard(whiteboard.id); }}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography>No whiteboards found. Create one!</Typography>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Whiteboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Whiteboard Name"
            type="text"
            fullWidth
            variant="standard"
            value={newWhiteboardName}
            onChange={(e) => setNewWhiteboardName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateWhiteboard();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateWhiteboard} disabled={isCreating}>
            {isCreating ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhiteboardList;
