import React from "react";
import type { GameState } from "../../stores/backendGameStore";

interface ResourceBarProps {
  gameState: GameState;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ gameState }) => {
  const { 
    mana, 
    maxMana, 
    gold, 
    souls, 
    day, 
    hour, 
    status 
  } = gameState;

  const formatTime = (hour: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    return `${displayHour}:00 ${period}`;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-green-600';
      case 'Closing': return 'text-orange-600';
      case 'Closed': return 'text-yellow-600';
      case 'Maintenance': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <header className="game-header bg-gray-800 text-white">
      <div className="resource-bar p-3 md:p-4">
        {/* Top Row - Main Resources */}
        <div className="flex flex-wrap gap-3 md:gap-6 justify-between items-center mb-2">
          {/* Mana */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-blue-400 text-lg">✨</span>
            <div className="flex flex-col min-w-0">
              <div className="text-sm md:text-base font-medium">
                {mana}/{maxMana}
              </div>
              <div className="w-16 md:w-24 bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(mana / maxMana) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-blue-300 hidden sm:inline">Backend</span>
          </div>
          
          {/* Gold & Souls */}
          <div className="flex gap-4 md:gap-6">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-lg">💰</span>
              <span className="text-yellow-300 text-sm md:text-base font-medium">{gold}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-purple-400 text-lg">👻</span>
              <span className="text-purple-300 text-sm md:text-base font-medium">{souls}</span>
            </div>
          </div>
        </div>
        
        {/* Bottom Row - Status & Info */}
        <div className="flex flex-wrap gap-2 justify-between items-center text-xs md:text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-300">
              Day <span className="font-bold">{day}</span> - {formatTime(hour)}
            </span>
            <span className={`font-bold ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
