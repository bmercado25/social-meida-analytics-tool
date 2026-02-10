import { useState, useEffect } from 'react';
import { apiClient } from './config/api';
import { DataTable } from './components/DataTable';
import { VideoEmbeddingsEditor } from './components/VideoEmbeddingsEditor';
import { VideoDetailView } from './components/VideoDetailView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PromptAssistant } from './components/PromptAssistant';
import { PendingEmbeddings } from './components/PendingEmbeddings';
import { Chatbot } from './components/Chatbot';

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
  } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [detailVideo, setDetailVideo] = useState<YouTubeVideo | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'analytics' | 'prompt' | 'pending' | 'chatbot'>('table');

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
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#c9d1d9', margin: 0 }}>PolyMedium Marketing Internal Tooling <span style={{ fontSize: '0.9rem', color: '#8b949e', fontWeight: 400 }}>(1.01)</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {connectionStatus && (
            <div
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: connectionStatus.connected ? '#1a472a33' : '#3d1b1b',
                color: connectionStatus.connected ? '#7ee787' : '#ff7b72',
                borderRadius: '6px',
                border: `1px solid ${connectionStatus.connected ? '#238636' : '#6e2121'}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connectionStatus.connected ? '#3fb950' : '#f85149' }}></div>
              DB: {connectionStatus.connected ? 'ONLINE' : 'OFFLINE'}
            </div>
          )}
          <HealthCheckBadge />
        </div>
      </header>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleRetrieve}
          disabled={retrieving}
          style={{
            padding: '0.6rem 1.25rem',
            backgroundColor: retrieving ? '#21262d' : '#ff6b35',
            color: retrieving ? '#484f58' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: retrieving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            boxShadow: retrieving ? 'none' : '0 2px 4px rgba(255, 107, 53, 0.2)'
          }}
          onMouseEnter={(e) => {
            if (!retrieving) {
              e.currentTarget.style.backgroundColor = '#ff8c5a';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!retrieving) {
              e.currentTarget.style.backgroundColor = '#ff6b35';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {retrieving ? 'Retrieving...' : 'Retrieve Shorts'}
        </button>
        <button
          onClick={fetchVideos}
          disabled={loading}
          style={{
            padding: '0.6rem 1.25rem',
            backgroundColor: '#21262d',
            color: '#c9d1d9',
            border: '1px solid #30363d',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#30363d';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#21262d';
          }}
        >
          {loading ? 'Loading...' : 'Refresh Table'}
        </button>
        <button
          onClick={testConnection}
          style={{
            padding: '0.6rem 1.25rem',
            backgroundColor: '#21262d',
            color: '#c9d1d9',
            border: '1px solid #30363d',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#30363d'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#21262d'}
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
          gap: '0.25rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #30363d',
          padding: '0 0.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('table')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            color: activeTab === 'table' ? '#f0f6fc' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'table' ? '2px solid #f78166' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'table' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-1px',
          }}
        >
          Table View
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            color: activeTab === 'analytics' ? '#f0f6fc' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid #f78166' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'analytics' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-1px',
          }}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            color: activeTab === 'prompt' ? '#f0f6fc' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'prompt' ? '2px solid #f78166' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'prompt' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-1px',
          }}
        >
          Prompt Assistant
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            color: activeTab === 'pending' ? '#f0f6fc' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #f78166' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'pending' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-1px',
          }}
        >
          Pending Scripts
        </button>
        <button
          onClick={() => setActiveTab('chatbot')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            color: activeTab === 'chatbot' ? '#f0f6fc' : '#8b949e',
            border: 'none',
            borderBottom: activeTab === 'chatbot' ? '2px solid #f78166' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'chatbot' ? 600 : 400,
            transition: 'all 0.2s',
            marginBottom: '-1px',
          }}
        >
          Chatbot
        </button>
      </div>

      {loading && <p style={{ color: '#8b949e' }}>Loading YouTube videos...</p>}

      {!loading && !error && (
        <>
          {activeTab === 'table' && (
            <div>
              <h2 style={{ color: '#c9d1d9', marginBottom: '1rem' }}>Shorts ({data.length} videos)</h2>
              <DataTable
                data={data}
                tableName="youtube_videos"
                onRowClick={(row) => {
                  setDetailVideo(row);
                }}
                onActionClick={(row) => {
                  setSelectedVideo(row);
                }}
                actionLabel="Edit EMB"
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

          {activeTab === 'chatbot' && (
            <Chatbot videos={data} />
          )}
        </>
      )}

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

function HealthCheckBadge() {
  const [health, setHealth] = useState<{ status: string; timestamp?: string } | null>(null);

  useEffect(() => {
    apiClient
      .get('/health')
      .then((response) => setHealth(response.data))
      .catch((err) => setHealth({ status: 'error', timestamp: err.message }));
  }, []);

  const isOnline = health?.status === 'ok';

  return (
    <div
      style={{
        padding: '0.4rem 0.75rem',
        backgroundColor: isOnline ? '#1a472a33' : '#3d1b1b',
        color: isOnline ? '#7ee787' : '#ff7b72',
        borderRadius: '6px',
        border: `1px solid ${isOnline ? '#238636' : '#6e2121'}`,
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      }}
      title={health?.timestamp ? `Last checked: ${health.timestamp}` : 'Checking API health...'}
    >
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOnline ? '#3fb950' : '#f85149' }}></div>
      API: {isOnline ? 'ONLINE' : (health?.status === 'error' ? 'OFFLINE' : 'CHECKING...')}
    </div>
  );
}

export default App;
