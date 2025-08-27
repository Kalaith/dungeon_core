# Frontend-to-Backend Security Migration

## Summary of Changes Made

This migration moves all security-critical calculations from the frontend to the backend to prevent cheating.

## Backend Changes

### New Use Cases Created

1. **UnlockMonsterSpeciesUseCase** (`backend/src/Application/UseCases/UnlockMonsterSpeciesUseCase.php`)
   - Validates species unlock requests
   - Checks gold requirements server-side
   - Prevents unauthorized species unlocking

2. **GainMonsterExperienceUseCase** (`backend/src/Application/UseCases/GainMonsterExperienceUseCase.php`)
   - Validates experience gain requests
   - Calculates tier unlocks server-side
   - Prevents experience manipulation

3. **GetAvailableMonstersUseCase** (`backend/src/Application/UseCases/GetAvailableMonstersUseCase.php`)
   - Returns server-validated available monsters
   - Based on actual unlocked species and tiers
   - Prevents client-side monster list manipulation

### Enhanced Use Cases

1. **PlaceMonsterUseCase** (`backend/src/Application/UseCases/PlaceMonsterUseCase.php`)
   - Enhanced with proper validation
   - Server-side cost calculation
   - Server-side stat scaling
   - Room capacity validation
   - Adventurer presence checks

### Enhanced Game Logic Service

**GameLogic** (`backend/src/Domain/Services/GameLogic.php`) now includes:

- `getSpeciesUnlockCost()` - Species unlock cost calculation
- `calculateUnlockedTier()` - Experience-based tier calculation  
- `getMonstersForSpeciesAndTier()` - Available monsters per tier
- `scaleMonsterStats()` - Server-side stat scaling
- `validateMonsterPlacement()` - Comprehensive placement validation

### Updated Controller

**GameController** (`backend/src/Controllers/GameController.php`) now includes endpoints:

- `POST /game/unlock-species` - Unlock monster species
- `POST /game/gain-experience` - Gain monster experience  
- `GET /game/available-monsters` - Get available monsters
- `POST /game/place-monster` - Enhanced monster placement

## Frontend Changes

### Secure API Calls

**API Client** (`frontend/src/api/client.ts`) enhanced with:
- `unlockMonsterSpecies()` - Calls backend for species unlocking
- `gainMonsterExperience()` - Calls backend for experience gain
- `getAvailableMonsters()` - Gets validated monster list
- Updated `placeMonster()` - Uses backend validation

### API Types

**API Types** (`frontend/src/api/types.ts`) enhanced with:
- `UnlockMonsterSpeciesRequest/Response` 
- `GainMonsterExperienceRequest/Response`
- `GetAvailableMonstersResponse`
- Enhanced `PlaceMonsterRequest/Response`

### Updated Monster Actions

**Monster Actions** (`frontend/src/stores/monsterActions.ts`) now:

1. **placeMonster()** - Calls secure backend API instead of local validation
2. **unlockMonsterSpecies()** - Uses backend validation and cost checking  
3. **gainMonsterExperience()** - Server-side experience and tier calculation
4. **getAvailableMonsters()** - Gets validated list from backend

### Removed Frontend Calculations

The following calculations were moved to backend and removed from frontend:

- Room capacity validation
- Monster cost calculation  
- Monster stat scaling
- Experience and tier calculations
- Species unlock validation
- Available monster determination

## Security Improvements

### Before (Vulnerable)
- Frontend calculated all costs and stats
- Client determined available monsters
- Experience/tier progression calculated client-side
- Room capacity checked locally
- Mana/gold spending validated client-side

### After (Secure)
- All calculations done server-side
- Backend validates all requests
- Server determines available content
- Costs calculated securely
- State changes authorized by backend

## Benefits

1. **Prevents Cheating**: No critical calculations in client code
2. **Server Authority**: Backend has final say on all game state
3. **Validation**: Multiple layers of server-side validation
4. **Consistency**: Single source of truth for game rules
5. **Audit Trail**: All actions go through controlled endpoints

## Migration Notes

- Frontend now acts as a "thin client" for display and input
- All game logic centralized in backend
- Network errors handled gracefully
- Client state updated only after server confirmation
- Backward compatibility maintained through API versioning

This migration successfully moves all exploitable game logic to the secure backend while maintaining the same user experience.
