# Dungeon Core Backend

Clean Architecture PHP backend for the Dungeon Core game.

## Setup

1. Install dependencies:
```bash
composer install
```

2. Configure database in `config/database.php` or use environment variables in `.env`

3. The backend will automatically create the database and tables when first accessed

## Launch Instructions

To launch the PHP backend:

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   composer install
   ```

3. **Start the development server:**
   ```bash
   php -S localhost:8000 -t public
   ```

**GitHub Copilot Instructions:** Do not automatically run the PHP server using run_in_terminal. The user will manually start the server when needed.

The backend will automatically:
- Load environment variables from `.env` file
- Create the MySQL database if it doesn't exist
- Create all required tables
- Handle initial data setup

You should see output like:
```
Database 'dungeon_core' created successfully.
Database tables created successfully.
PHP 8.x.x Development Server (http://localhost:8000) started
```

## API Endpoints

### Game State
- `GET /api/game/initialize` - Initialize new game
- `GET /api/game/state` - Get current game state
- `POST /api/game/place-monster` - Place monster in room
- `POST /api/game/unlock-species` - Unlock monster species
- `POST /api/game/gain-experience` - Gain monster experience
- `GET /api/game/available-monsters` - Get available monsters

### Dungeon Management  
- `POST /api/dungeon/add-room` - Add room to dungeon

## Architecture

### Domain Layer
- **Entities**: Pure business objects (Game, Monster)
- **Repositories**: Interfaces for data access
- **Services**: Business logic calculations

### Application Layer
- **Use Cases**: Application-specific business rules
- **DTOs**: Data transfer objects

### Infrastructure Layer
- **Database**: MySQL implementations of repositories
- **Migrations**: Database schema

### Controllers
- HTTP request/response handling
- Route to appropriate use cases

## Database Independence

The domain layer has no database dependencies. To switch databases:

1. Create new repository implementations (e.g., `PostgreSQLGameRepository`)
2. Update dependency injection in `public/index.php`
3. Business logic remains unchanged

## Security Features

- Server-side validation of all actions
- Mana/gold spending verification
- Room capacity limits enforced
- Session-based game state