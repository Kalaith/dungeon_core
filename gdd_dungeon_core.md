# Dungeon Core Simulator - Game Design Document

## Overview
A web-based idle game where players take on the role of a Dungeon Core, building and managing a dungeon. Adventurers enter daily to fight monsters, collect loot, and potentially die. The game features 2D Zelda-like visuals with autonomous combat.

## Core Gameplay Loop
1. **Dungeon Management Phase** (Active)
   - Place rooms, monsters, and traps
   - Spend mana to spawn monsters
   - Upgrade dungeon features
   - Note: Players can only modify (build, place monsters/traps, upgrade, etc.) the dungeon while it is **Closed**. No modifications are allowed while the dungeon is Open, Closing, or in Maintenance.
2. **Adventurer Phase** (Idle)
   - Watch adventurers progress through dungeon
   - Autonomous combat plays out
   - Adventurers loot or die
3. **Reset Phase** (Idle)
   - Monsters respawn when dungeon is empty
   - New adventurer parties form in town

## Dungeon System
### Layout
- Multiple connected rooms (5 per floor)
- Last room contains boss battle
- Shortcut exit after boss room
- Staircases appear for multi-floor dungeons

### Room Types
- All rooms are of a single base type, but each room can have a **theme**.
- The **boss room** at the end of each floor can also have a theme.

| Room | Function | Theming |
|------|----------|---------|
| Standard Room | Monster/trap encounters | Can be themed (see below) |
| Boss Room | Final challenge per floor | Can be themed (see below) |

### Room Themes
- Each room (including boss rooms) can have a theme (e.g., Fire, Ice, Poison, Shadow, etc.).
- **Theme Effects:**
  - Empower monsters (e.g., Fire theme boosts fire monsters)
  - Make traps harder to spot or more effective
  - Other environmental effects (e.g., healing, debuffs)
- **Changing Themes:**
  - The player can change a room's theme at any time while the dungeon is closed
  - Changing a theme costs mana, but some mana is refunded from the previous theme

### Trap System
- Traps can be placed in any room (except where otherwise restricted).
- Each room can support up to **3 traps**.
- Traps cost mana to place, just like monsters.
- Trap effects stack, but are limited by the room's trap capacity.

### Dungeon Rules
- Monsters respawn only when dungeon is empty
- New groups wait until respawn completes
- Overspending on monsters increases respawn time
- Dungeon "closes" for maintenance (like Theme Park)

## Dungeon Status & Party Limits

### Dungeon Status States
- **Open**: Adventurer parties can enter the dungeon at any time, as long as no other party is currently inside.
- **Closing**: The player has closed the dungeon, but an adventurer party is still inside. No new parties will enter. When the last party leaves, the dungeon switches to Closed.
- **Closed**: No new adventurer parties can enter. The player can reopen the dungeon at any time.
- **Maintenance**: Automatic nightly closure (0:00–6:00). No parties can enter, and monsters automatically respawn if the dungeon is empty.

### Party Entry Rules
- **Single Party Limit**: Only one adventurer party can be inside the dungeon at a time. New parties will not spawn until the dungeon is empty and open.
- **Cooldown**: After a party leaves, there is a short cooldown before a new party can enter.
- **Manual Control**: The player can open or close the dungeon at any time (except during maintenance). If closed while a party is inside, the status becomes "Closing" until the party leaves.

### Monster Respawn
- Monsters only respawn when the dungeon is empty (no adventurer parties inside), either during maintenance or after the last party leaves.
- Dead monsters remain visible in rooms as skulls until respawned.

### Modification Restriction
- Players can only modify the dungeon (build, place monsters/traps, upgrade, etc.) while it is **Closed**. No changes are allowed during Open, Closing, or Maintenance status.

## Monster System
- Cost mana to place
- Permanent until killed (then respawn)
- Themed by room type
- Strength scales with dungeon level
- Can be upgraded between runs

## Monster Breeds & Progression
- **Starting Choice:** When starting a new game, the player chooses a monster breed (e.g., Goblins, Dragons, etc.).
- **Breed Experience:** Using monsters of a breed earns experience with that breed.
- **Unlocking Variants:** As breed experience increases, advanced variants are unlocked (e.g., Goblin Archer, Goblin Shaman, Goblin King; Dragon Whelp → Adult Dragon).
- **Initial Availability:** Only basic monsters of the chosen breed are available at first (e.g., Goblin, Dragon Whelp).
- **Unlocking New Breeds & Themes:** As the player levels up, they can unlock additional monster breeds and new floor themes.
- **Strategic Depth:** Each breed and variant offers unique abilities and synergies, encouraging specialization and experimentation.

