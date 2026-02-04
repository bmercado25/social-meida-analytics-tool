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
      const response = await apiClient.get(`/api/youtube/embeddings/${videoId}`);
      if (response.data.data) {
        setFormData(response.data.data);
      }
    } catch (err: any) {
      // If 404, it means no embedding exists yet - that's okay, we'll create it
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error?.message || err.message || 'Failed to fetch embedding');
      }
    } finally {
      setLoading(false);
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
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              Edit Video Embeddings
            </h2>
            {videoTitle && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: '0.875rem' }}>
                {videoTitle}
              </p>
            )}
            <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.75rem' }}>
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
              color: '#6c757d',
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
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      borderRadius: '4px',
                      marginBottom: '1rem',
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
                          color: '#495057',
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
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
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
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
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
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
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
                backgroundColor: '#f8f9fa',
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
