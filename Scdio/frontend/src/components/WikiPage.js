import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const WikiPage = ({ token }) => {
  const { slug } = useParams();
  const [wikiPage, setWikiPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWikiPage = async () => {
      try {
        const data = await api.getWikiPage(slug, token);
        if (data) {
          setWikiPage(data);
        } else {
          setError(data.error || 'Failed to fetch wiki page');
        }
      } catch (err) {
        setError('Network error or server is down');
      }
    };

    if (token && slug) {
      fetchWikiPage();
    }
  }, [token, slug]);

  if (!wikiPage) {
    return <p>{error || 'Loading wiki page...'}</p>;
  }

  return (
    <div>
      <h2>{wikiPage.title}</h2>
      <p><strong>Slug:</strong> {wikiPage.slug}</p>
      <p><strong>Content:</strong></p>
      <div>{wikiPage.content}</div>
      <p><strong>Author ID:</strong> {wikiPage.author_id}</p>
      <p><strong>Created At:</strong> {new Date(wikiPage.created_at).toLocaleString()}</p>
      <p><strong>Updated At:</strong> {new Date(wikiPage.updated_at).toLocaleString()}</p>
    </div>
  );
};

export default WikiPage;
