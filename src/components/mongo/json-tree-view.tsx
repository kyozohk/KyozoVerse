
'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonTreeViewProps {
  data: any;
  level?: number;
}

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data, level = 0 }) => {
  if (typeof data !== 'object' || data === null) {
    return <span className="text-green-600">{JSON.stringify(data)}</span>;
  }

  const entries = Object.entries(data);

  return (
    <div>
      {entries.map(([key, value]) => (
        <Node key={key} nodeKey={key} value={value} level={level} />
      ))}
    </div>
  );
};

interface NodeProps {
  nodeKey: string;
  value: any;
  level: number;
}

const Node: React.FC<NodeProps> = ({ nodeKey, value, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first few levels
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const renderValue = () => {
    if (isArray) {
      return <span className="text-gray-500">[{value.length} items]</span>;
    }
    if (isObject) {
      return <span className="text-gray-500">{"{...}"}</span>;
    }
    if (typeof value === 'string') {
        return <span className="text-green-700">"{value}"</span>;
    }
    return <span className="text-blue-600">{JSON.stringify(value)}</span>;
  };

  return (
    <div style={{ paddingLeft: `${level * 20}px` }}>
      <div className="flex items-center cursor-pointer" onClick={isObject ? toggleExpand : undefined}>
        {isObject && (
          isExpanded ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />
        )}
        <strong className="text-purple-700">{nodeKey}:</strong>
        <span className="ml-2">{!isObject || !isExpanded ? renderValue() : (isArray ? '[' : '{')}</span>
      </div>
      {isExpanded && isObject && (
        <div>
          <JsonTreeView data={value} level={level + 1} />
          <div style={{ paddingLeft: `${level * 20}px` }}>{isArray ? ']' : '}'}</div>
        </div>
      )}
    </div>
  );
};
