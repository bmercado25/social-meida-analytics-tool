import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';

interface PromptAssistantProps {
  videos: any[];
}

const META_PROMPT = `You are a marketing strategist and creative copy generator for a SaaS product.

Your role is to generate high-performing promotional content (hooks, scripts, captions, CTAs, angles, positioning statements) that is direct-response oriented, optimized for short-form and long-form digital platforms.

You will be provided with structured JSON data representing selected video content. This data may include (but is not limited to):
– topics
– hooks
– formats
– scripts or notes
– pacing
– tone or style descriptors
– gimmicks
– endings / CTAs
– performance indicators or qualitative trends

Treat this JSON as ground truth pattern data.

How to use the JSON:

Extract recurring patterns, trends, and stylistic signals (e.g. hook structure, language choices, pacing, emotional triggers, narrative devices).

Infer what works for this audience and product category without explicitly referencing the raw data.

Use these patterns to influence the structure, tone, and creative decisions of your output.

Output rules:

– Do not summarize or restate the JSON.
– Do not mention "the data," "the JSON," or "selected videos."
– Produce original marketing content that feels native to the identified trends.
– Favor clarity, memorability, and conversion over generic brand language.
– When uncertain, default to bold, specific, and testable ideas rather than safe generalities.

The user's prompt that follows represents the intent and goal of the content.

Your task is to combine:
– the user's intent
– the inferred patterns from the provided data
– best-practice SaaS marketing principles
- the best practices for marketing on YouTube Shorts that are proven to work based on data in both the JSON and youtube landscape trends and historical data

…to generate content that is distinct, compelling, and optimized to perform.`;

