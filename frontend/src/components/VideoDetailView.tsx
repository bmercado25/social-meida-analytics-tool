import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { ViewsChart } from './ViewsChart';

interface VideoDetailViewProps {
  video: any; // Full video row from youtube_videos
  onClose: () => void;
}

export const VideoDetailView: React.FC<VideoDetailViewProps> = ({ video, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [embedding, setEmbedding] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchEmbedding();
    fetchStats();
  }, [video.video_id]);

  const fetchEmbedding = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/youtube/embeddings/${video.video_id}`);
      if (response.data.data) {
        setEmbedding(response.data.data);
      }
    } catch (err: any) {
      // 404 is okay - means no embedding exists yet
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error?.message || err.message || 'Failed to fetch embedding');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiClient.get(`/api/youtube/stats/${video.video_id}`);
      if (response.data.success) {
        const { historical, current } = response.data.data;
        
        // Combine historical data with current data
        const chartData: any[] = [];
        
        // Add historical points
        if (historical && historical.length > 0) {
          historical.forEach((stat: any) => {
            chartData.push({
              date: new Date(stat.recorded_at),
              views: stat.view_count || 0,
              label: new Date(stat.recorded_at).toLocaleString(),
            });
          });
        }
        
        // Add current data point if available
        if (current && current.view_count !== undefined) {
          const currentDate = current.last_synced_at 
            ? new Date(current.last_synced_at)
            : new Date();
          chartData.push({
            date: currentDate,
            views: current.view_count || 0,
            label: `Current (${currentDate.toLocaleString()})`,
          });
        }
        
        // Sort by date
        chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        setStatsData(chartData);
      }
    } catch (err: any) {
      // 404 or other errors are okay - just means no stats yet
      console.log('No stats data available:', err.message);
      setStatsData([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
      if (value >= 1000) return (value / 1000).toFixed(2) + 'K';
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderField = (label: string, value: any, isLarge = false) => {
    const formattedValue = formatValue(value);
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#8b949e',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.25rem',
                          }}
        >
          {label}
        </div>
        <div
                          style={{
                            fontSize: isLarge ? '1rem' : '0.875rem',
                            color: '#c9d1d9',
                            wordBreak: 'break-word',
                            whiteSpace: isLarge ? 'pre-wrap' : 'normal',
                            lineHeight: isLarge ? '1.6' : '1.4',
                            padding: isLarge ? '0.75rem' : '0',
                            backgroundColor: isLarge ? '#0d1117' : 'transparent',
                            borderRadius: isLarge ? '4px' : '0',
                            border: isLarge ? '1px solid #30363d' : 'none',
                          }}
        >
          {formattedValue}
        </div>
      </div>
    );
  };

  // Organize video columns by importance
  const videoSections = [
    {
      title: 'Core Information',
      fields: [
        { key: 'video_id', label: 'Video ID' },
        { key: 'title', label: 'Title' },
        { key: 'channel_name', label: 'Channel Name' },
        { key: 'published_at', label: 'Published At' },
      ],
    },
    {
      title: 'Engagement Metrics',
      fields: [
        { key: 'view_count', label: 'Views' },
        { key: 'like_count', label: 'Likes' },
        { key: 'comment_count', label: 'Comments' },
        { key: 'engagement_rate', label: 'Engagement Rate' },
        { key: 'days_since_published', label: 'Days Since Published' },
      ],
    },
    {
      title: 'Media',
      fields: [
        { key: 'thumbnail_url', label: 'Thumbnail URL' },
      ],
    },
  ];

  // Embedding sections organized by importance
  const embeddingSections = [
    {
      title: 'Content Strategy',
      fields: [
        { key: 'topic', label: 'Topic', isLarge: true },
        { key: 'format', label: 'Format' },
        { key: 'hook', label: 'Hook', isLarge: true },
        { key: 'style', label: 'Style' },
      ],
    },
    {
      title: 'Creative Elements',
      fields: [
        { key: 'gimmick', label: 'Gimmick', isLarge: true },
        { key: 'poc', label: 'POC (Proof of Concept)', isLarge: true },
        { key: 'end_cta', label: 'End CTA', isLarge: true },
      ],
    },
    {
      title: 'Full Content',
      fields: [
        { key: 'script', label: 'Script', isLarge: true },
        { key: 'embedding_text', label: 'Embedding Text', isLarge: true },
      ],
    },
  ];

  // Get all other video fields not in sections
  const videoSectionKeys = new Set(
    videoSections.flatMap((section) => section.fields.map((f) => f.key))
  );
  const otherVideoFields = Object.keys(video)
    .filter((key) => !videoSectionKeys.has(key))
    .map((key) => ({ key, label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }));

  // Get all other embedding fields not in sections
  const embeddingSectionKeys = new Set(
    embeddingSections.flatMap((section) => section.fields.map((f) => f.key))
  );
  const otherEmbeddingFields = embedding
    ? Object.keys(embedding)
        .filter((key) => !embeddingSectionKeys.has(key) && key !== 'video_id')
        .map((key) => ({
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        }))
    : [];

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
          maxWidth: '1000px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
          border: '1px solid #30363d',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              Video Details
            </h2>
            {video.title && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#8b949e', fontSize: '0.875rem' }}>
                {video.title}
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

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading embedding data...</p>
            </div>
          ) : (
            <>
              {error && (
                <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#3d2817',
                  color: '#d29922',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  border: '1px solid #bb8009',
                }}
                >
                  ⚠️ {error}
                </div>
              )}

              {/* Video Sections */}
              {videoSections.map((section) => (
                <div key={section.title} style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#c9d1d9',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #30363d',
                    }}
                  >
                    {section.title}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {section.fields.map((field) => {
                      // Special handling for thumbnail URL
                      if (field.key === 'thumbnail_url' && video[field.key]) {
                        return (
                          <div key={field.key} style={{ marginBottom: '1rem', gridColumn: '1 / -1' }}>
                            <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#8b949e',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.25rem',
                          }}
                            >
                              {field.label}
                            </div>
                            <img
                              src={video[field.key]}
                              alt="Thumbnail"
                              style={{
                                maxWidth: '300px',
                                maxHeight: '200px',
                              borderRadius: '4px',
                              border: '1px solid #30363d',
                            }}
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6c757d', wordBreak: 'break-all' }}>
                              {video[field.key]}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={field.key}>
                          {renderField(field.label, video[field.key], field.isLarge)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Views Growth Chart */}
              <div style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#495057',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid #dee2e6',
                  }}
                >
                  View Growth Over Time
                </h3>
                <div
                  style={{
                    backgroundColor: '#0d1117',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    border: '1px solid #30363d',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {statsLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#8b949e' }}>
                      Loading chart data...
                    </div>
                  ) : (
                    <ViewsChart data={statsData} width={900} height={300} />
                  )}
                </div>
              </div>

              {/* Embedding Sections */}
              {embedding ? (
                embeddingSections.map((section) => (
                  <div key={section.title} style={{ marginBottom: '2rem' }}>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#495057',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #dee2e6',
                      }}
                    >
                      {section.title}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      {section.fields.map((field) => (
                        <div key={field.key} style={{ gridColumn: field.isLarge ? '1 / -1' : 'auto' }}>
                          {renderField(field.label, embedding[field.key], field.isLarge)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#0d1117', borderRadius: '4px', border: '1px solid #30363d' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#c9d1d9',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Embedding Data
                  </h3>
                  <p style={{ margin: 0, color: '#8b949e' }}>
                    No embedding data found for this video. Use "Edit Embeddings" to create one.
                  </p>
                </div>
              )}

              {/* Other Video Fields */}
              {otherVideoFields.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#c9d1d9',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #30363d',
                    }}
                  >
                    Additional Video Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {otherVideoFields.map((field) => (
                      <div key={field.key}>
                        {renderField(field.label, video[field.key])}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Embedding Fields */}
              {otherEmbeddingFields.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#c9d1d9',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #30363d',
                    }}
                  >
                    Additional Embedding Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {otherEmbeddingFields.map((field) => (
                      <div key={field.key}>
                        {renderField(field.label, embedding[field.key])}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
