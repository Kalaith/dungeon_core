Dungeon Core Simulator - Game Design Document (v1.2)

CORE CONCEPT
A web-based idle game where players build and manage a linear dungeon. Adventurers progress through increasingly difficult floors to reach the core room. Features autonomous combat with floor-based scaling.

DUNGEON STRUCTURE

Linear room progression: Entrance <-> Room 1 <-> Room 2 <-> Room 3 <-> Room 4 <-> Boss Room <-> Core Room (last floor only)

5 combat rooms + core room per floor

New rooms insert between entrance and first room

When floor reaches 5 rooms, next addition creates new floor

Core room automatically moves to deepest floor

ROOM TYPES

Normal Rooms (1-4): Standard combat encounters

Boss Room (Room 5):

Any monster placed becomes boss (+50% stats, special ability)

Maximum 1 boss per floor

3x loot drops

Core Room:

Only exists on deepest floor

Cannot place monsters

Generates global buffs

FLOOR SCALING SYSTEM
Floor | Mana Cost | Monster Boost | Adventurer Level
1 | 1.0x | +0% | 1-3
2 | 1.5x | +30% | 3-5
3 | 2.2x | +60% | 5-7
4 | 3.0x | +100% | 7-10
5+ | +1.0x | +50% | +2 levels

MONSTER SYSTEM

Mana cost = Base cost × floor multiplier

Boss rooms apply 2x additional cost

Stats scale with floor depth formula: base × (1 + floor_number × 0.3)

Respawn only when dungeon is empty

Boss monsters gain unique abilities

ADVENTURER SYSTEM

Parties of 3-4 members

Auto-level to match floor depth

Behavior:

Full heal before boss rooms

25% chance to retreat if underleveled

Permanent death system

Reform party in town after losses

PROGRESSION FEATURES

Deep Core Bonus: +5% mana regen per floor

Floor-Locked Upgrades:

Floor 2: Trap Synergy (+20% trap damage)

Floor 3: Monster Evolution

Floor 5: Dual Boss Rooms