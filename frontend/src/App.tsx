import { useState, useEffect } from 'react';
import { apiClient } from './config/api';
import { DataTable } from './components/DataTable';

interface YouTubeVideo {
  id: string;
  video_id: string;
  title: string;
  channel_name: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  engagement_rate: number | null;
  days_since_published: number;
  thumbnail_url: string | null;
  [key: string]: any;
}

function App() {
  const [data, setData] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrieving, setRetrieving] = useState(false);
  const [retrieveStatus, setRetrieveStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    rowCount?: number;
  } | null>(null);

  useEffect(() => {
    testConnection();
    fetchVideos();
  }, []);

  const testConnection = async () => {
    try {
      const response = await apiClient.get('/api/test-connection');
      setConnectionStatus({
        connected: response.data.success,
        message: response.data.message,
        rowCount: response.data.rowCount,
      });
    } catch (err: any) {
      setConnectionStatus({
        connected: false,
        message: err.response?.data?.message || 'Connection test failed',
      });
      console.error('Connection test error:', err);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/youtube/videos');
      setData(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch videos');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieve = async () => {
    setRetrieving(true);
    setRetrieveStatus('Fetching shorts from YouTube channel...');
    
    try {
      const response = await apiClient.post('/api/youtube/retrieve');
      
      setRetrieveStatus(
        `✅ Success! ${response.data.videosInserted} new videos inserted, ${response.data.videosUpdated} updated. Total processed: ${response.data.videosProcessed}`
      );
      
      // Refresh the video list after retrieval
      await fetchVideos();
    } catch (err: any) {
      setRetrieveStatus(
        `❌ Error: ${err.response?.data?.error?.message || err.message || 'Failed to retrieve videos'}`
      );
      console.error('Error retrieving videos:', err);
    } finally {
      setRetrieving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Social Media Analytics Tool</h1>
        <p>Connected to Supabase via API</p>
      </header>

      {/* Connection Status */}
      {connectionStatus && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: connectionStatus.connected ? '#d4edda' : '#f8d7da',
            color: connectionStatus.connected ? '#155724' : '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: `1px solid ${connectionStatus.connected ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          <strong>Supabase Connection:</strong> {connectionStatus.message}
          {connectionStatus.rowCount !== undefined && (
            <span> | Table has {connectionStatus.rowCount} row(s)</span>
          )}
        </div>
      )}

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleRetrieve}
          disabled={retrieving}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: retrieving ? '#6c757d' : '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: retrieving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {retrieving ? 'Retrieving...' : '📥 Retrieve Shorts'}
        </button>
        <button
          onClick={fetchVideos}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : '🔄 Refresh Table'}
        </button>
        <button
          onClick={testConnection}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Test Connection
        </button>
      </div>

      {retrieveStatus && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: retrieveStatus.includes('✅') ? '#d4edda' : '#f8d7da',
            color: retrieveStatus.includes('✅') ? '#155724' : '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {retrieveStatus}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && <p>Loading YouTube videos...</p>}

      {!loading && !error && (
        <div>
          <h2>YouTube Shorts ({data.length} videos)</h2>
          <DataTable
            data={data}
            tableName="youtube_videos"
            columns={[
              {
                key: 'thumbnail_url',
                label: 'Thumbnail',
                render: (url) => url ? (
                  <img 
                    src={url} 
                    alt="Video thumbnail" 
                    style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ) : '—'
              },
              {
                key: 'title',
                label: 'Title',
                render: (title) => (
                  <span style={{ fontWeight: 500 }}>{title || '—'}</span>
                )
              },
              {
                key: 'published_at',
                label: 'Published',
                render: (date) => date ? new Date(date).toLocaleDateString() : '—'
              },
              {
                key: 'view_count',
                label: 'Views',
                render: (count) => count?.toLocaleString() || '0'
              },
              {
                key: 'like_count',
                label: 'Likes',
                render: (count) => count?.toLocaleString() || '0'
              },
              {
                key: 'comment_count',
                label: 'Comments',
                render: (count) => count?.toLocaleString() || '0'
              },
              {
                key: 'engagement_rate',
                label: 'Engagement',
                render: (rate) => rate ? `${(rate * 100).toFixed(2)}%` : '—'
              },
              {
                key: 'days_since_published',
                label: 'Age (days)',
                render: (days) => days || '0'
              },
            ]}
            onActionClick={(row) => {
              console.log('Action clicked for video:', row);
              // Action handler will be implemented later
              alert(`Action clicked for: ${row.title || row.video_id}`);
            }}
            actionLabel="Actions"
          />
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>API Health Check</h3>
        <HealthCheck />
      </div>
    </div>
  );
}

function HealthCheck() {
  const [health, setHealth] = useState<{ status: string; timestamp?: string } | null>(null);

  useEffect(() => {
    apiClient
      .get('/health')
      .then((response) => setHealth(response.data))
      .catch((err) => setHealth({ status: 'error', timestamp: err.message }));
  }, []);

  return (
    <div>
      <p>Status: {health?.status || 'checking...'}</p>
      {health?.timestamp && <p>Timestamp: {health.timestamp}</p>}
    </div>
  );
}

export default App;
