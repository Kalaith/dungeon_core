# Dungeon Core Development Instructions

**ALWAYS** follow these instructions first and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.

## Project Overview
Dungeon Core is a full-stack web application with a React TypeScript frontend and PHP Slim framework backend. The game simulates a dungeon management system where players build dungeons, place monsters, and defend against adventurer parties.

## Architecture
- **Frontend**: React 19.1.0 + TypeScript 5.8.3 + Vite 6.3.5 + Tailwind CSS 4.1.10
- **Backend**: PHP 8.3.6 + Slim Framework 4.15.0 + MySQL 8.0
- **Development Servers**: Frontend runs on localhost:5173, Backend runs on localhost:8000

## Required System Dependencies
ALWAYS install these exact versions before starting development:
- **Node.js**: v20.19.5 or higher (verified working)
- **npm**: 10.8.2 or higher (verified working)
- **PHP**: 8.3.6 or higher (verified working)
- **Composer**: 2.8.11 or higher (verified working)
- **MySQL**: 8.0.43 or higher (verified working)

## Bootstrap Instructions

### Initial Setup (First Time Only)
1. **Navigate to project root:**
   ```bash
   cd /path/to/dungeon_core
   ```

2. **Start MySQL service:**
   ```bash
   sudo service mysql start
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```
   - **Timing**: Takes ~11 seconds on typical systems
   - **NEVER CANCEL**: This command completes quickly but may show vulnerabilities - this is normal

4. **Install backend dependencies:**
   ```bash
   cd ../backend
   composer install
   ```
   - **CRITICAL**: If this fails due to GitHub rate limiting/token issues:
     - Create token at: https://github.com/settings/tokens/new?scopes=&description=Composer
     - OR use: `composer install --ignore-platform-reqs` as workaround
   - **Timing**: Takes 2-5 minutes depending on network
   - **NEVER CANCEL**: Wait for completion even if it appears slow

5. **Create backend environment file:**
   ```bash
   cd backend
   cp .env.example .env  # If .env.example exists, otherwise create manually
   ```
   OR create `.env` file with:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=dungeon_core
   DB_USER=root
   DB_PASSWORD=
   ```

### Daily Development Workflow

#### Start Development Servers
**ALWAYS** run these commands in separate terminal sessions:

1. **Terminal 1 - Start Backend Server:**
   ```bash
   cd backend
   php -S localhost:8000 -t public
   ```
   - **Expected Output**: `PHP 8.x.x Development Server (http://localhost:8000) started`
   - **Timing**: Starts immediately (< 2 seconds)
   - **NEVER CANCEL**: Leave this running during development

2. **Terminal 2 - Start Frontend Dev Server:**
   ```bash
   cd frontend
   npm run dev
   ```
   - **Expected Output**: `Local: http://localhost:5173/`
   - **Timing**: Starts in ~500ms
   - **NEVER CANCEL**: Leave this running during development

#### Access Applications
- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:8000/api/
- **Both servers must be running simultaneously for full functionality**

## Build and Validation Commands

### Frontend Commands
**Run from `/frontend` directory:**

- **Development**: `npm run dev` (starts dev server)
- **Build**: `npm run build` 
  - **Timing**: 3-4 seconds
  - **NEVER CANCEL**: Set timeout to 60+ seconds
- **Lint**: `npm run lint`
  - **Timing**: ~2 seconds
  - **Expected**: Currently shows 40 problems (36 errors, 4 warnings) - these are existing code quality issues
  - **Note**: Lint errors are development reminders and do NOT prevent building
- **Preview**: `npm run preview` (preview production build)

### Backend Commands  
**Run from `/backend` directory:**

- **Start Server**: `php -S localhost:8000 -t public`
- **Check Syntax**: `php --syntax-check public/index.php`
- **Run Migration**: `php run_migration.php` (sets up database)
- **Test Endpoint**: `php test_dungeon_endpoint.php` (requires server running)

### Required Pre-Commit Validation
**ALWAYS** run these commands before committing changes:

1. **Frontend linting (check for new issues):**
   ```bash
   cd frontend && npm run lint
   ```
   - **Current status**: 40 existing issues (36 errors, 4 warnings)
   - **Action**: Fix any NEW issues you introduce, existing issues are acceptable

2. **Frontend build (must pass):**
   ```bash
   cd frontend && npm run build
   ```
   - **NEVER CANCEL**: Takes 3-4 seconds, wait for completion
   - **Must succeed**: Build failure prevents deployment

3. **Backend syntax check:**
   ```bash
   cd backend && php --syntax-check public/index.php
   ```

## Manual Testing Scenarios

### Full Application Test (REQUIRED after any changes)
1. **Start both servers** (see "Start Development Servers" above)
2. **Open browser to http://localhost:5173/**
3. **Verify API connectivity:**
   ```bash
   curl -s http://localhost:8000/api/game/initialize
   ```
4. **Test basic game functionality:**
   - Initialize new game
   - Place a monster in a room
   - Add a new room to dungeon
   - Check game state persistence

### API Endpoint Testing
**Key endpoints to test manually:**
- `GET /api/game/initialize` - Initialize new game
- `GET /api/game/state` - Get current game state  
- `POST /api/game/place-monster` - Place monster in room
- `POST /api/dungeon/add-room` - Add room to dungeon
- `GET /api/data/game-constants` - Get game configuration

## Common Build Issues and Solutions

### Frontend Issues
- **TypeScript Errors**: Fix all TypeScript errors before building
- **ESLint Warnings**: Address @typescript-eslint/no-explicit-any warnings by using proper types
- **Missing Dependencies**: Run `npm install` if node_modules is missing

### Backend Issues
- **Composer Dependencies**: Create GitHub token if rate limited
- **Database Connection**: Ensure MySQL is running and .env file exists
- **Missing autoload.php**: Run `composer install` to generate vendor directory

## File Structure Overview

### Frontend (`/frontend`)
```
src/
├── api/                # Backend API client and types
├── components/         # React components
│   ├── ui/            # Generic UI components
│   ├── game/          # Game-specific components
│   └── layout/        # Layout components
├── stores/            # Zustand state management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # Global CSS and Tailwind config
```

### Backend (`/backend`)
```
src/
├── Application/       # Use cases and DTOs
├── Domain/           # Entities and business logic
├── Infrastructure/   # Database implementations
└── Controllers/      # HTTP request handlers
config/               # Configuration files
migrations/           # Database schema
public/              # Web server document root
```

## Deployment

### Development Environment
- Frontend builds to `/frontend/dist/`
- Use `publish.ps1` script for Windows deployment
- Supports preview and production environments

### Production Considerations
- Build frontend: `npm run build`
- Install backend deps: `composer install --no-dev --optimize-autoloader`
- Configure environment variables in `.env` files
- Ensure MySQL database is accessible

## Database Notes
- **Auto-initialization**: Backend creates database and tables automatically on first run
- **Migrations**: Located in `/backend/migrations/`
- **Required**: MySQL 8.0+ for proper compatibility

## Critical Reminders
- **NEVER CANCEL long-running commands** - they complete within expected timeframes
- **ALWAYS test both frontend and backend** after making changes
- **ALWAYS run linting** before committing
- **Both servers must run simultaneously** for full functionality
- **TypeScript errors prevent building** - fix all before proceeding

## When Instructions Are Insufficient
If these instructions don't cover your scenario:
1. Check repository README files in `/frontend/README.md` and `/backend/README.md`
2. Examine existing configuration files (vite.config.ts, composer.json, etc.)
3. Use bash commands to explore project structure
4. Test commands incrementally and document any discoveries