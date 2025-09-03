import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import api from '../api'; // Assuming api.js handles API calls

const RoleManagement = ({ token }) => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]); // To fetch users for role assignment
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rolesData = await api.getRoles(token);
        setRoles(rolesData);
        // Fetch users for assignment
        // Assuming a getUsers API call exists or needs to be added to api.js
        const usersData = await api.getUsers(token); // Need to add this to api.js
        setUsers(usersData);
      } catch (err) {
        setError('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError('Role name cannot be empty.');
      return;
    }
    try {
      setIsSubmitting(true);
      const createdRole = await api.createRole({ name: newRoleName }, token);
      setRoles((prev) => [...prev, createdRole]);
      setNewRoleName('');
      setOpenCreateDialog(false);
    } catch (err) {
      setError('Failed to create role.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!currentRole?.name.trim()) {
      setError('Role name cannot be empty.');
      return;
    }
    try {
      setIsSubmitting(true);
      const updatedRole = await api.updateRole(currentRole.id, { name: currentRole.name }, token);
      setRoles((prev) => prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)));
      setOpenEditDialog(false);
    } catch (err) {
      setError('Failed to update role.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (id) => {
    try {
      await api.deleteRole(id, token);
      setRoles((prev) => prev.filter((role) => role.id !== id));
    } catch (err) {
      setError('Failed to delete role.');
      console.error(err);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !currentRole?.id) {
      setError('Please select a user and a role.');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.assignRoleToUser(selectedUser, currentRole.id, token);
      // Optionally, refresh roles/users data or update state to reflect assignment
      setOpenAssignDialog(false);
      setSelectedUser('');
      // For simplicity, re-fetch all data after assignment
      const rolesData = await api.getRoles(token);
      setRoles(rolesData);
      const usersData = await api.getUsers(token);
      setUsers(usersData);
    } catch (err) {
      setError('Failed to assign role.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    try {
      await api.removeRoleFromUser(userId, roleId, token);
      // For simplicity, re-fetch all data after removal
      const rolesData = await api.getRoles(token);
      setRoles(rolesData);
      const usersData = await api.getUsers(token);
      setUsers(usersData);
    } catch (err) {
      setError('Failed to remove role.');
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
        Role Management
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenCreateDialog(true)}
        sx={{ mb: 2, mr: 1 }}
      >
        Create New Role
      </Button>
      <Button
        variant="contained"
        startIcon={<PersonAddIcon />}
        onClick={() => {
          setOpenAssignDialog(true);
          setCurrentRole(null); // Clear current role for general assignment
        }}
        sx={{ mb: 2 }}
      >
        Assign Role to User
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Assigned Users</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.id}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  {users
                    .filter((user) => user.roles?.some((userRole) => userRole.role_id === role.id))
                    .map((user) => (
                      <Box key={user.id} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">{user.username}</Typography>
                        <IconButton size="small" onClick={() => handleRemoveRole(user.id, role.id)}>
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => {
                      setCurrentRole(role);
                      setOpenEditDialog(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteRole(role.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Role Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            type="text"
            fullWidth
            variant="standard"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            type="text"
            fullWidth
            variant="standard"
            value={currentRole?.name || ''}
            onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>User</InputLabel>
            <Select
              value={selectedUser}
              label="User"
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={currentRole?.id || ''}
              label="Role"
              onChange={(e) => setCurrentRole(roles.find((r) => r.id === e.target.value))}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignRole} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;