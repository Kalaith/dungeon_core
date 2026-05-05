# Dungeon Core UI Implementation Notes

## Phase 0 Audit

- Backend HUD state is available through `useBackendGameStore.gameState`: mana, max mana, mana regen, gold, souls, day, hour, dungeon status, build lock state, and active adventurer party count.
- Dungeon structure is loaded separately through `getDungeonState()`, which returns floors, rooms, room types, monster occupancy, monster life state, loot, and deepest-floor markers.
- Monster and rules data are loaded through existing data endpoints: `getMonsterTypes()`, `fetchGameConstantsData()`, and `getRoomCost()`.
- Existing gameplay actions are already backend-backed: `addRoom()`, `placeMonster()`, `updateStatus()`, `resetGame()`, and species unlocks through `unlockMonsterSpeciesAPI()`.
- Current UI-only state exists only for `selectedMonster`; the production pass also needs local `selectedRoom`, `selectedFloor`, `heatmapMode`, mobile tab selection, and command/loading feedback.
- Build blockers are represented by `canModifyDungeon`, active adventurer count, current mana, and the backend action response.
- Monster placement blockers are represented by `canModifyDungeon`, selected monster, current mana, room type/capacity, and the backend action response.
- Recent log and party details are incomplete in the compact backend store; Phase 4 should use the available local log and backend active-party count without introducing new backend requirements.

## Blockers

- No backend changes are required for this UI pass.
- Detailed live adventurer party cards are limited by the current compact backend response; the first pass should show designed summary cards and avoid inventing unavailable party members.
