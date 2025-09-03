import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const PostDetail = ({ token }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await api.getPost(id, token);
        if (data) {
          setPost(data);
        } else {
          setError(data.error || 'Failed to fetch post');
        }
      } catch (err) {
        setError('Network error or server is down');
      }
    };

    if (token && id) {
      fetchPost();
    }
  }, [token, id]);

  if (!post) {
    return <p>{error || 'Loading post...'}</p>;
  }

  return (
    <div>
      <h2>{post.title} ({post.type})</h2>
      <p><strong>Content:</strong></p>
      <div>{post.content}</div>
      <p><strong>Author ID:</strong> {post.author_id}</p>
      <p><strong>Created At:</strong> {new Date(post.created_at).toLocaleString()}</p>
      <p><strong>Updated At:</strong> {new Date(post.updated_at).toLocaleString()}</p>
    </div>
  );
};

export default PostDetail;
