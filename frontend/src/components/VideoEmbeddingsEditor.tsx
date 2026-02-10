import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';

interface VideoEmbedding {
  id?: string;
  video_id: string;
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

interface VideoEmbeddingsEditorProps {
  videoId: string;
  videoTitle?: string;
  videoData?: any; // Full video row data from youtube_videos table
  onClose: () => void;
  onUpdate?: () => void;
}

export const VideoEmbeddingsEditor: React.FC<VideoEmbeddingsEditorProps> = ({
  videoId,
  videoTitle,
  videoData,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [embeddingExists, setEmbeddingExists] = useState<boolean>(false);
  const [unassignedEmbeddings, setUnassignedEmbeddings] = useState<any[]>([]);
  const [showLinkOptions, setShowLinkOptions] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedUnassignedId, setSelectedUnassignedId] = useState<string>('');
  const [linking, setLinking] = useState(false);
  const [formData, setFormData] = useState<VideoEmbedding>({
    video_id: videoId,
    topic: null,
    format: null,
    poc: null,
    hook: null,
    style: null,
    gimmick: null,
    end_cta: null,
    script: null,
    embedding_text: null,
  });

  useEffect(() => {
    fetchEmbedding();
  }, [videoId]);

  const fetchEmbedding = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if embedding exists (without creating)
      const checkResponse = await apiClient.get(`/api/youtube/embeddings/${videoId}/check`);
      
      if (checkResponse.data.exists && checkResponse.data.data) {
        // Embedding exists, fetch full data
        const response = await apiClient.get(`/api/youtube/embeddings/${videoId}`);
        if (response.data.data) {
          setFormData(response.data.data);
          setEmbeddingExists(true);
          setShowAssignmentModal(false);
        }
      } else {
        // No embedding exists, check for pending scripts to show modal
        setEmbeddingExists(false);
        try {
          const unassignedRes = await apiClient.get('/api/youtube/embeddings/unassigned/list');
          setUnassignedEmbeddings(unassignedRes.data.data || []);
          // Show assignment modal if there are unassigned embeddings
          if (unassignedRes.data.data && unassignedRes.data.data.length > 0) {
            setShowAssignmentModal(true);
          } else {
            // No unassigned embeddings, proceed directly to create new
            setShowAssignmentModal(false);
          }
        } catch (fetchErr) {
          // Ignore error fetching unassigned, proceed to create new
          setShowAssignmentModal(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch embedding');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkUnassigned = async () => {
    if (!selectedUnassignedId) {
      setError('Please select an unassigned embedding to link');
      return;
    }

    try {
      setLinking(true);
      setError(null);
      await apiClient.put(`/api/youtube/embeddings/${selectedUnassignedId}/assign`, {
        video_id: videoId,
      });
      // Refresh the embedding
      await fetchEmbedding();
      setShowAssignmentModal(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to link embedding');
    } finally {
      setLinking(false);
    }
  };

  const handleCreateNew = async () => {
    setShowAssignmentModal(false);
    // Create the embedding now using getOrCreateEmbedding
    try {
      const response = await apiClient.get(`/api/youtube/embeddings/${videoId}`);
      if (response.data.data) {
        setFormData(response.data.data);
        setEmbeddingExists(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create embedding');
    }
  };

  const handleChange = (field: keyof VideoEmbedding, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handlePreviewJson = async () => {
    setJsonLoading(true);
    setJsonError(null);
    setShowJsonPreview(true);

    try {
      // Use provided video data or fetch if not available
      let videoRowData = videoData;
      if (!videoRowData) {
        const videoResponse = await apiClient.get(`/api/youtube/videos`);
        const videos = videoResponse.data.data || [];
        videoRowData = videos.find((v: any) => v.video_id === videoId);
        
        if (!videoRowData) {
          throw new Error('Video not found');
        }
      }

      // Fetch embedding data (use current form data as fallback)
      let embeddingData = null;
      try {
        const embeddingResponse = await apiClient.get(`/api/youtube/embeddings/${videoId}`);
        embeddingData = embeddingResponse.data.data;
      } catch (err: any) {
        // If embedding doesn't exist, use current form data (which may have unsaved changes)
        if (err.response?.status === 404) {
          embeddingData = {
            video_id: videoId,
            ...formData,
          };
        } else {
          throw err;
        }
      }

      // Combine both datasets into a single JSON object
      const combinedData = {
        video: videoRowData,
        embedding: embeddingData,
      };

      setJsonData(combinedData);
    } catch (err: any) {
      setJsonError(err.response?.data?.error?.message || err.message || 'Failed to fetch data');
    } finally {
      setJsonLoading(false);
    }
  };

  const copyJsonToClipboard = () => {
    if (jsonData) {
      const jsonString = JSON.stringify(jsonData, null, 2);
      navigator.clipboard.writeText(jsonString).then(() => {
        // Show temporary success message
        const button = document.getElementById('copy-json-btn');
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✓ Copied!';
          button.style.backgroundColor = '#28a745';
          setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '#6c757d';
          }, 2000);
        }
      }).catch((err) => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.put(`/api/youtube/embeddings/${videoId}`, formData);
      setSuccess(true);
      if (onUpdate) {
        onUpdate();
      }
      // Auto-close after 1.5 seconds on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to update embedding');
    } finally {
      setSaving(false);
    }
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

  // Show assignment modal if no embedding exists and there are unassigned embeddings
  if (showAssignmentModal && !embeddingExists && unassignedEmbeddings.length > 0) {
    return (
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
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            border: '1px solid #30363d',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
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
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f0f6fc' }}>
                Script Selection
              </h2>
              {videoTitle && (
                <p style={{ margin: '0.4rem 0 0 0', color: '#8b949e', fontSize: '0.875rem' }}>
                  {videoTitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
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
            <p style={{ color: '#c9d1d9', marginBottom: '1.75rem', fontSize: '0.9375rem', lineHeight: '1.6' }}>
              This video doesn't have an assigned script yet. You can link an existing pending script or create a new one.
            </p>

            {error && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#3d1b1b',
                  color: '#ff7b72',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '1px solid #6e2121',
                  fontSize: '0.9rem'
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: 600,
                  color: '#8b949e',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Link Existing Pending Script
              </label>
              <select
                value={selectedUnassignedId}
                onChange={(e) => setSelectedUnassignedId(e.target.value)}
                disabled={linking}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#0d1117',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: linking ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1f6feb'}
                onBlur={(e) => e.target.style.borderColor = '#30363d'}
              >
                <option value="">Select a script...</option>
                {unassignedEmbeddings.map((embedding) => (
                  <option key={embedding.id} value={embedding.id}>
                    #{embedding.id.substring(0, 8)} {embedding.topic ? `- ${embedding.topic.substring(0, 40)}` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLinkUnassigned}
                disabled={!selectedUnassignedId || linking}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: !selectedUnassignedId || linking ? '#21262d' : '#1f6feb',
                  color: !selectedUnassignedId || linking ? '#484f58' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !selectedUnassignedId || linking ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                {linking ? 'Linking...' : 'Link Selected Script'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#30363d' }}></div>
              <span style={{ color: '#484f58', fontSize: '0.75rem', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#30363d' }}></div>
            </div>

            <button
              onClick={handleCreateNew}
              disabled={linking}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#238636',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: linking ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(35, 134, 54, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!linking) e.currentTarget.style.backgroundColor = '#2ea043';
              }}
              onMouseLeave={(e) => {
                if (!linking) e.currentTarget.style.backgroundColor = '#238636';
              }}
            >
              + Create Blank Script
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
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
      onClick={onClose}
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
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
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
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#f0f6fc' }}>
              Edit Video Script
            </h2>
            {videoTitle && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#8b949e', fontSize: '0.875rem', fontWeight: 500 }}>
                {videoTitle}
              </p>
            )}
            <p style={{ margin: '0.25rem 0 0 0', color: '#484f58', fontSize: '0.75rem' }}>
              ID: {videoId}
            </p>
          </div>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '2rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ animation: 'pulse 1.5s infinite', color: '#8b949e', fontSize: '1rem' }}>Loading script data...</div>
              </div>
            ) : (
              <>
                {error && !loading && (
                  <div
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: '#3d1b1b',
                    color: '#ff7b72',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #6e2121',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  >
                    <span>⚠️</span> {error}
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: '#1a472a',
                      color: '#7ee787',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      border: '1px solid #238636',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <span>✅</span> Successfully updated script!
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
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
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
              </>
            )}
          </div>

          <div
            style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid #30363d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
              backgroundColor: '#161b22',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={handlePreviewJson}
              disabled={loading || saving}
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#21262d',
                color: '#c9d1d9',
                border: '1px solid #30363d',
                borderRadius: '6px',
                cursor: loading || saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading && !saving) {
                  e.currentTarget.style.backgroundColor = '#30363d';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !saving) {
                  e.currentTarget.style.backgroundColor = '#21262d';
                }
              }}
            >
              <span>📄</span> Preview Context
            </button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: 'transparent',
                  color: '#8b949e',
                  border: '1px solid transparent',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#c9d1d9'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8b949e'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || saving}
                style={{
                  padding: '0.6rem 2rem',
                  backgroundColor: loading || saving ? '#21262d' : '#1f6feb',
                  color: loading || saving ? '#484f58' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: loading || saving ? 'none' : '0 2px 8px rgba(31, 111, 235, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading && !saving) {
                    e.currentTarget.style.backgroundColor = '#388bfd';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !saving) {
                    e.currentTarget.style.backgroundColor = '#1f6feb';
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save Script'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* JSON Preview Modal */}
      {showJsonPreview && (
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
            zIndex: 2000,
            padding: '1rem',
          }}
          onClick={() => setShowJsonPreview(false)}
        >
          <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
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
            JSON Preview
          </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  id="copy-json-btn"
                  onClick={copyJsonToClipboard}
                  disabled={!jsonData || jsonLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !jsonData || jsonLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => setShowJsonPreview(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: '0.5rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div
          style={{
            padding: '1.5rem',
            overflow: 'auto',
            flex: 1,
            backgroundColor: '#0d1117',
          }}
            >
              {jsonLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Loading data...</p>
                </div>
              ) : jsonError ? (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '4px',
                  }}
                >
                  {jsonError}
                </div>
              ) : jsonData ? (
                <pre
                  style={{
                    margin: 0,
                    padding: '1rem',
                    backgroundColor: '#282c34',
                    color: '#abb2bf',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  }}
                >
                  {JSON.stringify(jsonData, null, 2)}
                </pre>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
