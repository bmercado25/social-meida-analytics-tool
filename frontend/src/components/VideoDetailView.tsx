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
          maxWidth: '1000px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          border: '1px solid #30363d',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              Video Intelligence
            </h2>
            {video.title && (
              <p style={{ margin: '0.4rem 0 0 0', color: '#8b949e', fontSize: '0.875rem', fontWeight: 500 }}>
                {video.title}
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

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ animation: 'pulse 1.5s infinite', color: '#8b949e', fontSize: '1rem' }}>Fetching video intelligence...</div>
            </div>
          ) : (
            <>
              {error && (
                <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#3d2b11',
                  color: '#e3b341',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '1px solid #9e6a03',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                >
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Video Sections */}
              {videoSections.map((section) => (
                <div key={section.title} style={{ marginBottom: '2.5rem' }}>
                  <h3
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#8b949e',
                      marginBottom: '1.25rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid #30363d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}
                  >
                    {section.title}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {section.fields.map((field) => {
                      // Special handling for thumbnail URL
                      if (field.key === 'thumbnail_url' && video[field.key]) {
                        return (
                          <div key={field.key} style={{ gridColumn: '1 / -1' }}>
                            <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#484f58',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.75rem',
                          }}
                            >
                              {field.label}
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <img
                                src={video[field.key]}
                                alt="Thumbnail"
                                style={{
                                  maxWidth: '320px',
                                  borderRadius: '8px',
                                  border: '1px solid #30363d',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                              />
                              <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.5rem', fontWeight: 500 }}>Source URL:</div>
                                <div style={{ 
                                  padding: '0.75rem', 
                                  backgroundColor: '#0d1117', 
                                  borderRadius: '6px', 
                                  border: '1px solid #30363d',
                                  fontSize: '0.75rem', 
                                  color: '#58a6ff', 
                                  wordBreak: 'break-all',
                                  fontFamily: 'monospace'
                                }}>
                                  {video[field.key]}
                                </div>
                              </div>
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
              <div style={{ marginBottom: '2.5rem' }}>
                <h3
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#8b949e',
                    marginBottom: '1.25rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #30363d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  View Performance History
                </h3>
                <div
                  style={{
                    backgroundColor: '#0d1117',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid #30363d',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
                  }}
                >
                  {statsLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#484f58', fontSize: '0.9rem' }}>
                      <div style={{ animation: 'pulse 1.5s infinite' }}>Analyzing historical data...</div>
                    </div>
                  ) : statsData.length > 0 ? (
                    <ViewsChart data={statsData} width={920} height={320} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#484f58', fontSize: '0.9rem' }}>
                      No historical performance data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Embedding Sections */}
              {embedding ? (
                embeddingSections.map((section) => (
                  <div key={section.title} style={{ marginBottom: '2.5rem' }}>
                    <h3
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#8b949e',
                        marginBottom: '1.25rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid #30363d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      {section.title}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                      {section.fields.map((field) => (
                        <div key={field.key} style={{ gridColumn: field.isLarge ? '1 / -1' : 'auto' }}>
                          {renderField(field.label, embedding[field.key], field.isLarge)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  marginBottom: '2.5rem', 
                  padding: '2rem', 
                  backgroundColor: '#1c2128', 
                  borderRadius: '12px', 
                  border: '1px solid #30363d',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f6fc', marginBottom: '0.5rem' }}>
                    No Script Intelligence
                  </h3>
                  <p style={{ margin: 0, color: '#8b949e', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                    Pattern analysis is not available for this video because no script or embedding data has been added yet.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
