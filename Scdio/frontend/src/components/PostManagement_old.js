import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const PostManagement = ({ token }) => {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('diary');
  const [editingPost, setEditingPost] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      const data = await api.getPosts(token);
      if (data) {
        // Defensive programming: ensure data is an array
        const postsArray = Array.isArray(data) ? data : (data.posts && Array.isArray(data.posts)) ? data.posts : [];
        setPosts(postsArray);
      } else {
        setError(data?.error || 'Failed to fetch posts');
        setPosts([]);
      }
    } catch (err) {
      setError('Network error or server is down');
      setPosts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (editingPost) {
        data = await api.updatePost(editingPost.id, { title, content, type }, token);
        setMessage('Post updated successfully!');
      } else {
        data = await api.createPost({ title, content, type }, token);
        setMessage('Post created successfully!');
      }
      if (data) {
        fetchPosts();
        setTitle('');
        setContent('');
        setType('diary');
        setEditingPost(null);
        setError('');
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error or server is down');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setType(post.type);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const data = await api.deletePost(id, token);
        if (data) {
          setMessage('Post deleted successfully!');
          fetchPosts();
          setError('');
        } else {
          setError(data.error || 'Deletion failed');
        }
      } catch (err) {
        setError('Network error or server is down');
      }
    }
  };

  return (
    <div>
      <h2>Post Management (Diary & Album)</h2>
      <form onSubmit={handleSubmit}>
        <h3>{editingPost ? 'Edit Post' : 'Create New Post'}</h3>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Content:</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required></textarea>
        </div>
        <div>
          <label>Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="diary">Diary</option>
            <option value="album">Album</option>
          </select>
        </div>
        <button type="submit">{editingPost ? 'Update' : 'Create'}</button>
        {editingPost && <button type="button" onClick={() => setEditingPost(null)}>Cancel</button>}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Post List</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/posts/${post.id}`}>{post.title} ({post.type})</Link>
            <button onClick={() => handleEdit(post)}>Edit</button>
            <button onClick={() => handleDelete(post.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostManagement;
