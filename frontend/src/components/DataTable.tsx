import React, { useState, useEffect } from 'react';

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns?: Column[];
  onActionClick?: (row: any) => void;
  onRowClick?: (row: any) => void;
  actionLabel?: string;
  tableName?: string;
}

// Helper functions for localStorage
const getStorageKey = (tableName?: string) => 
  `datatable_columns_${tableName || 'default'}`;

const loadColumnVisibility = (tableName?: string): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(getStorageKey(tableName));
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveColumnVisibility = (tableName: string | undefined, visibility: Record<string, boolean>) => {
  try {
    localStorage.setItem(getStorageKey(tableName), JSON.stringify(visibility));
  } catch (error) {
    console.error('Failed to save column visibility:', error);
  }
};

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onActionClick,
  onRowClick,
  actionLabel = 'Actions',
  tableName,
}) => {
  // If no columns provided, auto-generate from first row
  const autoColumns: Column[] = React.useMemo(() => {
    if (columns) return columns;
    if (data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    }));
  }, [columns, data]);

  // Column visibility state with localStorage persistence
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const saved = loadColumnVisibility(tableName);
    // Initialize all columns as visible if not saved
    if (Object.keys(saved).length === 0 && autoColumns.length > 0) {
      const initial: Record<string, boolean> = {};
      autoColumns.forEach(col => {
        initial[col.key] = true;
      });
      return initial;
    }
    return saved;
  });

  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'none' | 'best-asc' | 'best-desc'>('none');

  // Sort data based on sortBy selection
  const sortedData = React.useMemo(() => {
    if (sortBy === 'none') return data;
    
    const sorted = [...data].sort((a, b) => {
      // Use view_count as the primary metric for "best performing"
      const viewsA = a.view_count || 0;
      const viewsB = b.view_count || 0;
      
      if (sortBy === 'best-desc') {
        // Descending: highest views first (best performing)
        return viewsB - viewsA;
      } else {
        // Ascending: lowest views first (worst performing)
        return viewsA - viewsB;
      }
    });
    
    return sorted;
  }, [data, sortBy]);

  // Update visibility when columns change
  useEffect(() => {
    if (autoColumns.length > 0) {
      const saved = loadColumnVisibility(tableName);
      const updated: Record<string, boolean> = {};
      autoColumns.forEach(col => {
        updated[col.key] = saved[col.key] !== undefined ? saved[col.key] : true;
      });
      setColumnVisibility(updated);
      saveColumnVisibility(tableName, updated);
    }
  }, [autoColumns.length, tableName]);

  // Filter visible columns
  const visibleColumns = React.useMemo(() => {
    return autoColumns.filter(col => columnVisibility[col.key] !== false);
  }, [autoColumns, columnVisibility]);

  const toggleColumn = (key: string) => {
    const updated = {
      ...columnVisibility,
      [key]: !columnVisibility[key],
    };
    setColumnVisibility(updated);
    saveColumnVisibility(tableName, updated);
  };

  const showAllColumns = () => {
    const updated: Record<string, boolean> = {};
    autoColumns.forEach(col => {
      updated[col.key] = true;
    });
    setColumnVisibility(updated);
    saveColumnVisibility(tableName, updated);
  };

  const hideAllColumns = () => {
    const updated: Record<string, boolean> = {};
    autoColumns.forEach(col => {
      updated[col.key] = false;
    });
    setColumnVisibility(updated);
    saveColumnVisibility(tableName, updated);
  };

  const formatValue = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined) return '—';
    
    // Special handling for thumbnail URLs
    if (key === 'thumbnail_url' && typeof value === 'string' && value.startsWith('http')) {
      return (
        <img 
          src={value} 
          alt="Thumbnail" 
          style={{ 
            width: '120px', 
            height: '68px', 
            objectFit: 'cover', 
            borderRadius: '4px',
            display: 'block'
          }} 
        />
      );
    }
    
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '—';
      return (
        <span style={{ fontSize: '0.8rem' }}>
          {value.slice(0, 3).join(', ')}
          {value.length > 3 && ` +${value.length - 3} more`}
        </span>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <pre style={{ margin: 0, fontSize: '0.75rem', maxWidth: '200px', overflow: 'auto' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );
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
      // Truncate long strings
      if (value.length > 100) {
        return (
          <span title={value}>
            {value.substring(0, 100)}...
          </span>
        );
      }
      return value;
    }
    
    if (typeof value === 'number') {
      // Format large numbers
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
      }
      return value.toLocaleString();
    }
    
    return String(value);
  };

  if (data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>
        <p>No data available in {tableName || 'this table'}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Sort and Column Filter Buttons */}
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', position: 'relative' }}>
        {/* Sort Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'none' | 'best-asc' | 'best-desc')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              appearance: 'none',
              paddingRight: '2.5rem',
            }}
          >
            <option value="none">Sort: None</option>
            <option value="best-desc">Best Performing ↓</option>
            <option value="best-asc">Best Performing ↑</option>
          </select>
          <span
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#8b949e',
            }}
          >
            ▼
          </span>
        </div>
        
        <button
          onClick={() => setShowFilter(!showFilter)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#21262d',
            color: '#c9d1d9',
            border: '1px solid #30363d',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Column Filter
        </button>

        {/* Filter Dropdown */}
        {showFilter && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              zIndex: 1000,
              minWidth: '250px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#c9d1d9' }}>Show/Hide Columns</strong>
              <button
                onClick={() => setShowFilter(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#8b949e',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={showAllColumns}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  Show All
                </button>
                <button
                  onClick={hideAllColumns}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  Hide All
                </button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {autoColumns.map((column) => (
                  <label
                    key={column.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
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
                      checked={columnVisibility[column.key] !== false}
                      onChange={() => toggleColumn(column.key)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#c9d1d9' }}>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close filter */}
      {showFilter && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowFilter(false)}
        />
      )}

      <div 
        style={{ 
          overflowX: 'auto', 
          width: '100%',
          border: '1px solid #30363d',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '800px', // Ensure table doesn't compress too much
            borderCollapse: 'collapse',
            backgroundColor: '#161b22',
          }}
        >
        <thead>
          <tr style={{ backgroundColor: '#21262d', borderBottom: '2px solid #30363d' }}>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#c9d1d9',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#21262d',
                  zIndex: 1,
                }}
              >
                {column.label}
              </th>
            ))}
            {onActionClick && (
              <th
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#c9d1d9',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: '120px',
                }}
              >
                {actionLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={row.id || index}
              style={{
                borderBottom: '1px solid #30363d',
                transition: 'background-color 0.2s',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#21262d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#161b22';
              }}
              onClick={(e) => {
                // Don't trigger row click if clicking on action button
                if (onRowClick && !(e.target as HTMLElement).closest('button')) {
                  onRowClick(row);
                }
              }}
            >
              {visibleColumns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: '0.75rem 1rem',
                    color: '#c9d1d9',
                    fontSize: '0.875rem',
                    whiteSpace: column.key === 'thumbnail_url' ? 'normal' : 'nowrap',
                    maxWidth: column.key === 'thumbnail_url' ? 'none' : '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={typeof row[column.key] === 'string' && row[column.key].length > 50 ? row[column.key] : undefined}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : formatValue(row[column.key], column.key)}
                </td>
              ))}
              {onActionClick && (
                <td
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <button
                    onClick={() => onActionClick(row)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#238636',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2ea043';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#238636';
                    }}
                  >
                    Edit/Add
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};
