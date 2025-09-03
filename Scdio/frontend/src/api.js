const API_BASE_URL = 'http://localhost:8051/api';

export { API_BASE_URL };

const api = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  getMe: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Server Management APIs
  getServers: async (token) => {
    const response = await fetch(`${API_BASE_URL}/servers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createServer: async (serverData, token) => {
    const response = await fetch(`${API_BASE_URL}/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(serverData),
    });
    return response.json();
  },

  getServer: async (serverId, token) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  updateServer: async (serverId, serverData, token) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(serverData),
    });
    return response.json();
  },

  deleteServer: async (serverId, token) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.status === 204;
  },

  joinServer: async (inviteCode, token) => {
    const response = await fetch(`${API_BASE_URL}/servers/join/${inviteCode}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getServerMembers: async (serverId, token) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  promoteUser: async (serverId, userId, token) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/members/${userId}/promote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  removeMember: async (serverId, userId, token) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.status === 204;
  },

  getRoles: async (token) => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createRole: async (roleData, token) => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(roleData),
    });
    return response.json();
  },

  updateRole: async (id, roleData, token) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(roleData),
    });
    return response.json();
  },

  deleteRole: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  assignRoleToUser: async (userId, roleId, token) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ roleId }),
    });
    return response.json();
  },

  removeRoleFromUser: async (userId, roleId, token) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getEquipments: async (token) => {
    const response = await fetch(`${API_BASE_URL}/equipments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createEquipment: async (equipmentData, token) => {
    const response = await fetch(`${API_BASE_URL}/equipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(equipmentData),
    });
    return response.json();
  },

  updateEquipment: async (id, equipmentData, token) => {
    const response = await fetch(`${API_BASE_URL}/equipments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(equipmentData),
    });
    return response.json();
  },

  deleteEquipment: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/equipments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getBudgets: async (token) => {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createBudget: async (budgetData, token) => {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });
    return response.json();
  },

  updateBudget: async (id, budgetData, token) => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });
    return response.json();
  },

  deleteBudget: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getEvents: async (token) => {
    const response = await fetch(`${API_BASE_URL}/events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createEvent: async (eventData, token) => {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });
    return response.json();
  },

  updateEvent: async (id, eventData, token) => {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });
    return response.json();
  },

  deleteEvent: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getTasks: async (token, userId = null) => {
    const url = userId ? `${API_BASE_URL}/tasks?user_id=${userId}` : `${API_BASE_URL}/tasks`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        // Try to parse error body if available
        try {
          const err = await response.json();
          return err && err.tasks ? err.tasks : [];
        } catch (e) {
          return [];
        }
      }
      const json = await response.json();
      // Normalize: if server returns { tasks: [...] } or an array
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.tasks)) return json.tasks;
      // Fallback: if object but not tasks, return empty array
      return [];
    } catch (error) {
      console.error('getTasks error:', error);
      return [];
    }
  },

  createTask: async (taskData, token) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });
    return response.json();
  },

  updateTask: async (id, taskData, token) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });
    return response.json();
  },

  deleteTask: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getWikiPages: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wiki`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        try {
          const err = await response.json();
          return err && err.pages ? err.pages : [];
        } catch (e) {
          return [];
        }
      }
      const json = await response.json();
      // Normalize: if server returns { pages: [...] } or an array
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.pages)) return json.pages;
      // Fallback: if object but not pages, return empty array
      return [];
    } catch (error) {
      console.error('getWikiPages error:', error);
      return [];
    }
  },

  getWikiPage: async (slug, token) => {
    const response = await fetch(`${API_BASE_URL}/wiki/${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createWikiPage: async (wikiData, token) => {
    const response = await fetch(`${API_BASE_URL}/wiki`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(wikiData),
    });
    return response.json();
  },

  updateWikiPage: async (slug, wikiData, token) => {
    const response = await fetch(`${API_BASE_URL}/wiki/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(wikiData),
    });
    return response.json();
  },

  deleteWikiPage: async (slug, token) => {
    const response = await fetch(`${API_BASE_URL}/wiki/${slug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getPosts: async (token, type = null) => {
    const url = type ? `${API_BASE_URL}/posts?type=${type}` : `${API_BASE_URL}/posts`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createPost: async (postData, token) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });
    return response.json();
  },

  getPost: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  updatePost: async (id, postData, token) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });
    return response.json();
  },

  deletePost: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getWhiteboard: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/whiteboards/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  updateWhiteboard: async (id, whiteboardData, token) => {
    const response = await fetch(`${API_BASE_URL}/whiteboards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(whiteboardData),
    });
    return response.json();
  },

  getStamps: async (token) => {
    const response = await fetch(`${API_BASE_URL}/stamps`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createStamp: async (stampData, token) => {
    const formData = new FormData();
    formData.append('name', stampData.name);
    formData.append('image', stampData.image);

    const response = await fetch(`${API_BASE_URL}/stamps`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },

  deleteStamp: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/stamps/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Dashboard API calls
  getDashboardStats: async (token) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getActivities: async (token) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getTaskProgress: async (token) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/task-progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getBudgetChart: async (token) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/budget-chart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Chat and messaging API calls
  getMessages: async (channelId, token, limit = 50, offset = 0) => {
    const response = await fetch(`${API_BASE_URL}/messages/${channelId}?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  sendMessage: async (messageData, token) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    });
    return response.json();
  },

  getChannels: async (token) => {
    const response = await fetch(`${API_BASE_URL}/channels`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createChannel: async (channelData, token) => {
    const response = await fetch(`${API_BASE_URL}/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(channelData),
    });
    return response.json();
  },

  // User presence and status
  getOnlineUsers: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/online`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  updateUserStatus: async (status, token) => {
    const response = await fetch(`${API_BASE_URL}/users/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  // Enhanced API methods with token handling
  getTasksWithToken: async (token = null, userId = null) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return [];
    
    try {
      const url = userId ? `${API_BASE_URL}/tasks?user_id=${userId}` : `${API_BASE_URL}/tasks`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  getEventsWithToken: async (token = null) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  getActivitiesWithToken: async (token = null) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/activities`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  },

  // Whiteboard API calls
  getWhiteboards: async (token) => {
    const response = await fetch(`${API_BASE_URL}/whiteboards`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  createWhiteboard: async (whiteboardData, token) => {
    const response = await fetch(`${API_BASE_URL}/whiteboards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(whiteboardData),
    });
    return response.json();
  },

  deleteWhiteboard: async (id, token) => {
    const response = await fetch(`${API_BASE_URL}/whiteboards/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

export default api;
