import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const AdventurerChat: React.FC = () => {
  const { log } = useGameStore();
  
  const adventurerMessages = log
    .filter(entry => entry.type === 'adventure' && entry.message.includes('says:'))
    .slice(-5); // Show last 5 messages

  return (
    <div className="adventurer-chat bg-gray-800 text-white p-3 border-t border-gray-700">
      <h4 className="text-sm font-bold mb-2 text-gray-300">Adventurer Chat</h4>
      <div className="chat-messages space-y-1 max-h-20 overflow-y-auto">
        {adventurerMessages.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No adventurer chatter yet...</div>
        ) : (
          adventurerMessages.map((msg: { message: string; type: string; timestamp: number }, index: number) => (
            <div key={index} className="text-xs text-gray-300">
              {msg.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};