import React from 'react';

interface AnalyticsDashboardProps {
  videos: any[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ videos }) => {
  // Calculate total channel views
  const totalViews = videos.reduce((sum, video) => sum + (video.view_count || 0), 0);
  
  // Calculate total likes
  const totalLikes = videos.reduce((sum, video) => sum + (video.like_count || 0), 0);
  
  // Calculate total comments
  const totalComments = videos.reduce((sum, video) => sum + (video.comment_count || 0), 0);
  
  // Calculate average engagement rate
  const videosWithEngagement = videos.filter(v => v.engagement_rate !== null && v.engagement_rate !== undefined);
  const avgEngagementRate = videosWithEngagement.length > 0
    ? videosWithEngagement.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / videosWithEngagement.length
    : 0;
  
  // Calculate total videos
  const totalVideos = videos.length;
  
  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toLocaleString();
  };

  // Format percentage
  const formatPercentage = (num: number): string => {
    return num.toFixed(2) + '%';
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 600, color: '#c9d1d9' }}>
        Channel Analytics
      </h2>

      {/* Key Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Views Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #30363d',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem',
            }}
          >
            Total Channel Views
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#58a6ff',
              marginBottom: '0.25rem',
            }}
          >
            {formatNumber(totalViews)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
            {totalViews.toLocaleString()} total views
          </div>
        </div>

        {/* Total Likes Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #30363d',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem',
            }}
          >
            Total Likes
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#7ee787',
              marginBottom: '0.25rem',
            }}
          >
            {formatNumber(totalLikes)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            {totalLikes.toLocaleString()} total likes
          </div>
        </div>

        {/* Total Comments Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #30363d',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem',
            }}
          >
            Total Comments
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#79c0ff',
              marginBottom: '0.25rem',
            }}
          >
            {formatNumber(totalComments)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            {totalComments.toLocaleString()} total comments
          </div>
        </div>

        {/* Average Engagement Rate Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #30363d',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem',
            }}
          >
            Avg Engagement Rate
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#d29922',
              marginBottom: '0.25rem',
            }}
          >
            {formatPercentage(avgEngagementRate)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Across {videosWithEngagement.length} videos
          </div>
        </div>

        {/* Total Videos Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #30363d',
          }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem',
            }}
          >
            Total Videos
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#bc8cff',
              marginBottom: '0.25rem',
            }}
          >
            {totalVideos}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Videos in database
          </div>
        </div>
      </div>

      {/* Additional Stats Section */}
      <div
        style={{
          backgroundColor: '#161b22',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #dee2e6',
        }}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600, color: '#c9d1d9' }}>
          Additional Statistics
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.25rem' }}>
              Average Views per Video
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c9d1d9' }}>
              {totalVideos > 0 ? formatNumber(totalViews / totalVideos) : '0'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.25rem' }}>
              Average Likes per Video
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c9d1d9' }}>
              {totalVideos > 0 ? formatNumber(totalLikes / totalVideos) : '0'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.25rem' }}>
              Average Comments per Video
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c9d1d9' }}>
              {totalVideos > 0 ? formatNumber(totalComments / totalVideos) : '0'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.25rem' }}>
              Total Engagement
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c9d1d9' }}>
              {formatNumber(totalLikes + totalComments)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
