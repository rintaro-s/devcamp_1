import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { io } from 'socket.io-client';
import api from '../api'; // Assuming api.js handles API calls

const socket = io('http://localhost:8051'); // Connect to backend socket.io server

const Whiteboard = ({ token }) => {
  const { id } = useParams();
  const canvasRef = useRef(null);
  const [whiteboardData, setWhiteboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchWhiteboard = async () => {
      try {
        setLoading(true);
        const data = await api.getWhiteboard(id, token); // Assuming getWhiteboard exists in api.js
        if (data) {
          setWhiteboardData(data);
          if (canvasRef.current && data.data) {
            canvasRef.current.loadPaths(data.data);
          }
        } else {
          setError('Whiteboard not found or failed to load.');
        }
      } catch (err) {
        setError('Network error or failed to fetch whiteboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchWhiteboard();
    }

    // Socket.io listeners
    socket.on('whiteboard-update', (updatedData) => {
      if (updatedData.id === id && canvasRef.current) {
        canvasRef.current.loadPaths(updatedData.data);
      }
    });

    return () => {
      socket.off('whiteboard-update');
    };
  }, [id, token]);

  const handleSave = async () => {
    if (canvasRef.current) {
      try {
        setIsSaving(true);
        const paths = await canvasRef.current.exportPaths();
        const updatedWhiteboard = {
          ...whiteboardData,
          data: paths,
        };
        await api.updateWhiteboard(id, updatedWhiteboard, token); // Assuming updateWhiteboard exists in api.js
        setWhiteboardData(updatedWhiteboard);
        socket.emit('whiteboard-update', updatedWhiteboard); // Emit update to other clients
      } catch (err) {
        setError('Failed to save whiteboard.');
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      // Optionally, save empty canvas to backend and emit
      // handleSave();
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
        Whiteboard: {whiteboardData?.name || 'Untitled'}
      </Typography>
      <Box sx={{ border: '1px solid #ccc', mb: 2 }}>
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={4}
          strokeColor="black"
          canvasColor="white"
          width="100%"
          height="500px"
          // onStroke={(path) => { /* Optional: handle individual strokes */ }}
        />
      </Box>
      <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ mr: 1 }}>
        {isSaving ? <CircularProgress size={24} /> : 'Save Whiteboard'}
      </Button>
      <Button variant="outlined" onClick={handleClear}>
        Clear Canvas
      </Button>
    </Box>
  );
};

export default Whiteboard;
