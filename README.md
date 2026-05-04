# Dungeon Core

Build the dungeon. Feed it adventurers. Grow stronger from every failed raid.

Dungeon Core is a dungeon management strategy game where you play as the intelligence behind a living dungeon. Shape each floor, spend mana on rooms and monsters, lure adventuring parties inside, and turn their ambition into gold, souls, and deeper power.

## Game Loop

1. Expand the dungeon with new rooms and deeper floors.
2. Spend mana to place monsters where they will do the most damage.
3. Open the dungeon and wait for adventurer parties to enter.
4. Watch parties push through rooms, fight defenders, retreat, or perish.
5. Use earned gold, souls, and mana to reinforce the dungeon.
6. Unlock stronger monster species and prepare for harder raids.

## Current Features

- Multi-floor dungeon construction with entrance, normal, boss, and core rooms.
- Mana, gold, souls, time, and dungeon status management.
- Monster placement with floor scaling, room capacity, boss rooms, and species unlocks.
- Adventurer parties that enter, explore, fight, loot, retreat, and leave battle logs.
- Monster experience and progression data.
- Guest play and WebHatchery account linking for persistent progress.
- Backend-backed game state for saved dungeon progress.

## Strategy Notes

- Keep enough mana available before opening the dungeon.
- Boss rooms are expensive, but they create stronger defensive anchors.
- Deeper floors scale monster strength and costs, so expansion should be paced.
- Adventurers can escape with loot if your defenses are thin.
- Closing the dungeon gives you room to rebuild before the next wave.

## Playing Locally

Requirements:

- Node.js
- PHP 8.1+
- Composer
- MySQL

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Start the backend:

```bash
cd backend
composer install
composer start
```

Required backend environment variables must be configured explicitly. At minimum, set database credentials, `JWT_SECRET`, and `WEB_HATCHERY_LOGIN_URL`.

## Project Layout

```text
dungeon_core/
├── frontend/      # Game UI
├── backend/       # API, auth, persistence, and game actions
├── publish.ps1    # Preview/production deployment helper
└── README.md
```

## Quality Checks

Frontend:

```bash
cd frontend
npm run lint
npm run type-check
npm run test:run
npm run build
```

Backend:

```bash
cd backend
composer run-script cs-check
composer run-script test
composer audit
```

## Publishing

Deploy to the preview/test environment:

```powershell
.\publish.ps1
```

Deploy to production:

```powershell
.\publish.ps1 -Production
```

Part of the WebHatchery game collection.
