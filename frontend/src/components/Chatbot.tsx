import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../config/api';

interface ChatbotProps {
  videos: any[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ videos }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideoSelector, setShowVideoSelector] = useState(true);
  const [sortBy, setSortBy] = useState<'none' | 'views-desc' | 'views-asc' | 'engagement-desc' | 'engagement-asc'>('views-desc');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sort videos
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
    setSelectedVideoIds(new Set(videos.map((v) => v.video_id)));
  };

  const deselectAllVideos = () => {
    setSelectedVideoIds(new Set());
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/chat', {
        message: trimmed,
        videoIds: Array.from(selectedVideoIds),
        history: messages, // send prior conversation as history
      });

      if (response.data.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.data.message,
        };
        setMessages([...updatedMessages, assistantMessage]);
      } else {
        setError(response.data.error?.message || 'Something went wrong');
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to send message';
      setError(errMsg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#c9d1d9', margin: 0 }}>
          Chatbot
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowVideoSelector(!showVideoSelector)}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: showVideoSelector ? '#1f6feb' : '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            {showVideoSelector ? 'Hide' : 'Show'} Context ({selectedVideoIds.size})
          </button>
          <button
            onClick={clearChat}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Video Context Selector (collapsible) */}
      {showVideoSelector && (
        <div
          style={{
            marginBottom: '1rem',
            border: '1px solid #30363d',
            borderRadius: '6px',
            backgroundColor: '#161b22',
            padding: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, color: '#c9d1d9', fontSize: '0.8rem' }}>
              Select Videos for Context ({selectedVideoIds.size} selected)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                style={{
                  padding: '0.3rem 0.6rem',
                  backgroundColor: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                }}
              >
                <option value="views-desc">Highest Views ↓</option>
                <option value="views-asc">Lowest Views ↑</option>
                <option value="engagement-desc">Highest Engagement ↓</option>
                <option value="engagement-asc">Lowest Engagement ↑</option>
                <option value="none">No Sort</option>
              </select>
              <button
                onClick={selectAllVideos}
                style={{
                  padding: '0.3rem 0.6rem',
                  backgroundColor: '#238636',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              >
                Select All
              </button>
              <button
                onClick={deselectAllVideos}
                style={{
                  padding: '0.3rem 0.6rem',
                  backgroundColor: '#da3633',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              >
                Deselect All
              </button>
            </div>
          </div>

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              backgroundColor: '#0d1117',
              borderRadius: '4px',
              padding: '0.25rem',
            }}
          >
            {sortedVideos.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: '#8b949e', fontSize: '0.8rem' }}>
                No videos available
              </div>
            ) : (
              sortedVideos.map((video) => (
                <label
                  key={video.video_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.4rem 0.5rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginBottom: '0.1rem',
                    transition: 'background-color 0.15s',
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
                    style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#c9d1d9', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {video.title || video.video_id}
                    </div>
                    <div style={{ color: '#8b949e', fontSize: '0.65rem' }}>
                      {video.view_count?.toLocaleString() || 0} views •{' '}
                      {video.engagement_rate ? (video.engagement_rate * 100).toFixed(2) + '%' : 'N/A'} eng.
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #30363d',
          borderRadius: '6px',
          backgroundColor: '#0d1117',
          padding: '1rem',
          marginBottom: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
            <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#c9d1d9' }}>
              Marketing Chatbot
            </div>
            <div style={{ fontSize: '0.8rem', maxWidth: '400px', lineHeight: '1.5' }}>
              Select videos above for context, then ask me anything about marketing strategy, scripts, hooks, or content optimization.
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                backgroundColor: msg.role === 'user' ? '#1f6feb' : '#21262d',
                color: '#c9d1d9',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ fontSize: '0.65rem', color: '#8b949e', marginBottom: '0.35rem', fontWeight: 600 }}>
                  AI Assistant
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px 12px 12px 2px',
                backgroundColor: '#21262d',
                color: '#8b949e',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: '#8b949e', marginBottom: '0.35rem', fontWeight: 600 }}>
                AI Assistant
              </div>
              <span className="typing-indicator">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: '#5a1f1f',
            color: '#ff7b72',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            fontSize: '0.8rem',
            border: '1px solid #da3633',
          }}
        >
          {error}
        </div>
      )}

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedVideoIds.size === 0
              ? 'Select videos above for context, then type your message...'
              : 'Type your message... (Shift+Enter for new line)'
          }
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #30363d',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            minHeight: '44px',
            maxHeight: '200px',
            overflow: 'auto',
          }}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: loading || !input.trim() ? '#21262d' : '#238636',
            color: loading || !input.trim() ? '#484f58' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            minHeight: '44px',
            transition: 'background-color 0.15s',
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

      {/* Info */}
      <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#1c2128', borderRadius: '4px', border: '1px solid #30363d' }}>
        <div style={{ fontSize: '0.7rem', color: '#8b949e', lineHeight: '1.5' }}>
          <strong style={{ color: '#c9d1d9' }}>Powered by GPT-3.5 Turbo</strong>
          {' · '}
          Uses the same video embedding context as Prompt Assistant. Select videos to provide pattern data, then chat naturally.
          {selectedVideoIds.size > 0 && (
            <span> · <strong style={{ color: '#58a6ff' }}>{selectedVideoIds.size} video(s)</strong> loaded as context</span>
          )}
        </div>
      </div>
    </div>
  );
};

export { Chatbot };
