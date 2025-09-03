import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardMedia, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import api from '../api'; // Assuming api.js handles API calls

const StampManagement = ({ token }) => {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newStampName, setNewStampName] = useState('');
  const [newStampImage, setNewStampImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        setLoading(true);
        const data = await api.getStamps(token);
        setStamps(data);
      } catch (err) {
        setError('Failed to fetch stamps.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStamps();
    }
  }, [token]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewStampImage(e.target.files[0]);
    }
  };

  const handleUploadStamp = async () => {
    if (!newStampName.trim() || !newStampImage) {
      setError('Stamp name and image are required.');
      return;
    }
    try {
      setIsUploading(true);
      const stampData = {
        name: newStampName,
        image: newStampImage,
      };
      const newStamp = await api.createStamp(stampData, token);
      setStamps((prev) => [...prev, newStamp]);
      setNewStampName('');
      setNewStampImage(null);
      setOpenDialog(false);
    } catch (err) {
      setError('Failed to upload stamp.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStamp = async (id) => {
    try {
      await api.deleteStamp(id, token);
      setStamps((prev) => prev.filter((stamp) => stamp.id !== id));
    } catch (err) {
      setError('Failed to delete stamp.');
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
        Stamp Management
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddPhotoAlternateIcon />}
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Upload New Stamp
      </Button>

      <Grid container spacing={2}>
        {stamps.length > 0 ? (
          stamps.map((stamp) => (
            <Grid item key={stamp.id} xs={12} sm={6} md={4} lg={3}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={`http://localhost:3001${stamp.image_url}`}
                  alt={stamp.name}
                  sx={{ objectFit: 'contain', p: 1 }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {stamp.name}
                  </Typography>
                  <IconButton aria-label="delete" onClick={() => handleDeleteStamp(stamp.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography>No stamps found. Upload some!</Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Upload New Stamp</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Stamp Name"
            type="text"
            fullWidth
            variant="standard"
            value={newStampName}
            onChange={(e) => setNewStampName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            component="label"
            startIcon={<AddPhotoAlternateIcon />}
          >
            Select Image
            <input type="file" hidden onChange={handleImageChange} />
          </Button>
          {newStampImage && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {newStampImage.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleUploadStamp} disabled={isUploading}>
            {isUploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StampManagement;