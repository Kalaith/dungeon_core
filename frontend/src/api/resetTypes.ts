import type { InitializeGameResponse } from './types';

export interface ResetGameResponse {
  success: boolean;
  message?: string;
  error?: string;
  gameData?: InitializeGameResponse;
}
