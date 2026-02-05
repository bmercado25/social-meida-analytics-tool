import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';

interface PendingEmbedding {
  id: string;
  video_id: string | null;
  topic: string | null;
  format: string | null;
  poc: string | null;
  hook: string | null;
  style: string | null;
  gimmick: string | null;
  end_cta: string | null;
  script: string | null;
  embedding_text: string | null;
  created_at?: string;
}

export const PendingEmbeddings: React.FC = () => {
  const [embeddings, setEmbeddings] = useState<PendingEmbedding[]>([]);
  const [availableVideos, setAvailableVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<PendingEmbedding | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pending scripts (this should never query youtube_videos)
      const embeddingsRes = await apiClient.get('/api/youtube/embeddings/unassigned/list');
      setEmbeddings(embeddingsRes.data.data || []);
      
      // Fetch available videos separately and handle errors gracefully
      // This is only needed when assigning, so it's okay if it fails
      try {
        const videosRes = await apiClient.get('/api/youtube/embeddings/available-videos');
        setAvailableVideos(videosRes.data.data || []);
      } catch (videoErr: any) {
        // Silently fail - available videos are only needed for assignment
        // If this fails, the assignment dropdown will just be empty
        console.warn('Could not fetch available videos:', videoErr);
        setAvailableVideos([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch pending scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const newEmbedding: PendingEmbedding = {
      id: 'new',
      video_id: null,
      topic: null,
      format: null,
      poc: null,
      hook: null,
      style: null,
      gimmick: null,
      end_cta: null,
      script: null,
      embedding_text: null,
    };
    setEditingData(newEmbedding);
    setEditingId('new');
  };

  const handleEdit = (embedding: PendingEmbedding) => {
    setEditingData({ ...embedding });
    setEditingId(embedding.id);
  };

  const handleSave = async () => {
    if (!editingData) return;

    try {
      if (editingId === 'new') {
        // Create new
        await apiClient.post('/api/youtube/embeddings/unassigned', editingData);
      } else {
        // Update existing
        await apiClient.put(`/api/youtube/embeddings/by-id/${editingId}`, editingData);
      }
      await fetchData();
      setEditingId(null);
      setEditingData(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save');
    }
  };

  const handleAssign = async (embeddingId: string) => {
    if (!selectedVideoId) {
      setError('Please select a video');
      return;
    }

    try {
      setAssigningId(embeddingId);
      await apiClient.put(`/api/youtube/embeddings/${embeddingId}/assign`, {
        video_id: selectedVideoId,
      });
      await fetchData();
      setSelectedVideoId('');
      setAssigningId(null);
      // Close edit modal if assignment was done from edit modal
      if (editingId === embeddingId) {
        setEditingId(null);
        setEditingData(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to assign video');
      setAssigningId(null);
    }
  };

  const handleUnassign = async (embeddingId: string) => {
    if (!confirm('Are you sure you want to unassign this video?')) return;

    try {
      await apiClient.put(`/api/youtube/embeddings/${embeddingId}/unassign`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to unassign video');
    }
  };

  const handleDelete = async (embeddingId: string) => {
    if (!confirm('Are you sure you want to delete this embedding? This cannot be undone.')) return;

    try {
      await apiClient.delete(`/api/youtube/embeddings/${embeddingId}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to delete');
    }
  };

  // Check if script is pending (null video_id means it's a script for a future video)
  // Also handles legacy PENDING_ placeholders for backward compatibility
  const isUnassigned = (videoId: string | null): boolean => {
    return !videoId || (videoId && videoId.startsWith('PENDING_'));
  };

  const textAreaFields = [
    { key: 'topic' as const, label: 'Topic' },
    { key: 'format' as const, label: 'Format' },
    { key: 'poc' as const, label: 'POC' },
    { key: 'hook' as const, label: 'Hook' },
    { key: 'style' as const, label: 'Style' },
    { key: 'gimmick' as const, label: 'Gimmick' },
    { key: 'end_cta' as const, label: 'End CTA' },
    { key: 'script' as const, label: 'Script' },
    { key: 'embedding_text' as const, label: 'Embedding Text' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>
        Loading pending scripts...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#c9d1d9' }}>
          Pending Scripts ({embeddings.length})
        </h2>
        <button
          onClick={handleCreateNew}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#238636',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          + Create New Script
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#5a1f1f',
            color: '#ff7b72',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #da3633',
          }}
        >
          {error}
        </div>
      )}

      {editingId && editingData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => {
            setEditingId(null);
            setEditingData(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#161b22',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
              border: '1px solid #30363d',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#c9d1d9' }}>
                {editingId === 'new' ? 'Create New Script' : 'Edit Script'}
              </h3>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditingData(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#8b949e',
                  padding: '0.5rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Video Assignment Section in Edit Modal */}
              {isUnassigned(editingData.video_id) && availableVideos.length > 0 && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#0d1117',
                    borderRadius: '4px',
                    border: '1px solid #30363d',
                    marginBottom: '1.5rem',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 500,
                      color: '#c9d1d9',
                      fontSize: '0.875rem',
                    }}
                  >
                    Assign to video (videos without scripts only):
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => setSelectedVideoId(e.target.value)}
                      disabled={assigningId === editingId}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '0.5rem',
                        backgroundColor: '#21262d',
                        color: '#c9d1d9',
                        border: '1px solid #30363d',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: assigningId === editingId ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <option value="">Select a video...</option>
                      {availableVideos.map((video) => (
                        <option key={video.video_id} value={video.video_id}>
                          {video.title || video.video_id} ({video.view_count?.toLocaleString() || 0} views)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => editingId && handleAssign(editingId)}
                      disabled={!selectedVideoId || assigningId === editingId}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: assigningId === editingId ? '#6c757d' : '#238636',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !selectedVideoId || assigningId === editingId ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {assigningId === editingId ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {textAreaFields.map((field) => (
                  <div key={field.key}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                        color: '#c9d1d9',
                        fontSize: '0.875rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {field.label}
                    </label>
                    <textarea
                      value={editingData[field.key] || ''}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          [field.key]: e.target.value || null,
                        })
                      }
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '0.75rem',
                        border: '1px solid #30363d',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        backgroundColor: '#0d1117',
                        color: '#c9d1d9',
                      }}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                borderTop: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
              }}
            >
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditingData(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#238636',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {embeddings.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#8b949e',
            backgroundColor: '#0d1117',
            borderRadius: '4px',
            border: '1px solid #30363d',
          }}
        >
          No pending scripts. Create a new script for a future video.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {embeddings.map((embedding) => (
            <div
              key={embedding.id}
              style={{
                backgroundColor: '#161b22',
                borderRadius: '8px',
                padding: '1.5rem',
                border: '1px solid #30363d',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#c9d1d9' }}>
                      Script #{embedding.id.substring(0, 8)}
                    </h3>
                    {!isUnassigned(embedding.video_id) && (
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#1a472a',
                          color: '#7ee787',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        Assigned
                      </span>
                    )}
                  </div>
                  {embedding.topic && (
                    <div style={{ color: '#8b949e', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <strong>Topic:</strong> {embedding.topic}
                    </div>
                  )}
                  {embedding.hook && (
                    <div style={{ color: '#8b949e', fontSize: '0.875rem' }}>
                      <strong>Hook:</strong> {embedding.hook.substring(0, 100)}
                      {embedding.hook.length > 100 && '...'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(embedding)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#21262d',
                      color: '#c9d1d9',
                      border: '1px solid #30363d',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    Edit
                  </button>
                  {!isUnassigned(embedding.video_id) && (
                    <button
                      onClick={() => handleUnassign(embedding.id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#5a1f1f',
                        color: '#ff7b72',
                        border: '1px solid #da3633',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Unassign
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(embedding.id)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#5a1f1f',
                      color: '#ff7b72',
                      border: '1px solid #da3633',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Assign Video Section */}
              {isUnassigned(embedding.video_id) && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#0d1117',
                    borderRadius: '4px',
                    border: '1px solid #30363d',
                    marginTop: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ color: '#c9d1d9', fontSize: '0.875rem', fontWeight: 500 }}>
                      Assign to video (videos without scripts only):
                    </label>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => setSelectedVideoId(e.target.value)}
                      disabled={assigningId === embedding.id}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '0.5rem',
                        backgroundColor: '#21262d',
                        color: '#c9d1d9',
                        border: '1px solid #30363d',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: assigningId === embedding.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <option value="">Select a video...</option>
                      {availableVideos.map((video) => (
                        <option key={video.video_id} value={video.video_id}>
                          {video.title || video.video_id} ({video.view_count?.toLocaleString() || 0} views)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(embedding.id)}
                      disabled={!selectedVideoId || assigningId === embedding.id}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: assigningId === embedding.id ? '#6c757d' : '#238636',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !selectedVideoId || assigningId === embedding.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {assigningId === embedding.id ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              )}

              {!isUnassigned(embedding.video_id) && (
                <div style={{ marginTop: '0.5rem', color: '#8b949e', fontSize: '0.875rem' }}>
                  Assigned to: <strong>{embedding.video_id}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