export const PromptAssistant: React.FC<PromptAssistantProps> = ({ videos }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [contextData, setContextData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [sortBy, setSortBy] = useState<'none' | 'views-desc' | 'views-asc' | 'engagement-desc' | 'engagement-asc'>('views-desc');

  // Sort videos based on sortBy selection
  const sortedVideos = React.useMemo(() => {
    const sorted = [...videos].sort((a, b) => {
      if (sortBy === 'none') return 0;
      
      if (sortBy === 'views-desc' || sortBy === 'views-asc') {
        const viewsA = a.view_count || 0;
        const viewsB = b.view_count || 0;
        return sortBy === 'views-desc' ? viewsB - viewsA : viewsA - viewsB;
      }
      
      if (sortBy === 'engagement-desc' || sortBy === 'engagement-asc') {
        const engagementA = a.engagement_rate || 0;
        const engagementB = b.engagement_rate || 0;
        return sortBy === 'engagement-desc' ? engagementB - engagementA : engagementA - engagementB;
      }
      
      return 0;
    });
    
    return sorted;
  }, [videos, sortBy]);

  // Fetch context data for selected videos
  useEffect(() => {
    const fetchContextData = async () => {
      if (selectedVideoIds.size === 0) {
        setContextData([]);
        setOutput('');
        return;
      }

      setLoading(true);
      try {
        const contextPromises = Array.from(selectedVideoIds).map(async (videoId) => {
          const video = videos.find(v => v.video_id === videoId);
          if (!video) return null;

          // Fetch embedding data
          let embeddingData = null;
          try {
            const embeddingResponse = await apiClient.get(`/api/youtube/embeddings/${videoId}`);
            embeddingData = embeddingResponse.data.data;
          } catch (err: any) {
            // If embedding doesn't exist, that's okay
            if (err.response?.status !== 404) {
              console.error(`Error fetching embedding for ${videoId}:`, err);
            }
          }

          return {
            video: video,
            embedding: embeddingData,
          };
        });

        const results = await Promise.all(contextPromises);
        const validResults = results.filter(r => r !== null) as any[];
        setContextData(validResults);
      } catch (error) {
        console.error('Error fetching context data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContextData();
  }, [selectedVideoIds, videos]);

  useEffect(() => {
    generateOutput();
  }, [userPrompt, contextData]);

  const generateOutput = () => {
    if (!userPrompt.trim() || contextData.length === 0) {
      setOutput('');
      return;
    }

    const contextJson = JSON.stringify(contextData, null, 2);
    
    const formattedOutput = `${userPrompt}

---

${META_PROMPT}

---

Context:
${contextJson}`;

    setOutput(formattedOutput);
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideoIds);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideoIds(newSelection);
  };

  const selectAllVideos = () => {
    setSelectedVideoIds(new Set(videos.map(v => v.video_id)));
  };

  const deselectAllVideos = () => {
    setSelectedVideoIds(new Set());
  };

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        const button = document.getElementById('copy-output-btn');
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✓ Copied!';
          button.style.backgroundColor = '#238636';
          setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '#21262d';
          }, 2000);
        }
      }).catch((err) => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
      });
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 600, color: '#c9d1d9' }}>
        Prompt Assistant
      </h2>

      {/* User Prompt Input */}
      <div style={{ marginBottom: '2rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            color: '#c9d1d9',
            fontSize: '0.875rem',
          }}
        >
          Your Prompt
        </label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Enter your marketing prompt here..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '0.75rem',
            border: '1px solid #30363d',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
          }}
        />
      </div>

      {/* Video Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label
            style={{
              fontWeight: 600,
              color: '#c9d1d9',
              fontSize: '0.875rem',
            }}
          >
            Select Videos for Context ({selectedVideoIds.size} selected)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Sort Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                style={{
                  padding: '0.4rem 0.8rem',
                  paddingRight: '2rem',
                  backgroundColor: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  appearance: 'none',
                }}
              >
                <option value="views-desc">Sort: Highest Views ↓</option>
                <option value="views-asc">Sort: Lowest Views ↑</option>
                <option value="engagement-desc">Sort: Highest Engagement ↓</option>
                <option value="engagement-asc">Sort: Lowest Engagement ↑</option>
                <option value="none">Sort: None</option>
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#8b949e',
                  fontSize: '0.7rem',
                }}
              >
                ▼
              </span>
            </div>
            <button
              onClick={selectAllVideos}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: '#238636',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              Select All
            </button>
            <button
              onClick={deselectAllVideos}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: '#da3633',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              Deselect All
            </button>
          </div>
        </div>

        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #30363d',
            borderRadius: '4px',
            backgroundColor: '#0d1117',
            padding: '0.5rem',
          }}
        >
          {sortedVideos.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#8b949e' }}>
              No videos available
            </div>
          ) : (
            sortedVideos.map((video) => (
              <label
                key={video.video_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginBottom: '0.25rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#21262d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedVideoIds.has(video.video_id)}
                  onChange={() => toggleVideoSelection(video.video_id)}
                  style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#c9d1d9', fontSize: '0.875rem', fontWeight: 500 }}>
                    {video.title || video.video_id}
                  </div>
                  <div style={{ color: '#8b949e', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {video.view_count?.toLocaleString() || 0} views • {video.engagement_rate ? (video.engagement_rate * 100).toFixed(2) + '%' : 'N/A'} engagement
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Output */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label
            style={{
              fontWeight: 600,
              color: '#c9d1d9',
              fontSize: '0.875rem',
            }}
          >
            Generated Output
          </label>
          <button
            id="copy-output-btn"
            onClick={copyOutput}
            disabled={!output || loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '4px',
              cursor: output && !loading ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
          >
            📋 Copy Output
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>
            Loading context data...
          </div>
        ) : !userPrompt.trim() ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#8b949e',
              backgroundColor: '#0d1117',
              borderRadius: '4px',
              border: '1px solid #30363d',
            }}
          >
            Enter a prompt and select videos to generate output
          </div>
        ) : selectedVideoIds.size === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#8b949e',
              backgroundColor: '#0d1117',
              borderRadius: '4px',
              border: '1px solid #30363d',
            }}
          >
            Select at least one video to generate context
          </div>
        ) : (
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              backgroundColor: '#0d1117',
              color: '#c9d1d9',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              border: '1px solid #30363d',
              maxHeight: '500px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {output}
          </pre>
        )}
      </div>

      {/* Info Box */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#1c2128',
          borderRadius: '4px',
          border: '1px solid #30363d',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#8b949e', lineHeight: '1.6' }}>
          <strong style={{ color: '#c9d1d9' }}>How it works:</strong>
          <br />
          1. Enter your marketing prompt in the text field above
          <br />
          2. Select one or more videos from your library to use as context
          <br />
          3. The output will combine your prompt, the meta prompt, and the JSON context from selected videos
          <br />
          4. Copy the output and use it with your AI assistant (ChatGPT, Claude, etc.)
        </div>
      </div>
    </div>
  );
};
