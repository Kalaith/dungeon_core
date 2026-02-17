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
  InitializeGameResponse,
  UpdateDungeonStatusResponse,
} from './types';
import type { ResetGameResponse } from './resetTypes';

class ApiClient {
  private baseUrl: string;

  constructor() {
    const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!configuredApiUrl || configuredApiUrl.trim().length === 0) {
      throw new Error('VITE_API_URL is required');
    }
    this.baseUrl = configuredApiUrl.replace(/\/$/, '');
  }

  private getAuthToken(): string | null {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
      return parsed.state?.token ?? null;
    } catch {
      return null;
    }
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

    const authToken = this.getAuthToken();
    const headers = new Headers(options?.headers);
    headers.set('Content-Type', 'application/json');
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!isRoutineRequest) {
      console.log('API response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
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

  async updateDungeonStatus(status: string): Promise<UpdateDungeonStatusResponse> {
    return this.request<UpdateDungeonStatusResponse>('/game/status', {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async unlockMonsterSpecies(
    request: UnlockMonsterSpeciesRequest
  ): Promise<UnlockMonsterSpeciesResponse> {
    return this.request<UnlockMonsterSpeciesResponse>('/game/unlock-species', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async gainMonsterExperience(
    request: GainMonsterExperienceRequest
  ): Promise<GainMonsterExperienceResponse> {
    return this.request<GainMonsterExperienceResponse>('/game/gain-experience', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAvailableMonsters(): Promise<GetAvailableMonstersResponse> {
    return this.request<GetAvailableMonstersResponse>('/game/available-monsters');
  }

  // Data endpoints
  async getGameConstants(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/data/game-constants');
  }

  async getMonsterTypes(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/data/monster-types');
  }

  async getMonsterTraits(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/data/monster-traits');
  }

  async getEquipmentData(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/data/equipment');
  }

  async getFloorScaling(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/data/floor-scaling');
  }
}

export const apiClient = new ApiClient();
