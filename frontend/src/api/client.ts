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
  AdvanceGameplayResponse,
} from './types';
import type { ResetGameResponse } from './resetTypes';
import { getActiveAuthToken, WEBHATCHERY_AUTH_STORAGE_KEY } from '../stores/authStore';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly status?: number,
    public readonly nonJson = false
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
    return getActiveAuthToken();
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Only log for non-routine requests to reduce console spam
    const isRoutineRequest =
      endpoint === '/game/state' || endpoint === '/dungeon/state' || endpoint === '/game/advance';
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
      if (response.status === 401) {
        await this.persistLoginUrl(response);
      }

      const payload = await this.readJsonResponse(response, endpoint);
      const message =
        isRecord(payload) && typeof payload.error === 'string' ? payload.error : response.statusText;
      console.error('API Error:', response.status, response.statusText);
      throw new ApiRequestError(`API Error ${response.status}: ${message}`, endpoint, response.status);
    }

    const data = await this.readJsonResponse(response, endpoint);
    if (!isRoutineRequest) {
      console.log('API response data:', data);
    }
    return data as T;
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

  async advanceGameplay(): Promise<AdvanceGameplayResponse> {
    return this.request<AdvanceGameplayResponse>('/game/advance', {
      method: 'POST',
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

  private async persistLoginUrl(response: Response): Promise<void> {
    try {
      const payload = await this.readJsonResponse(response.clone(), 'auth');
      if (!isRecord(payload)) {
        return;
      }

      if (typeof payload.login_url !== 'string' || payload.login_url.trim() === '') {
        return;
      }

      const raw = localStorage.getItem(WEBHATCHERY_AUTH_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const state = parsed?.state ?? {};
      localStorage.setItem(
        WEBHATCHERY_AUTH_STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          state: {
            ...state,
            loginUrl: payload.login_url,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('webhatchery:login-required', { detail: { loginUrl: payload.login_url } })
      );
    } catch (error) {
      console.warn('Failed to persist login URL from 401 response', error);
    }
  }

  private async readJsonResponse(response: Response, endpoint: string): Promise<unknown> {
    const text = await response.text();
    if (text.trim() === '') {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      const preview = text.trim().replace(/\s+/g, ' ').slice(0, 80);
      throw new ApiRequestError(
        `API returned non-JSON response for ${endpoint}${preview ? `: ${preview}` : ''}`,
        endpoint,
        response.status,
        true
      );
    }
  }
}

export const apiClient = new ApiClient();
