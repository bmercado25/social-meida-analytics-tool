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
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '600px',
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
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#c9d1d9' }}>
                No Script Found
              </h2>
              {videoTitle && (
                <p style={{ margin: '0.5rem 0 0 0', color: '#8b949e', fontSize: '0.875rem' }}>
                  {videoTitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
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
            <p style={{ color: '#c9d1d9', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              This video doesn't have a script yet. Would you like to assign an existing pending script, or create a new one?
            </p>

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

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: '#c9d1d9',
                  fontSize: '0.875rem',
                }}
              >
                Assign Existing Pending Script:
              </label>
              <select
                value={selectedUnassignedId}
                onChange={(e) => setSelectedUnassignedId(e.target.value)}
                disabled={linking}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#0d1117',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: linking ? 'not-allowed' : 'pointer',
                  marginBottom: '0.75rem',
                }}
              >
                <option value="">Select an unassigned script...</option>
                {unassignedEmbeddings.map((embedding) => (
                  <option key={embedding.id} value={embedding.id}>
                    Script #{embedding.id.substring(0, 8)}
                    {embedding.topic && ` - ${embedding.topic.substring(0, 50)}`}
                    {embedding.hook && ` (${embedding.hook.substring(0, 30)}...)`}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLinkUnassigned}
                disabled={!selectedUnassignedId || linking}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: linking ? '#6c757d' : '#238636',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !selectedUnassignedId || linking ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {linking ? 'Assigning...' : 'Assign Selected Script'}
              </button>
            </div>

            <div
              style={{
                padding: '1rem',
                backgroundColor: '#0d1117',
                borderRadius: '4px',
                border: '1px solid #30363d',
                marginBottom: '1rem',
              }}
            >
              <p style={{ color: '#8b949e', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>
                OR
              </p>
            </div>

            <button
              onClick={handleCreateNew}
              disabled={linking}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#21262d',
                color: '#c9d1d9',
                border: '1px solid #30363d',
                borderRadius: '4px',
                cursor: linking ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Create New Script
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
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
            position: 'sticky',
            top: 0,
            backgroundColor: '#161b22',
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#c9d1d9' }}>
              Edit Video Embeddings
            </h2>
            {videoTitle && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#8b949e', fontSize: '0.875rem' }}>
                {videoTitle}
              </p>
            )}
            <p style={{ margin: '0.25rem 0 0 0', color: '#8b949e', fontSize: '0.75rem' }}>
              Video ID: {videoId}
            </p>
          </div>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading embedding data...</p>
              </div>
            ) : (
              <>
                {error && !loading && (
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

                {success && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#1a472a',
                      color: '#7ee787',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      border: '1px solid #238636',
                    }}
                  >
                    ✅ Successfully updated embedding!
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
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
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
              </>
            )}
          </div>

          <div
            style={{
              padding: '1.5rem',
              borderTop: '1px solid #30363d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
              backgroundColor: '#161b22',
            }}
          >
            <button
              type="button"
              onClick={handlePreviewJson}
              disabled={loading || saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading && !saving) {
                  e.currentTarget.style.backgroundColor = '#138496';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !saving) {
                  e.currentTarget.style.backgroundColor = '#17a2b8';
                }
              }}
            >
              📄 Preview JSON
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: saving ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
              >
                {saving ? 'Updating...' : 'Update'}
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