### Example Progression
- Player chooses Goblins → starts with basic Goblin
- After using Goblins in combat, unlocks Goblin Archer, then Goblin Shaman, then Goblin King
- Later, unlocks the ability to use Dragons, starting with Dragon Whelps

## Adventurer System
### Behavior
- Parties of 3-4 adventurers
- Autonomous combat (Gladiator-style)
- Decision making:
  - 0-1 casualties: Continue
  - 2+ casualties: Retreat
  - Party wipe: Permanent death

### Progression
- Level up with experience
- Permanent death system
- Dynamic party formation:
  - Replace dead members
  - Disband if too many losses
- Visible gear upgrades
- **Semi-persistent Parties**: Each adventurer party keeps its identity (e.g., "Party 1") and roster between dungeon runs. If a member dies, they are replaced by a new named adventurer in the next run (e.g., if Sara dies, next time the party might have John instead).
  - Example: Party 1 starts as Charles, Mary, Sara. If Sara dies, next run Party 1 is Charles, Mary, John.

### Daily Cycle (Updated)
- **Open**: 6AM–12AM (18h) — parties can enter if the dungeon is open and empty
- **Manual Open/Close**: Player can close the dungeon at any time; if a party is inside, status is "Closing" until they leave, monsters respawn after closed

### Party Spawning (Updated)
- Only one party can be present in the dungeon at a time
- New parties spawn only if the dungeon is open and empty, and after a cooldown
- No new parties spawn during "Closing", "Closed", or "Maintenance" status

### Mana Gain and Regeneration
- When an adventurer dies, the player instantly gains mana equal to the adventurer's level × 10.
- While a party is present, mana regeneration is increased by +1 per adventurer in the party.

## Economy Systems
### Resources
| Resource | Generation | Use |
|----------|------------|-----|
| Mana | Passive regen | Monster & trap spawning |
| Gold | Adventurer deaths | Upgrades/expansions |
| Souls | Boss kills | Premium content |

### Mana System (Expanded)
- **Initial Mana**: Players start with 50 mana.
- **Room Bonus**: Each room built adds +5 maximum mana.
- **Floor Bonus**: Each new floor increases maximum mana by +50.
- **Example Calculation**:
  - 2 floors, 5 rooms on floor 1, 1 room on floor 2:
    - Base: 50
    - Rooms: (5 + 1) × 5 = 30
    - Floors: 2 × 50 = 100
    - **Total Mana**: 50 + 30 + 50 (for the second floor only) = 130
- Mana is used for monster spawning and other dungeon actions.

### Mana Generation Bonuses
- While an adventurer party is in the dungeon, mana regeneration is increased by +1 per adventurer present (e.g., a 4-person party grants +4 mana regen per tick).
- Whenever an adventurer dies, the player instantly gains mana equal to (adventurer's level × 10).

### Expansions
- Earnable in-game or purchasable
- New monster types
- Special traps/features

## Future Considerations
2. **Spell System**
   - Dungeon abilities during runs
   - Environmental effects

## Technical Specifications
- **Platform**: Web-based (HTML5)
- **Visuals**: Top-down 2D (Zelda-like)
- **Combat**: Autonomous (Gladiator-inspired)
- **Save System**: Cloud-based progression

## UI Mockup (Concept)

## User Interface & Screens

- **Adventurer Parties Overview:**
  - View all adventurer parties, their current members, and party history (deaths, replacements, progress).
- **Party Selection Screen:**
  - Select and inspect a party mid-run to see their stats, equipment, and current position in the dungeon.
- **Monster Selection Screen:**
  - Choose which monsters to place in rooms, view unlocked variants, and upgrade monsters.
- **Room Theme Change Screen:**
  - Select and apply a new theme to any room (while the dungeon is closed), preview theme effects and mana cost/refund.
- **Dungeon Core Level Up & Perks Screen:**
  - View Dungeon Core level, see unlock progress, and select perks or upgrades as the core levels up.

These screens are essential for player control, progression, and strategic planning.