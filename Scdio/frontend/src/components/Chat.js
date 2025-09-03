import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Badge,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  PushPin as PinIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';

const socket = io('http://localhost:8051');

const MessageItem = ({ message, currentUser, onReply, onEdit, onDelete, onReact }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [liked, setLiked] = useState(false);
  const isOwnMessage = message.user_id === currentUser?.id;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `昨日 ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MM/dd HH:mm');
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    onReact && onReact(message.id, liked ? 'unlike' : 'like');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ListItem 
        sx={{ 
          alignItems: 'flex-start',
          padding: '8px 16px',
          '&:hover': {
            backgroundColor: 'background.hover',
            '& .message-actions': {
              opacity: 1,
            },
          },
        }}
      >
        <Avatar 
          sx={{ 
            width: 40, 
            height: 40, 
            mr: 2,
            bgcolor: message.user?.avatar_color || 'primary.main',
          }}
        >
          {message.user?.username?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                color: message.user?.role_color || 'text.primary',
                mr: 1,
              }}
            >
              {message.user?.username || 'Unknown User'}
            </Typography>
            
            {message.user?.role && (
              <Chip 
                label={message.user.role}
                size="small"
                sx={{ 
                  height: 16,
                  fontSize: '0.6rem',
                  mr: 1,
                  bgcolor: message.user.role_color + '20',
                  color: message.user.role_color,
                }}
              />
            )}
            
            <Typography variant="caption" color="text.secondary">
              {formatMessageTime(message.created_at)}
            </Typography>
            
            {message.is_edited && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (編集済み)
              </Typography>
            )}
          </Box>
          
          {message.reply_to && (
            <Box 
              sx={{ 
                ml: 2,
                pl: 2,
                borderLeft: '3px solid',
                borderColor: 'divider',
                mb: 1,
                opacity: 0.7,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                返信先: {message.reply_to.user?.username}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {message.reply_to.content.slice(0, 50)}...
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
          
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {message.attachments.map((attachment, index) => (
                <Chip
                  key={index}
                  label={attachment.filename}
                  size="small"
                  icon={<AttachIcon />}
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
          
          {/* 反応（リアクション）表示 */}
          {message.reactions && message.reactions.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {message.reactions.map((reaction, index) => (
                <Chip
                  key={index}
                  label={`${reaction.emoji} ${reaction.count}`}
                  size="small"
                  variant="outlined"
                  onClick={() => onReact && onReact(message.id, reaction.emoji)}
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}
        </Box>
        
        {/* メッセージアクション */}
        <Box 
          className="message-actions"
          sx={{ 
            opacity: 0,
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Tooltip title="いいね">
            <IconButton size="small" onClick={handleLike}>
              {liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="返信">
            <IconButton size="small" onClick={() => onReply && onReply(message)}>
              <ReplyIcon />
            </IconButton>
          </Tooltip>
          
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {isOwnMessage && (
            <MenuItem onClick={() => { onEdit && onEdit(message); handleMenuClose(); }}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              編集
            </MenuItem>
          )}
          
          <MenuItem onClick={() => { onReply && onReply(message); handleMenuClose(); }}>
            <ReplyIcon sx={{ mr: 1 }} fontSize="small" />
            返信
          </MenuItem>
          
          <MenuItem onClick={() => { handleMenuClose(); }}>
            <PinIcon sx={{ mr: 1 }} fontSize="small" />
            ピン留め
          </MenuItem>
          
          {(isOwnMessage || currentUser?.is_teacher) && (
            <MenuItem 
              onClick={() => { onDelete && onDelete(message.id); handleMenuClose(); }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              削除
            </MenuItem>
          )}
        </Menu>
      </ListItem>
    </motion.div>
  );
};

const Chat = ({ token, channelId = 1 }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Socket.IO認証
    socket.emit('authenticate', token);
    
    // ユーザー情報を取得
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(user => setCurrentUser(user))
      .catch(console.error);

    // Socket.ioイベントリスナー
    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    socket.on('authentication_error', (error) => {
      console.error('Socket auth error:', error);
    });

    socket.on('new_message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('message updated', (updatedMsg) => {
      setMessages((prevMessages) => 
        prevMessages.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg)
      );
    });

    socket.on('message deleted', (messageId) => {
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== messageId)
      );
    });

    socket.on('users online', (users) => {
      setOnlineUsers(users);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // チャンネルに参加
    socket.emit('join_channel', channelId);

    return () => {
      socket.off('authenticated');
      socket.off('authentication_error'); 
      socket.off('new_message');
      socket.off('chat message');
      socket.off('message updated');
      socket.off('message deleted');
      socket.off('users online');
      socket.off('error');
    };
  }, [token, channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const messageData = {
      content: message.trim(),
      channel_id: channelId,
      user_id: currentUser?.id,
      reply_to: replyTo?.id || null,
      timestamp: new Date().toISOString(),
    };

    if (editingMessage) {
      // 編集モード
      socket.emit('edit_message', {
        id: editingMessage.id,
        content: message.trim(),
      });
      setEditingMessage(null);
    } else {
      // 新規メッセージ - バックエンドのイベント名に合わせる
      socket.emit('send_message', messageData);
    }

    setMessage('');
    setReplyTo(null);
  };

  const handleReply = (messageToReply) => {
    setReplyTo(messageToReply);
    setEditingMessage(null);
  };

  const handleEdit = (messageToEdit) => {
    setEditingMessage(messageToEdit);
    setMessage(messageToEdit.content);
    setReplyTo(null);
  };

  const handleDelete = (messageId) => {
    socket.emit('delete message', messageId);
  };

  const handleReact = (messageId, emoji) => {
    socket.emit('react to message', { messageId, emoji });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessage('');
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default',
    }}>
      {/* チャットヘッダー */}
      <Paper 
        elevation={1}
        sx={{ 
          p: 2, 
          borderRadius: 0,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TagIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              一般
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              部活のメインチャットルーム
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={onlineUsers.length} color="success">
              <Typography variant="body2" color="text.secondary">
                メンバー
              </Typography>
            </Badge>
          </Box>
        </Box>
      </Paper>

      {/* メッセージ一覧 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        bgcolor: 'background.channel',
      }}>
        <List sx={{ py: 0 }}>
          <AnimatePresence>
            {messages.map((msg, index) => {
              const showDateSeparator = index === 0 || 
                !isToday(new Date(msg.created_at)) !== !isToday(new Date(messages[index - 1]?.created_at));
              
              return (
                <React.Fragment key={msg.id || index}>
                  {showDateSeparator && (
                    <Box sx={{ textAlign: 'center', my: 2 }}>
                      <Divider>
                        <Typography variant="caption" color="text.secondary">
                          {isToday(new Date(msg.created_at)) 
                            ? '今日' 
                            : isYesterday(new Date(msg.created_at))
                            ? '昨日'
                            : format(new Date(msg.created_at), 'yyyy年MM月dd日')
                          }
                        </Typography>
                      </Divider>
                    </Box>
                  )}
                  
                  <MessageItem
                    message={msg}
                    currentUser={currentUser}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReact={handleReact}
                  />
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* 返信/編集インジケーター */}
      {(replyTo || editingMessage) && (
        <Box sx={{ 
          px: 2, 
          py: 1, 
          bgcolor: 'action.selected',
          borderTop: 1,
          borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReplyIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {editingMessage 
                  ? 'メッセージを編集中...' 
                  : `${replyTo?.user?.username}への返信`
                }
              </Typography>
            </Box>
            <Button 
              size="small" 
              onClick={editingMessage ? cancelEdit : cancelReply}
            >
              キャンセル
            </Button>
          </Box>
          
          {replyTo && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4, opacity: 0.7 }}
            >
              {replyTo.content.slice(0, 100)}...
            </Typography>
          )}
        </Box>
      )}

      {/* メッセージ入力エリア */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder={
            editingMessage 
              ? 'メッセージを編集...' 
              : replyTo 
              ? `${replyTo.user?.username}に返信...`
              : 'メッセージを送信...'
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="絵文字">
                    <IconButton size="small">
                      <EmojiIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="ファイル添付">
                    <IconButton size="small">
                      <AttachIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="送信">
                    <IconButton 
                      color="primary" 
                      onClick={sendMessage}
                      disabled={!message.trim()}
                    >
                      <SendIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Chat;