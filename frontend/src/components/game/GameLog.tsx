import React, { useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";

export const GameLog: React.FC = () => {
  const { log } = useGameStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [log]);

  

  return (
    <div className="game-log-container mt-4 bg-white rounded-lg shadow p-4">
      <h4 className="font-bold mb-2 text-gray-800">Dungeon Log</h4>
      <div className="game-log bg-gray-50 p-3 rounded h-40 overflow-y-auto border">
        {log.length === 0 ? (
          <div className="text-gray-400 italic text-center">No activity yet...</div>
        ) : (
          log.map((entry, idx) => (
            <div 
              key={idx} 
              className="log-entry py-1 text-sm text-gray-600"
            >
              {typeof entry === 'string' ? entry : entry.message}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
