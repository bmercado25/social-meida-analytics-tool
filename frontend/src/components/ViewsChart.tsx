import React from 'react';

interface DataPoint {
  date: Date;
  views: number;
  label: string;
}

interface ViewsChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
}

export const ViewsChart: React.FC<ViewsChartProps> = ({ 
  data, 
  height = 300, 
  width = 800 
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#8b949e',
        backgroundColor: '#0d1117',
        borderRadius: '4px',
        border: '1px solid #30363d'
      }}>
        No historical data available yet. Stats will appear after the next refresh.
      </div>
    );
  }

  // Calculate chart dimensions
  const padding = { top: 20, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max values for scaling
  const views = data.map(d => d.views);
  const minViews = Math.min(...views);
  const maxViews = Math.max(...views);
  const viewRange = maxViews - minViews || 1; // Avoid division by zero

  // Scale function for Y axis
  const scaleY = (value: number) => {
    return chartHeight - ((value - minViews) / viewRange) * chartHeight;
  };

  // Scale function for X axis
  const scaleX = (index: number) => {
    return (index / (data.length - 1 || 1)) * chartWidth;
  };

  // Generate path for line
  const pathData = data
    .map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.views);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Generate Y axis labels
  const yAxisSteps = 5;
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    const value = minViews + (viewRange / yAxisSteps) * i;
    return {
      value,
      y: scaleY(value),
      label: formatNumber(value),
    };
  });

  // Generate X axis labels (show every nth label to avoid crowding)
  const xAxisLabelStep = Math.max(1, Math.floor(data.length / 6));
  const xAxisLabels = data
    .map((point, index) => ({ point, index }))
    .filter((_, i) => i % xAxisLabelStep === 0 || i === data.length - 1)
    .map(({ point, index }) => ({
      x: scaleX(index),
      label: formatDate(point.date),
    }));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill="#0d1117"
          rx="4"
        />

        {/* Grid lines */}
        {yAxisLabels.map((label, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={label.y + padding.top}
            x2={padding.left + chartWidth}
            y2={label.y + padding.top}
            stroke="#30363d"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Y axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#8b949e"
          strokeWidth="2"
        />

        {/* X axis */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#8b949e"
          strokeWidth="2"
        />

        {/* Y axis labels */}
        {yAxisLabels.map((label, i) => (
          <g key={`y-label-${i}`}>
            <text
              x={padding.left - 10}
              y={label.y + padding.top + 4}
              textAnchor="end"
              fontSize="12"
              fill="#8b949e"
            >
              {label.label}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {xAxisLabels.map((label, i) => (
          <g key={`x-label-${i}`}>
            <text
              x={label.x + padding.left}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              fontSize="11"
              fill="#8b949e"
            >
              {label.label}
            </text>
          </g>
        ))}

        {/* Chart area (translate to account for padding) */}
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Area under line */}
          <path
            d={`${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#58a6ff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = scaleX(index);
            const y = scaleY(point.views);
            return (
              <g key={`point-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#58a6ff"
                  stroke="#161b22"
                  strokeWidth="2"
                />
                {/* Tooltip on hover */}
                <title>
                  {point.label}: {formatNumber(point.views)} views
                </title>
              </g>
            );
          })}
        </g>

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
