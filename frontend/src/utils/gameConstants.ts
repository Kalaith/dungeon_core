import type { GameConstants } from '../types/game';

export function requirePositiveInterval(constants: GameConstants, key: keyof GameConstants): number {
  const value = Number(constants[key]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${String(key)} must be configured as a positive number`);
  }

  return value;
}
