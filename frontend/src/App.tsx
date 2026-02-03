import { useState, useEffect } from 'react';
import { apiClient } from './config/api';

interface AnalyticsData {
  id: string;
  [key: string]: any;
}

function App() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/analytics');
      setData(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Social Media Analytics Tool</h1>
        <p>Connected to Supabase via API</p>
      </header>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={fetchAnalytics}
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
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

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
          Error: {error}
        </div>
      )}

      {loading && <p>Loading analytics data...</p>}

      {!loading && !error && (
        <div>
          <h2>Analytics Data ({data.length} items)</h2>
          {data.length === 0 ? (
            <p>No data available. Make sure your Supabase table is set up correctly.</p>
          ) : (
            <pre
              style={{
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
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
