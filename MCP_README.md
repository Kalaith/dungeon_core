# Dungeon Core MCP Server

This is a Model Context Protocol (MCP) server for the Dungeon Core game that provides AI assistants with direct access to the game's database and file system.

## Features

The MCP server provides the following tools:

### Database Tools
- **query_database**: Execute raw SQL queries on the dungeon_core database
- **get_game_state**: Get complete game state for a session (player, floors, rooms, monsters)
- **get_monster_types**: Get all available monster types with traits
- **get_floors_and_rooms**: Get floors and rooms for a specific game
- **unlock_species**: Unlock a monster species for a player
- **get_schema_info**: Get database schema information

### File System Tools
- **read_backend_file**: Read files from the backend directory
- **read_frontend_file**: Read files from the frontend directory

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your database connection in the `mcp-server.js` file:
```javascript
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dungeon_core',
  charset: 'utf8mb4'
};
```

3. Start the MCP server:
```bash
npm start
```

## Usage with Claude Desktop

To use this MCP server with Claude Desktop, add the configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dungeon-core": {
      "command": "node",
      "args": ["mcp-server.js"],
      "cwd": "h:\\WebHatchery\\game_apps\\dungeon_core",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Example Tool Usage

### Query Database
```json
{
  "name": "query_database",
  "arguments": {
    "query": "SELECT * FROM monster_types WHERE species = ?",
    "params": ["Mimetic"]
  }
}
```

### Get Game State
```json
{
  "name": "get_game_state",
  "arguments": {
    "sessionId": "session123"
  }
}
```

### Unlock Species
```json
{
  "name": "unlock_species",
  "arguments": {
    "sessionId": "session123",
    "speciesName": "Amorphous"
  }
}
```

### Read Backend File
```json
{
  "name": "read_backend_file",
  "arguments": {
    "filePath": "src/Domain/Entities/Game.php"
  }
}
```

## Security Considerations

- The server only accepts file read requests within the backend and frontend directories
- Database queries are executed with the configured database user's permissions
- Session-based access control is implemented for game-specific operations

## Database Schema

The server expects the following main tables:
- `players`: Game session data with unlocked_species and species_experience JSON columns
- `monster_types`: Monster definitions with species, tier, and stats
- `monster_traits`: Available traits for monsters
- `monster_type_traits`: Many-to-many relationship between monsters and traits
- `floors`: Dungeon floors for each game
- `rooms`: Individual rooms within floors
- `monsters`: Monster instances placed in the dungeon

## Development

To run in development mode with auto-reload:
```bash
npm run dev
```

The server runs on stdio transport and communicates via JSON-RPC with MCP-compatible AI assistants.
