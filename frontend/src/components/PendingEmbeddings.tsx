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
    <div style={{ 
      padding: '1.5rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#c9d1d9', margin: 0 }}>
          Pending Scripts ({embeddings.length})
        </h2>
        <button
          onClick={handleCreateNew}
          style={{
            padding: '0.6rem 1.25rem',
            backgroundColor: '#A02B2B',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(35, 134, 54, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2ea043';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#A02B2B';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          + Create New Script
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#3d1b1b',
            color: '#ff7b72',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #6e2121',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          <span>⚠️</span> {error}
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
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={() => {
            setEditingId(null);
            setEditingData(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#161b22',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
              border: '1px solid #30363d',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: '#161b22',
                zIndex: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f0f6fc' }}>
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
                  fontSize: '2rem',
                  cursor: 'pointer',
                  color: '#8b949e',
                  padding: '0.25rem',
                  lineHeight: 0.5,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#c9d1d9'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8b949e'}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Video Assignment Section in Edit Modal */}
              {isUnassigned(editingData.video_id) && availableVideos.length > 0 && (
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#0d1117',
                    borderRadius: '10px',
                    border: '1px solid #30363d',
                    marginBottom: '2rem',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontWeight: 600,
                      color: '#c9d1d9',
                      fontSize: '0.9rem',
                    }}
                  >
                    Assign to video (videos without scripts only):
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => setSelectedVideoId(e.target.value)}
                      disabled={assigningId === editingId}
                      style={{
                        flex: 1,
                        minWidth: '250px',
                        padding: '0.6rem 1rem',
                        backgroundColor: '#21262d',
                        color: '#c9d1d9',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        cursor: assigningId === editingId ? 'not-allowed' : 'pointer',
                        outline: 'none',
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
                        padding: '0.6rem 1.25rem',
                        backgroundColor: !selectedVideoId || assigningId === editingId ? '#21262d' : '#1f6feb',
                        color: !selectedVideoId || assigningId === editingId ? '#484f58' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: !selectedVideoId || assigningId === editingId ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {assigningId === editingId ? 'Assigning...' : 'Assign Video'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {textAreaFields.map((field) => (
                  <div key={field.key}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.6rem',
                        fontWeight: 600,
                        color: '#c9d1d9',
                        fontSize: '0.9rem',
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
                        minHeight: field.key === 'script' ? '180px' : '90px',
                        padding: '1rem',
                        border: '1px solid #30363d',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        backgroundColor: '#0d1117',
                        color: '#c9d1d9',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1f6feb'}
                      onBlur={(e) => e.target.style.borderColor = '#30363d'}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '1.5rem 2rem',
                borderTop: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                backgroundColor: '#161b22',
                position: 'sticky',
                bottom: 0,
              }}
            >
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditingData(null);
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#30363d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#21262d'}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '0.6rem 2rem',
                  backgroundColor: '#238636',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(35, 134, 54, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2ea043'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#238636'}
              >
                Save Script
              </button>
            </div>
          </div>
        </div>
      )}

      {embeddings.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#8b949e',
            backgroundColor: '#161b22',
            borderRadius: '12px',
            border: '1px solid #30363d',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.1 }}>📄</div>
          <p style={{ fontSize: '1.1rem', color: '#c9d1d9', marginBottom: '0.5rem' }}>No pending scripts</p>
          <p style={{ fontSize: '0.9rem' }}>Create a new script for a future video to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {embeddings.map((embedding) => (
            <div
              key={embedding.id}
              style={{
                backgroundColor: '#161b22',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #30363d',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#484f58';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#30363d';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f0f6fc', letterSpacing: '0.2px' }}>
                      Script #{embedding.id.substring(0, 8)}
                    </h3>
                    {!isUnassigned(embedding.video_id) ? (
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          backgroundColor: '#1a472a',
                          color: '#7ee787',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          border: '1px solid #238636'
                        }}
                      >
                        ASSIGNED
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          backgroundColor: '#3d2b11',
                          color: '#e3b341',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          border: '1px solid #9e6a03'
                        }}
                      >
                        PENDING
                      </span>
                    )}
                  </div>
                  {embedding.topic && (
                    <div style={{ color: '#c9d1d9', fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {embedding.topic}
                    </div>
                  )}
                  {embedding.hook && (
                    <div style={{ color: '#8b949e', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                      <strong style={{ color: '#7d8590' }}>Hook:</strong> {embedding.hook.substring(0, 120)}
                      {embedding.hook.length > 120 && '...'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button
                    onClick={() => handleEdit(embedding)}
                    title="Edit"
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#21262d',
                      color: '#c9d1d9',
                      border: '1px solid #30363d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#30363d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#21262d'}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(embedding.id)}
                    title="Delete"
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#21262d',
                      color: '#ff7b72',
                      border: '1px solid #30363d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3d1b1b';
                      e.currentTarget.style.borderColor = '#6e2121';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#21262d';
                      e.currentTarget.style.borderColor = '#30363d';
                    }}
                  >
                    <span style={{ opacity: 0.3 }}>🗑️</span>
                  </button>
                </div>
              </div>

              {/* Assign Video Section */}
              {isUnassigned(embedding.video_id) ? (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#0d1117',
                    borderRadius: '8px',
                    border: '1px solid #30363d',
                    marginTop: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ color: '#8b949e', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Assign to live video
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={selectedVideoId}
                        onChange={(e) => setSelectedVideoId(e.target.value)}
                        disabled={assigningId === embedding.id}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: '0.4rem 0.75rem',
                          backgroundColor: '#21262d',
                          color: '#c9d1d9',
                          border: '1px solid #30363d',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          cursor: assigningId === embedding.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <option value="">Select video...</option>
                        {availableVideos.map((video) => (
                          <option key={video.video_id} value={video.video_id}>
                            {video.title || video.video_id}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(embedding.id)}
                        disabled={!selectedVideoId || assigningId === embedding.id}
                        style={{
                          padding: '0.4rem 0.75rem',
                          backgroundColor: !selectedVideoId || assigningId === embedding.id ? '#161b22' : '#1f6feb',
                          color: !selectedVideoId || assigningId === embedding.id ? '#484f58' : 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: !selectedVideoId || assigningId === embedding.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {assigningId === embedding.id ? '...' : 'Link'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  style={{ 
                    marginTop: 'auto', 
                    padding: '0.75rem 1rem', 
                    backgroundColor: '#0d1117', 
                    borderRadius: '8px', 
                    border: '1px solid #23863644',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ color: '#8b949e', fontSize: '0.8125rem' }}>
                    Linked to: <strong style={{ color: '#58a6ff' }}>{embedding.video_id}</strong>
                  </div>
                  <button
                    onClick={() => handleUnassign(embedding.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff7b72',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d1b1b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Unlink
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
