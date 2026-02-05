import { useState, useEffect } from 'react';
import { apiClient } from './config/api';
import { DataTable } from './components/DataTable';
import { VideoEmbeddingsEditor } from './components/VideoEmbeddingsEditor';
import { VideoDetailView } from './components/VideoDetailView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PromptAssistant } from './components/PromptAssistant';
import { PendingEmbeddings } from './components/PendingEmbeddings';

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
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [detailVideo, setDetailVideo] = useState<YouTubeVideo | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'prompt' | 'pending'>('table');

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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#0d1117', minHeight: '100vh' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#c9d1d9' }}>Marketing Analytic Ver. 1.0.1</h1>
        <p style={{ color: '#8b949e' }}>Connected to Supabase via API</p>
      </header>

      {/* Connection Status */}
      {connectionStatus && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: connectionStatus.connected ? '#1a472a' : '#5a1f1f',
            color: connectionStatus.connected ? '#7ee787' : '#ff7b72',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: `1px solid ${connectionStatus.connected ? '#238636' : '#da3633'}`,
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
          {retrieving ? 'Retrieving...' : 'Retrieve Shorts'}
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
          {loading ? 'Loading...' : 'Refresh Table'}
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
            backgroundColor: retrieveStatus.includes('✅') ? '#1a472a' : '#5a1f1f',
            color: retrieveStatus.includes('✅') ? '#7ee787' : '#ff7b72',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: `1px solid ${retrieveStatus.includes('✅') ? '#238636' : '#da3633'}`,
          }}
        >
          {retrieveStatus}
        </div>
      )}

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
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #30363d',
        }}
      >
        <button
          onClick={() => setActiveTab('table')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'table' ? '#58a6ff' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'table' ? '3px solid #58a6ff' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'table' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-2px',
          }}
        >
          Table View
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'analytics' ? '#58a6ff' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '3px solid #58a6ff' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'analytics' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-2px',
          }}
        >
          Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'prompt' ? '#58a6ff' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'prompt' ? '3px solid #58a6ff' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'prompt' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-2px',
          }}
        >
          Prompt Assistant
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: activeTab === 'pending' ? '#58a6ff' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '3px solid #58a6ff' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'pending' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-2px',
          }}
        >
          📝 Pending Scripts
        </button>
      </div>

      {loading && <p style={{ color: '#8b949e' }}>Loading YouTube videos...</p>}

      {!loading && !error && (
        <>
          {activeTab === 'table' && (
            <div>
              <h2 style={{ color: '#c9d1d9', marginBottom: '1rem' }}>YouTube Shorts ({data.length} videos)</h2>
              <DataTable
                data={data}
                tableName="youtube_videos"
                onRowClick={(row) => {
                  setDetailVideo(row);
                }}
                onActionClick={(row) => {
                  setSelectedVideo(row);
                }}
                actionLabel="Edit Embeddings"
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard videos={data} />
          )}

          {activeTab === 'prompt' && (
            <PromptAssistant videos={data} />
          )}

          {activeTab === 'pending' && (
            <PendingEmbeddings />
          )}
        </>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#161b22', borderRadius: '4px', border: '1px solid #30363d' }}>
        <h3 style={{ color: '#c9d1d9', marginBottom: '0.5rem' }}>API Health Check</h3>
        <HealthCheck />
      </div>

      {selectedVideo && (
        <VideoEmbeddingsEditor
          videoId={selectedVideo.video_id}
          videoTitle={selectedVideo.title}
          videoData={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onUpdate={() => {
            // Optionally refresh data or show a success message
            console.log('Embedding updated for video:', selectedVideo.video_id);
          }}
        />
      )}

      {detailVideo && (
        <VideoDetailView
          video={detailVideo}
          onClose={() => setDetailVideo(null)}
        />
      )}
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
      <p style={{ color: '#8b949e', margin: '0.25rem 0' }}>Status: {health?.status || 'checking...'}</p>
      {health?.timestamp && <p style={{ color: '#8b949e', margin: '0.25rem 0' }}>Timestamp: {health.timestamp}</p>}
    </div>
  );
}

export default App;
