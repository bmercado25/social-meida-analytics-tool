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
    <div style={{ 
      padding: '1.5rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 600, color: '#f0f6fc'}}>
        Channel Analytics
      </h2>

      {/* Key Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Total Views Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #30363d',
            transition: 'transform 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#58a6ff66';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#30363d';
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            Total Views
          </div>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#58a6ff',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            {formatNumber(totalViews)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#484f58', fontWeight: 500 }}>
            {totalViews.toLocaleString()} absolute
          </div>
        </div>

        {/* Total Likes Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #30363d',
            transition: 'transform 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#7ee78766';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#30363d';
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            Total Likes
          </div>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#3fb950',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            {formatNumber(totalLikes)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#484f58', fontWeight: 500 }}>
            {totalLikes.toLocaleString()} absolute
          </div>
        </div>

        {/* Total Comments Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #30363d',
            transition: 'transform 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#a371f766';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#30363d';
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            Total Comments
          </div>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#a371f7',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            {formatNumber(totalComments)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#484f58', fontWeight: 500 }}>
            {totalComments.toLocaleString()} absolute
          </div>
        </div>

        {/* Average Engagement Rate Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #30363d',
            transition: 'transform 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#d2992266';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#30363d';
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            Avg Engagement
          </div>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#d29922',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            {formatPercentage(avgEngagementRate)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#484f58', fontWeight: 500 }}>
            Across {videosWithEngagement.length} videos
          </div>
        </div>

        {/* Total Videos Card */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #30363d',
            transition: 'transform 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#f0f6fc33';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#30363d';
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#8b949e',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}
          >
            Inventory
          </div>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#f0f6fc',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            {totalVideos}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#484f58', fontWeight: 500 }}>
            Videos in database
          </div>
        </div>
      </div>

      {/* Additional Stats Section */}
      <div
        style={{
          backgroundColor: '#0d1117',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: '1px solid #30363d',
        }}
      >
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}></span> Distribution Metrics
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '2rem',
          }}
        >
          <div style={{ padding: '0 1rem', borderLeft: '3px solid #30363d' }}>
            <div style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Avg Views / Video
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c9d1d9' }}>
              {totalVideos > 0 ? formatNumber(totalViews / totalVideos) : '0'}
            </div>
          </div>
          <div style={{ padding: '0 1rem', borderLeft: '3px solid #30363d' }}>
            <div style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Avg Likes / Video
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c9d1d9' }}>
              {totalVideos > 0 ? formatNumber(totalLikes / totalVideos) : '0'}
            </div>
          </div>
          <div style={{ padding: '0 1rem', borderLeft: '3px solid #30363d' }}>
            <div style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Avg Comments / Video
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c9d1d9' }}>
              {totalVideos > 0 ? formatNumber(totalComments / totalVideos) : '0'}
            </div>
          </div>
          <div style={{ padding: '0 1rem', borderLeft: '3px solid #30363d' }}>
            <div style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Gross Engagement
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c9d1d9' }}>
              {formatNumber(totalLikes + totalComments)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
