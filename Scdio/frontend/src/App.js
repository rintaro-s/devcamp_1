import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { lightTheme, darkTheme } from './theme';
import api from './api';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import ServerDashboard from './components/ServerDashboard';
import ServerView from './components/ServerView';
import EquipmentManagement from './components/EquipmentManagement';
import BudgetManagement from './components/BudgetManagement';
import EventManagement from './components/EventManagement';
import TaskManagement from './components/TaskManagement';
import WikiManagement from './components/WikiManagement';
import WikiPage from './components/WikiPage';
import PostManagement from './components/PostManagement';
import PostDetail from './components/PostDetail';
import WhiteboardList from './components/WhiteboardList';
import Whiteboard from './components/Whiteboard';
import StampManagement from './components/StampManagement';
import RoleManagement from './components/RoleManagement';
import UserManagement from './components/UserManagement';
import Chat from './components/Chat';
import Layout from './components/Layout';
import ServerManagement from './components/ServerManagement';

// Context for theme and user state
const AppContext = createContext();

export { AppContext };

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || false
  );
  const [loading, setLoading] = useState(true);

  // テーマ切り替え関数
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // ユーザー情報の取得
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (token) {
        try {
          const response = await api.getMe(token);
          
          if (response && !response.error) {
            setCurrentUser(response);
          } else {
            // トークンが無効な場合
            setToken(null);
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchUserInfo();
  }, [token]);

  // トークンの変更を監視
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  }, [token]);

  // ダークモードの切り替え
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const contextValue = {
    token,
    setToken,
    currentUser,
    setCurrentUser,
    darkMode,
    isDark: darkMode,
    theme: darkMode ? darkTheme : lightTheme,
    toggleDarkMode,
    toggleTheme,
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: darkMode ? '#36393f' : '#f8f9fa',
        }}>
          <div>Loading...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Router>
          <div className="App">
            <Routes>
              <Route 
                path="/login" 
                element={
                  token ? <Navigate to="/servers" replace /> : 
                  <LoginPage setToken={setToken} />
                } 
              />
              <Route 
                path="/register" 
                element={
                  token ? <Navigate to="/servers" replace /> : 
                  <RegisterPage setToken={setToken} />
                } 
              />
              <Route
                path="/"
                element={
                  token ? <Navigate to="/servers" replace /> : 
                  <Navigate to="/login" replace />
                }
              />
              
              {/* 認証が必要なルート */}
              {token && (
                <>
                  {/* メインのサーバー選択画面 */}
                  <Route
                    path="/servers"
                    element={
                      <ServerDashboard token={token} currentUser={currentUser} />
                    }
                  />
                  
                  {/* サーバー内の各画面（すべてServerView内で処理） */}
                  <Route
                    path="/servers/:serverId/*"
                    element={
                      <ServerView token={token} currentUser={currentUser} />
                    }
                  />
                  
                  {/* デフォルトのダッシュボード（参加サーバーがある場合のみ） */}
                  <Route
                    path="/dashboard"
                    element={
                      <Layout currentUser={currentUser}>
                        <Dashboard token={token} currentUser={currentUser} />
                      </Layout>
                    }
                  />
                </>
              )}
              
              {/* 未認証時のリダイレクト */}
              <Route
                path="*"
                element={<Navigate to={token ? "/servers" : "/login"} replace />}
              />
            </Routes>
          </div>
        </Router>
        
        {/* Toast通知 */}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? 'dark' : 'light'}
        />
      </ThemeProvider>
    </AppContext.Provider>
  );
}

export default App;