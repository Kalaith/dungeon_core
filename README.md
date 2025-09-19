# Dungeon Core

A modern dungeon management game featuring a React TypeScript frontend and PHP backend. Design and manage your dungeon, place monsters and traps, and defend against adventuring parties.

## Overview

Dungeon Core is a strategic dungeon management game where players:
- Design and build dungeon layouts with various rooms and tiles
- Manage resources like mana, gold, and souls
- Place monsters and traps strategically
- Simulate battles against adventuring parties
- Track dungeon performance and statistics

## Architecture

The project follows a modern full-stack architecture:

### Frontend (`frontend/`)
- **React 19.1.0** with **TypeScript 5.8.3**
- **Vite** for fast development and building
- **Tailwind CSS** for styling with **Framer Motion** animations
- **Zustand** for state management
- **React Router** for navigation

### Backend (`backend/`)
- **PHP 8.1+** with **Clean Architecture** principles
- **Slim Framework** for REST API
- **MySQL** database with automatic migrations
- Domain-driven design with clear separation of concerns

## Quick Start

### Prerequisites
- **Node.js** (for frontend)
- **PHP 8.1+** (for backend)
- **Composer** (for PHP dependencies)
- **MySQL** (for database)

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kalaith/dungeon_core.git
   cd dungeon_core
   ```

2. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will be available at [http://localhost:5173](http://localhost:5173)

3. **Setup Backend:**
   ```bash
   cd backend
   composer install
   php -S localhost:8000 -t public
   ```
   Backend API will be available at [http://localhost:8000](http://localhost:8000)

4. **Database Configuration:**
   - Configure database settings in `backend/config/database.php` or use environment variables in `backend/.env`
   - Database and tables are created automatically on first access

## Project Structure

```
dungeon_core/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── stores/          # Zustand state management
│   │   ├── types/           # TypeScript type definitions
│   │   ├── pages/           # Application pages
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── README.md
├── backend/                  # PHP backend
│   ├── src/
│   │   ├── Domain/          # Business logic entities
│   │   ├── Application/     # Use cases and DTOs
│   │   └── Infrastructure/  # Database and external services
│   ├── public/              # Web server entry point
│   ├── migrations/          # Database migrations
│   ├── composer.json
│   └── README.md
├── publish.ps1              # Deployment script
└── README.md                # This file
```

## Development

### Frontend Development
```bash
cd frontend
npm run dev     # Start development server
npm run build   # Build for production
npm run lint    # Run ESLint
npm run preview # Preview production build
```

### Backend Development
```bash
cd backend
composer install                    # Install dependencies
php -S localhost:8000 -t public    # Start development server
php run_migration.php              # Run database migrations manually
```

### Production Deployment

Use the PowerShell publishing script for deployment:

```powershell
# Deploy to preview environment
.\publish.ps1

# Deploy to production environment  
.\publish.ps1 -Production

# Deploy only frontend or backend
.\publish.ps1 -Frontend
.\publish.ps1 -Backend

# Clean deploy with verbose output
.\publish.ps1 -All -Clean -Verbose -Production
```

## API Endpoints

The backend provides REST API endpoints for game management:

- **Game State**: Initialize, get state, place monsters, unlock species
- **Dungeon Management**: Add rooms, manage layouts
- **Battle System**: Simulate adventures and track results

See `backend/README.md` for complete API documentation.

## Features

### Dungeon Design
- Intuitive interface for creating dungeon layouts
- Various tile types (floor, wall, trap, spawn points)
- Multi-floor dungeon support

### Resource Management
- Track mana, gold, and souls
- Strategic resource allocation
- Real-time resource updates

### Monster & Trap Placement
- Deploy monsters strategically
- Place various trap types
- Manage monster experience and unlocking new species

### Battle Simulation
- Simulate adventurer parties vs dungeon defenses
- Detailed battle logs and outcomes
- Performance statistics and analytics

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the individual component README files for details.

## Development Notes

- The frontend and backend are designed to work independently during development
- Database schema is automatically managed through migrations
- The publishing script handles both preview and production deployments
- See individual component README files for detailed setup and development instructions