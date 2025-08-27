import type { 
  GameStateResponse, 
  DungeonStateResponse,
  PlaceMonsterRequest, 
  PlaceMonsterResponse,
  UnlockMonsterSpeciesRequest,
  UnlockMonsterSpeciesResponse,
  GainMonsterExperienceRequest,
  GainMonsterExperienceResponse,
  GetAvailableMonstersResponse,
  AddRoomRequest,
  AddRoomResponse,
  InitializeGameResponse
} from './types';
import type { ResetGameResponse } from './resetTypes';

class ApiClient {
  private baseUrl = 'http://localhost:8000/api';
  private sessionId = this.getOrCreateSessionId();

  private getOrCreateSessionId(): string {
    // For now, always use the first session to avoid login complexity
    const fixedSessionId = 'x5netciu1jmd8tvw1h';
    
    // Clear any existing stored session to force fresh connection
    localStorage.removeItem('dungeon-core-session-id');
    
    console.log('Using fixed session ID:', fixedSessionId);
    return fixedSessionId;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Only log for non-routine requests to reduce console spam
    const isRoutineRequest = endpoint === '/game/state';
    if (!isRoutineRequest) {
      console.log('Making API request:', {
        url,
        method: options?.method || 'GET',
      });
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
        ...options?.headers,
      },
    });

    if (!isRoutineRequest) {
      console.log('API response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
    }

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    if (!isRoutineRequest) {
      console.log('API response data:', data);
    }
    return data;
  }

  async initializeGame(): Promise<InitializeGameResponse> {
    return this.request<InitializeGameResponse>('/game/initialize');
  }

  async getGameState(): Promise<GameStateResponse> {
    return this.request<GameStateResponse>('/game/state');
  }

  async getDungeonState(): Promise<DungeonStateResponse> {
    return this.request<DungeonStateResponse>('/dungeon/state');
  }

  async placeMonster(request: PlaceMonsterRequest): Promise<PlaceMonsterResponse> {
    return this.request<PlaceMonsterResponse>('/game/place-monster', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async addRoom(request: AddRoomRequest): Promise<AddRoomResponse> {
    return this.request<AddRoomResponse>('/dungeon/add-room', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async resetGame(): Promise<ResetGameResponse> {
    return this.request<ResetGameResponse>('/game/reset', {
      method: 'POST',
    });
  }

  async unlockMonsterSpecies(request: UnlockMonsterSpeciesRequest): Promise<UnlockMonsterSpeciesResponse> {
    return this.request<UnlockMonsterSpeciesResponse>('/game/unlock-species', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async gainMonsterExperience(request: GainMonsterExperienceRequest): Promise<GainMonsterExperienceResponse> {
    return this.request<GainMonsterExperienceResponse>('/game/gain-experience', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAvailableMonsters(): Promise<GetAvailableMonstersResponse> {
    return this.request<GetAvailableMonstersResponse>('/game/available-monsters');
  }

  // Data endpoints
  async getGameConstants(): Promise<any> {
    return this.request<any>('/data/game-constants');
  }

  async getMonsterTypes(): Promise<any> {
    return this.request<any>('/data/monster-types');
  }

  async getMonsterTraits(): Promise<any> {
    return this.request<any>('/data/monster-traits');
  }

  async getEquipmentData(): Promise<any> {
    return this.request<any>('/data/equipment');
  }

  async getFloorScaling(): Promise<any> {
    return this.request<any>('/data/floor-scaling');
  }
}

export const apiClient = new ApiClient();