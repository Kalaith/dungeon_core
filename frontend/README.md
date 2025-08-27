# Dungeon Core React TypeScript

A modern React TypeScript implementation for the Dungeon Core game, focusing on dungeon management, design, and battle simulation systems.

## Tech Stack

### Core Framework
- **React 19.1.0** - Latest React with modern features
- **React DOM 19.1.0** - DOM-specific methods for React
- **TypeScript 5.8.3** - Type safety and developer experience
- **Vite 6.3.5** - Fast build tool and dev server

### State Management & Utilities
- **Zustand 5.0.5** - Lightweight state management with persistence
- **React Use 17.6.0** - Collection of essential React hooks
- **React Router DOM 7.6.2** - Client-side routing

### Styling & Animations
- **Tailwind CSS 4.1.10** - Utility-first CSS framework
- **@tailwindcss/vite 4.1.10** - Tailwind CSS integration for Vite
- **Framer Motion 12.18.1** - Production-ready motion library for React
- **Autoprefixer 10.4.21** - CSS vendor prefix automation

### Data Visualization
- **Chart.js 4.4.9** - Charts for game statistics and progress tracking (if applicable for dungeon stats)

### Development Tools
- **ESLint 9.25.0** - Code linting and quality
- **TypeScript ESLint 8.30.1** - TypeScript-specific linting rules
- **@vitejs/plugin-react 4.4.1** - React support for Vite
- **@types/react 19.1.2** - TypeScript definitions for React
- **@types/react-dom 19.1.2** - TypeScript definitions for React DOM

## Dungeon Core Frontend

### Overview
The frontend for Dungeon Core is built using modern React and TypeScript principles, ensuring maintainability, scalability, and performance. It provides tools for designing and managing dungeon layouts, resources, and simulating battles against adventurers.

### Features
- **Dungeon Design**: Intuitive interface for creating and customizing dungeon layouts with various tile types (floor, wall, trap, spawn points).
- **Resource Management**: Tracking and managing dungeon resources (e.g., mana, gold, monster population).
- **Trap & Monster Placement**: Tools for strategically placing traps and deploying monsters within the dungeon.
- **Battle Simulation**: Simulating battles between adventurers and dungeon defenses, providing detailed logs and outcomes.
- **Character Trait Modifiers**: Integration with `trait_modifiers.md` for applying character attributes in battle simulations.
- **Game Statistics**: Visual representation of dungeon performance and battle outcomes.
- **Modern UI**: Responsive and visually appealing interface built with Tailwind CSS and enhanced with Framer Motion animations.

### Architecture Highlights

#### State Management
- **Zustand**: Utilized for global game state, including the current dungeon layout, placed traps and monsters, resource counts, and battle simulation results. Zustand stores are defined in `src/stores/` and provide reactive access to data. Persistence is handled via Zustand's built-in middleware, saving critical game state to `localStorage` for session continuity.

#### Data Flow & Storage
- **Game Data (`src/data/`)**: Static game configurations like tile types, trap definitions, monster stats, and adventurer archetypes are stored as immutable JavaScript objects/arrays. These are loaded once at application startup.
- **Client-Side State (`src/stores/`)**: Dynamic game state (current dungeon grid, resource levels, battle logs) is managed by Zustand stores. These stores are the single source of truth for the UI.
- **Local Storage**: Zustand stores are configured to persist key game state slices to `localStorage`. This allows users to save and load their dungeon designs and progress.
- **API Interaction**: (If applicable) For features requiring server interaction (e.g., sharing dungeon designs, global leaderboards for battle simulations), data is fetched from and sent to the backend API using standard `fetch` or a library like `axios`. Responses are then integrated into the Zustand state.

#### Data Presentation
- **React Components (`src/components/`)**: Data from Zustand stores and static game data is consumed by React components. Components are designed to be modular and reusable, focusing on presenting specific pieces of information or interactive elements.
- **Tailwind CSS**: Used for styling all UI elements. Components are built with utility classes for responsive layouts, consistent theming, and rapid prototyping. This ensures a cohesive visual design across the application.
- **Framer Motion**: Applied to create smooth and engaging animations. Examples include:
    - Visual feedback for placing and moving dungeon tiles.
    - Transition effects for battle simulation results and resource updates.
    - Interactive elements for trap and monster configuration.

#### Type Safety
- **TypeScript**: Enforced throughout the codebase. Comprehensive type definitions (`src/types/`) are used for:
    - **Game State**: Defining the structure of all Zustand stores (e.g., `DungeonState`, `BattleLog`).
    - **API Contracts**: Ensuring consistency between frontend requests and backend responses.
    - **Component Props**: Clearly defining the expected inputs for each React component.
    - **Game Entities**: Strongly typing game objects like `DungeonTile`, `Trap`, `Monster`, and `Adventurer`.
This significantly reduces runtime errors and improves code maintainability and developer experience.

### Project Structure
```
src/
├── api/                # (Optional) API service definitions and types for backend interaction
├── components/         # Reusable React components
│   ├── ui/             # Generic UI components (Button, Modal, Input, etc.)
│   ├── game/           # Game-specific components (DungeonGrid, TilePalette, BattleLogDisplay)
│   └── layout/         # Layout components (Header, Sidebar, MainContent)
├── hooks/              # Custom React hooks for encapsulating logic (e.g., useDungeonBuilder, useBattleSimulator)
├── stores/             # Zustand state management definitions (e.g., useDungeonStore, useBattleStore)
├── types/              # TypeScript type definitions for all data structures and interfaces
├── data/               # Static game data (e.g., tileTypes.ts, monsterStats.ts, adventurerClasses.ts)
├── utils/              # Utility functions and core game logic (e.g., pathfinding, battle calculations)
├── assets/             # Static assets like images, icons (if not in public/)
└── styles/             # Global CSS, Tailwind configuration, and any custom styles
```

### Development
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

### License
This project is licensed under the MIT License.