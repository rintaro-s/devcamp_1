import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const WikiManagement = ({ token }) => {
  const [wikiPages, setWikiPages] = useState([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [editingWikiPage, setEditingWikiPage] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWikiPages();
  }, [token]);

  const fetchWikiPages = async () => {
    setLoading(true);
    try {
      const data = await api.getWikiPages(token);
      if (Array.isArray(data)) {
        setWikiPages(data);
        setError('');
      } else if (data && typeof data === 'object' && Array.isArray(data.pages)) {
        setWikiPages(data.pages);
        setError('');
      } else {
        console.warn('fetchWikiPages: unexpected response shape', data);
        setWikiPages([]);
        setError('Failed to fetch wiki pages (unexpected response)');
      }
    } catch (err) {
      console.error('fetchWikiPages error:', err);
      setError('Network error or server is down');
      setWikiPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (editingWikiPage) {
        data = await api.updateWikiPage(editingWikiPage.slug, { title, content }, token);
        setMessage('Wiki page updated successfully!');
      } else {
        data = await api.createWikiPage({ slug, title, content }, token);
        setMessage('Wiki page created successfully!');
      }
      if (data) {
        fetchWikiPages();
        setTitle('');
        setSlug('');
        setContent('');
        setEditingWikiPage(null);
        setError('');
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error or server is down');
    }
  };

  const handleEdit = (wikiPage) => {
    setEditingWikiPage(wikiPage);
    setTitle(wikiPage.title);
    setSlug(wikiPage.slug);
    setContent(wikiPage.content);
  };

  const handleDelete = async (slugToDelete) => {
    if (window.confirm('Are you sure you want to delete this wiki page?')) {
      try {
        const data = await api.deleteWikiPage(slugToDelete, token);
        if (data) {
          setMessage('Wiki page deleted successfully!');
          fetchWikiPages();
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
      <h2>Wiki Management</h2>
      <form onSubmit={handleSubmit}>
        <h3>{editingWikiPage ? 'Edit Wiki Page' : 'Create New Wiki Page'}</h3>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Slug (URL path):</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={!!editingWikiPage} />
        </div>
        <div>
          <label>Content:</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required></textarea>
        </div>
        <button type="submit">{editingWikiPage ? 'Update' : 'Create'}</button>
        {editingWikiPage && <button type="button" onClick={() => setEditingWikiPage(null)}>Cancel</button>}
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Wiki Pages</h3>
      {loading ? (
        <p>Loading wiki pages...</p>
      ) : wikiPages && Array.isArray(wikiPages) && wikiPages.length > 0 ? (
        <ul>
          {wikiPages.map((page) => (
            <li key={page.id}>
              <Link to={`/wiki/${page.slug}`}>{page.title}</Link>
              <button onClick={() => handleEdit(page)}>Edit</button>
              <button onClick={() => handleDelete(page.slug)}>Delete</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No wiki pages found.</p>
      )}
    </div>
  );
};

export default WikiManagement;
