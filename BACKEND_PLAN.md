# Dungeon Core Backend Plan

## Overview
Move all game logic from frontend to PHP backend to prevent cheating and ensure data integrity.

## Architecture - Clean Architecture Principles

### Backend Structure
```
backend/
├── public/
│   └── index.php              # Entry point
├── src/
│   ├── Controllers/           # HTTP layer
│   │   ├── GameController.php
│   │   ├── DungeonController.php
│   │   └── AdventurerController.php
│   ├── Domain/               # Business logic (database-agnostic)
│   │   ├── Entities/
│   │   │   ├── Game.php
│   │   │   ├── Dungeon.php
│   │   │   ├── Monster.php
│   │   │   └── Adventurer.php
│   │   ├── Services/
│   │   │   ├── GameLogic.php
│   │   │   ├── CombatSystem.php
│   │   │   └── TimeSystem.php
│   │   └── Repositories/     # Interfaces only
│   │       ├── GameRepositoryInterface.php
│   │       ├── DungeonRepositoryInterface.php
│   │       └── AdventurerRepositoryInterface.php
│   ├── Infrastructure/       # Database implementations
│   │   ├── Database/
│   │   │   ├── MySQL/
│   │   │   │   ├── MySQLGameRepository.php
│   │   │   │   ├── MySQLDungeonRepository.php
│   │   │   │   └── MySQLAdventurerRepository.php
│   │   │   ├── PostgreSQL/   # Future database support
│   │   │   └── MongoDB/      # Future database support
│   │   └── migrations/
│   └── Application/          # Use cases
│       ├── UseCases/
│       │   ├── PlaceMonsterUseCase.php
│       │   ├── AddRoomUseCase.php
│       │   └── ProcessCombatUseCase.php
│       └── DTOs/
│           ├── GameStateDTO.php
│           └── MonsterPlacementDTO.php
├── config/
│   └── database.php
└── composer.json
```

## API Endpoints

### Game State
- `GET /api/game/state` - Get current game state
- `POST /api/game/advance-time` - Advance game time (server-controlled)

### Dungeon Management
- `POST /api/dungeon/add-room` - Add room (validate mana cost)
- `POST /api/dungeon/place-monster` - Place monster (validate costs/limits)
- `POST /api/dungeon/toggle-status` - Open/close dungeon

### Resources
- `GET /api/resources` - Get current mana/gold/souls
- Server automatically manages resource generation

### Adventurers
- `GET /api/adventurers` - Get active parties
- Server automatically spawns and processes parties

## Security Measures

## Clean Architecture Implementation

### Domain Layer (Business Logic)
```php
// Domain Entity - Pure business logic, no database dependencies
class Game {
    private int $mana;
    private int $maxMana;
    
    public function spendMana(int $amount): bool {
        if ($this->mana < $amount) {
            return false;
        }
        $this->mana -= $amount;
        return true;
    }
}

// Repository Interface - Contract for data access
interface GameRepositoryInterface {
    public function findById(int $id): ?Game;
    public function save(Game $game): void;
    public function updateMana(int $gameId, int $mana): void;
}

// Use Case - Application logic
class PlaceMonsterUseCase {
    public function __construct(
        private GameRepositoryInterface $gameRepo,
        private DungeonRepositoryInterface $dungeonRepo
    ) {}
    
    public function execute(PlaceMonsterRequest $request): PlaceMonsterResponse {
        $game = $this->gameRepo->findById($request->gameId);
        
        // Business logic validation - NO PDO objects here
        if (!$game->spendMana($request->monsterCost)) {
            throw new InsufficientManaException();
        }
        
        // Save changes through repository interface
        $this->gameRepo->save($game);
        $this->dungeonRepo->addMonster($request->floorId, $request->monster);
        
        return new PlaceMonsterResponse(true);
    }
}
```

### Infrastructure Layer (Database Implementation)
```php
// MySQL Implementation - Can be swapped for any database
class MySQLGameRepository implements GameRepositoryInterface {
    private DatabaseConnection $connection;
    
    public function findById(int $id): ?Game {
        $stmt = $this->connection->prepare('SELECT * FROM players WHERE id = ?');
        $stmt->execute([$id]);
        $data = $stmt->fetch();
        
        // Convert database row to domain entity - NO PDO passed to domain
        return $data ? $this->mapToEntity($data) : null;
    }
    
    public function save(Game $game): void {
        // All database specifics hidden from business logic
        $stmt = $this->connection->prepare(
            'UPDATE players SET mana = ?, max_mana = ? WHERE id = ?'
        );
        $stmt->execute([$game->getMana(), $game->getMaxMana(), $game->getId()]);
    }
    
    private function mapToEntity(array $data): Game {
        return new Game($data['id'], $data['mana'], $data['max_mana']);
    }
}

// Future PostgreSQL implementation - same interface, different implementation
class PostgreSQLGameRepository implements GameRepositoryInterface {
    // Different database, same contract - easy to swap
}
```

