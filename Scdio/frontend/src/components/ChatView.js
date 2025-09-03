import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  List,
  ListItem,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { API_BASE_URL } from '../api';
import { useAppContext } from '../App';
import io from 'socket.io-client';

const ChatView = ({ channel, token, currentUser }) => {
  const { darkMode } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Socket.IO接続
  useEffect(() => {
    const newSocket = io('http://localhost:8051');
    setSocket(newSocket);

    // 認証
    newSocket.emit('authenticate', token);

    newSocket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
    });

    newSocket.on('authentication_error', (error) => {
      console.error('Authentication error:', error);
    });

    // 新しいメッセージを受信
    newSocket.on('new_message', (message) => {
      if (message.channel_id === channel.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      newSocket.close();
    };
  }, [token]);

  // チャンネル変更時にメッセージを取得
  useEffect(() => {
    if (channel) {
      fetchMessages();
      if (socket) {
        socket.emit('join_channel', channel.id);
      }
    }

    return () => {
      if (socket && channel) {
        socket.emit('leave_channel', channel.id);
      }
    };
  }, [channel, socket]);

  // メッセージを取得
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/channels/${channel.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  // 新しいメッセージを下部にスクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // メッセージ送信
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      channel_id: channel.id,
      content: newMessage,
      reply_to: replyTo?.id || null
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
    setReplyTo(null);
  };

  // Enterキーでメッセージ送信
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return '今日';
    } else if (isYesterday(date)) {
      return '昨日';
    } else {
      return format(date, 'yyyy年M月d日', { locale: ja });
    }
  };

  // 時刻をフォーマット
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  // メッセージのコンテキストメニュー
  const handleMessageMenu = (event, message) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  // 返信設定
  const handleReply = () => {
    setReplyTo(selectedMessage);
    setAnchorEl(null);
  };

  // 日付区切りが必要かチェック
  const shouldShowDateDivider = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at);
    const previousDate = new Date(previousMessage.created_at);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // 同じユーザーの連続メッセージかチェック
  const shouldGroupMessage = (currentMessage, previousMessage) => {
    if (!previousMessage) return false;
    
    const currentTime = new Date(currentMessage.created_at);
    const previousTime = new Date(previousMessage.created_at);
    const timeDiff = (currentTime - previousTime) / 1000 / 60; // 分単位
    
    return (
      currentMessage.user_id === previousMessage.user_id &&
      timeDiff < 5 && // 5分以内
      !shouldShowDateDivider(currentMessage, previousMessage)
    );
  };

  const renderMessage = (message, index) => {
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateDivider = shouldShowDateDivider(message, previousMessage);
    const isGrouped = shouldGroupMessage(message, previousMessage);
    const isOwnMessage = message.user_id === currentUser?.id;

    return (
      <React.Fragment key={message.id}>
        {/* 日付区切り */}
        {showDateDivider && (
          <Box display="flex" alignItems="center" my={2}>
            <Divider sx={{ flex: 1 }} />
            <Chip
              label={formatDate(message.created_at)}
              size="small"
              sx={{ mx: 2, bgcolor: 'background.paper' }}
            />
            <Divider sx={{ flex: 1 }} />
          </Box>
        )}

        {/* メッセージ */}
        <ListItem
          sx={{
            py: isGrouped ? 0.25 : 1,
            px: 2,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
          onContextMenu={(e) => handleMessageMenu(e, message)}
        >
          <Box display="flex" width="100%">
            {/* アバター */}
            <Box sx={{ mr: 2, width: 40 }}>
              {!isGrouped && (
                <Avatar
                  src={message.avatar_url}
                  sx={{ width: 40, height: 40 }}
                >
                  {message.username?.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Box>

            {/* メッセージコンテンツ */}
            <Box flex={1}>
              {/* ユーザー名と時刻 */}
              {!isGrouped && (
                <Box display="flex" alignItems="baseline" mb={0.5}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 'bold',
                      color: isOwnMessage ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {message.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {formatTime(message.created_at)}
                  </Typography>
                </Box>
              )}

              {/* 返信元メッセージ */}
              {message.reply_message && (
                <Box
                  sx={{
                    borderLeft: 3,
                    borderColor: 'divider',
                    pl: 1,
                    mb: 1,
                    bgcolor: 'action.selected',
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {message.reply_message.username}への返信
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {message.reply_message.content}
                  </Typography>
                </Box>
              )}

              {/* メッセージ内容 */}
              <Typography
                variant="body1"
                sx={{
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {message.content}
              </Typography>

              {/* 添付ファイル */}
              {message.attachments && message.attachments.length > 0 && (
                <Box mt={1}>
                  {message.attachments.map((attachment, idx) => (
                    <Chip
                      key={idx}
                      label={attachment.name}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* メッセージアクション */}
            <Box>
              <IconButton
                size="small"
                onClick={(e) => handleMessageMenu(e, message)}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </ListItem>
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: darkMode ? '#36393f' : '#ffffff'
      }}
    >
      {/* メッセージエリア */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: darkMode ? '#36393f' : '#ffffff'
        }}
      >
        <List sx={{ pt: 0 }}>
          {messages.map((message, index) => renderMessage(message, index))}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* 返信プレビュー */}
      {replyTo && (
        <Box
          sx={{
            p: 2,
            bgcolor: darkMode ? '#40444b' : '#f1f3f4',
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <ReplyIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                {replyTo.username}への返信
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyTo(null)}>
              ×
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" noWrap>
            {replyTo.content}
          </Typography>
        </Box>
      )}

      {/* メッセージ入力エリア */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: darkMode ? '#40444b' : '#f8f9fa'
        }}
      >
        <Box display="flex" alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder={`#${channel.name}にメッセージを送信`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: darkMode ? '#484c52' : '#ffffff',
                borderRadius: 2
              }
            }}
          />
          <Box sx={{ ml: 1 }}>
            <IconButton>
              <AttachIcon />
            </IconButton>
            <IconButton>
              <EmojiIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* メッセージコンテキストメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleReply}>
          <ReplyIcon sx={{ mr: 1 }} />
          返信
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatView;
