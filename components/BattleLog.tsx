"use client"

import { useEffect, useRef } from 'react';
import { getBattleLogClass } from '@/lib/battleLogHelper';

interface BattleLogProps {
  messages: string[];
  maxHeight?: string;
  className?: string;
}

export default function BattleLog({ messages, maxHeight = '300px', className = '' }: BattleLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={logRef}
      className={`bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg overflow-y-auto ${className}`}
      style={{ maxHeight }}
    >
      <h3 className="font-pokemon text-lg mb-3 text-gray-800 border-b border-gray-300 pb-2">
        Battle Log
      </h3>
      <div className="space-y-1.5">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm italic">Waiting for battle to begin...</p>
        ) : (
          messages.map((message, index) => {
            const logClass = getBattleLogClass(message);
            return (
              <div 
                key={index} 
                className={`text-sm transition-all duration-200 hover:bg-gray-50 px-2 py-1 rounded ${logClass}`}
              >
                <span className="text-gray-400 mr-2 text-xs">#{index + 1}</span>
                {message}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