### Anti-Cheat Features
- All calculations server-side
- Rate limiting on API calls
- Session-based authentication
- Input sanitization and validation

## Database Schema

### Tables
```sql
-- Players
CREATE TABLE players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE,
    mana INT DEFAULT 50,
    max_mana INT DEFAULT 100,
    gold INT DEFAULT 100,
    souls INT DEFAULT 0,
    day INT DEFAULT 1,
    hour INT DEFAULT 6,
    status ENUM('Open', 'Closing', 'Closed') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dungeons
CREATE TABLE dungeons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT,
    total_floors INT DEFAULT 1,
    deep_core_bonus DECIMAL(3,2) DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Floors
CREATE TABLE floors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dungeon_id INT,
    number INT,
    is_deepest BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(id)
);

-- Rooms
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    floor_id INT,
    type ENUM('entrance', 'normal', 'boss', 'core'),
    position INT,
    explored BOOLEAN DEFAULT FALSE,
    loot INT DEFAULT 0,
    FOREIGN KEY (floor_id) REFERENCES floors(id)
);

-- Monsters
CREATE TABLE monsters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT,
    type VARCHAR(100),
    hp INT,
    max_hp INT,
    alive BOOLEAN DEFAULT TRUE,
    is_boss BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Adventurer Parties
CREATE TABLE adventurer_parties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT,
    current_floor INT DEFAULT 1,
    current_room INT DEFAULT 0,
    retreating BOOLEAN DEFAULT FALSE,
    casualties INT DEFAULT 0,
    loot INT DEFAULT 0,
    entry_time INT,
    target_floor INT,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Adventurers
CREATE TABLE adventurers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    party_id INT,
    name VARCHAR(100),
    class_name VARCHAR(50),
    level INT,
    hp INT,
    max_hp INT,
    alive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (party_id) REFERENCES adventurer_parties(id)
);
```

## Implementation Phases

### Phase 1: Basic API Structure
1. Set up PHP project with Composer
2. Create basic routing system
3. Implement game state endpoints
4. Database connection and migrations

### Phase 2: Core Game Logic
1. Create domain entities and repository interfaces
2. Implement use cases for game actions
3. Build MySQL repository implementations
4. Add dependency injection container for database abstraction

### Phase 3: Combat System
1. Adventurer spawning logic
2. Combat calculations
3. Party progression through dungeon
4. Loot and experience distribution

### Phase 4: Real-time Updates
1. WebSocket or Server-Sent Events for live updates
2. Efficient state synchronization
3. Optimized database queries

## Frontend Changes

### Simplified Frontend Role
- Display game state received from API
- Send user actions to backend
- Handle real-time updates
- UI/UX only, no game logic

### API Integration
```typescript
// Replace Zustand store with API calls
class GameAPI {
    async getGameState() {
        return fetch('/api/game/state').then(r => r.json());
    }
    
    async placeMonster(floor: number, room: number, monster: string) {
        return fetch('/api/dungeon/place-monster', {
            method: 'POST',
            body: JSON.stringify({ floor, room, monster })
        }).then(r => r.json());
    }
}
```

## Database Abstraction Benefits

### Easy Database Migration
```php
// Dependency Injection Container - swap database with one line
$container->bind(GameRepositoryInterface::class, function() {
    // Current: MySQL
    return new MySQLGameRepository($connection);
    
    // Future: Just change this line
    // return new PostgreSQLGameRepository($connection);
    // return new MongoDBGameRepository($connection);
});
```

### No PDO Coupling
- **Domain entities** never see PDO objects
- **Use cases** work with interfaces only
- **Repositories** handle all database specifics
- **Easy testing** with mock repositories
- **Database independence** - business logic unchanged when switching databases

## Technology Stack

### Backend
- **PHP 8.1+** - Core language
- **Slim Framework** - Lightweight API framework
- **Custom Database Layer** - NO direct PDO usage in domain/application layers
- **MySQL** - Primary database (easily swappable)
- **Redis** - Session storage and caching

### Development Tools
- **Composer** - Dependency management
- **PHPUnit** - Testing
- **Docker** - Development environment

## Security Considerations

### Data Protection
- Never trust frontend data
- Validate all inputs server-side
- Use prepared statements for SQL
- Implement rate limiting

### Session Management
- Secure session handling
- CSRF protection
- Input sanitization
- SQL injection prevention

## Performance Optimization

### Caching Strategy
- Cache game constants in Redis
- Optimize database queries
- Use connection pooling
- Implement query result caching

### Scalability
- Stateless API design
- Database indexing
- Efficient data structures
- Background job processing for time advancement

## Testing Strategy

### Unit Tests
- Game logic validation
- Combat calculations
- Resource management
- Monster placement rules

### Integration Tests
- API endpoint testing
- Database operations
- Session handling
- Error scenarios

This backend will ensure game integrity while providing a responsive experience for players.