#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dungeon_core',
  charset: 'utf8mb4'
};

class DungeonCoreMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'dungeon-core-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupRequestHandlers();
  }

  async getConnection() {
    try {
      const connection = await mysql.createConnection(DB_CONFIG);
      return connection;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'query_database',
            description: 'Execute a SQL query on the dungeon_core database',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL query to execute',
                },
                params: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Parameters for prepared statement (optional)',
                  default: [],
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_game_state',
            description: 'Get the current game state for a session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID to get game state for',
                },
              },
              required: ['sessionId'],
            },
          },
          {
            name: 'get_monster_types',
            description: 'Get all available monster types',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_floors_and_rooms',
            description: 'Get all floors and rooms for a game',
            inputSchema: {
              type: 'object',
              properties: {
                gameId: {
                  type: 'number',
                  description: 'Game ID to get floors and rooms for',
                },
              },
              required: ['gameId'],
            },
          },
          {
            name: 'unlock_species',
            description: 'Unlock a monster species for a player',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID of the player',
                },
                speciesName: {
                  type: 'string',
                  description: 'Name of the species to unlock',
                },
              },
              required: ['sessionId', 'speciesName'],
            },
          },
          {
            name: 'get_schema_info',
            description: 'Get database schema information',
            inputSchema: {
              type: 'object',
              properties: {
                tableName: {
                  type: 'string',
                  description: 'Specific table name (optional)',
                },
              },
            },
          },
          {
            name: 'read_backend_file',
            description: 'Read a file from the backend directory',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Relative path from backend directory',
                },
              },
              required: ['filePath'],
            },
          },
          {
            name: 'read_frontend_file',
            description: 'Read a file from the frontend directory',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Relative path from frontend directory',
                },
              },
              required: ['filePath'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'query_database':
            return await this.handleQueryDatabase(args);
          
          case 'get_game_state':
            return await this.handleGetGameState(args);
          
          case 'get_monster_types':
            return await this.handleGetMonsterTypes();
          
          case 'get_floors_and_rooms':
            return await this.handleGetFloorsAndRooms(args);
          
          case 'unlock_species':
            return await this.handleUnlockSpecies(args);
          
          case 'get_schema_info':
            return await this.handleGetSchemaInfo(args);
          
          case 'read_backend_file':
            return await this.handleReadBackendFile(args);
          
          case 'read_frontend_file':
            return await this.handleReadFrontendFile(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async handleQueryDatabase(args) {
    const { query, params = [] } = args;
    const connection = await this.getConnection();
    
    try {
      const [results] = await connection.execute(query, params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } finally {
      await connection.end();
    }
  }

  async handleGetGameState(args) {
    const { sessionId } = args;
    const connection = await this.getConnection();
    
    try {
      const [players] = await connection.execute(
        'SELECT * FROM players WHERE session_id = ?',
        [sessionId]
      );
      
      if (players.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No game found for this session ID',
            },
          ],
        };
      }

      const player = players[0];
      
      // Get floors and rooms
      const [floors] = await connection.execute(
        'SELECT * FROM floors WHERE game_id = ? ORDER BY number',
        [player.id]
      );
      
      const [rooms] = await connection.execute(
        'SELECT * FROM rooms WHERE game_id = ? ORDER BY floor_number, position',
        [player.id]
      );
      
      // Get monsters
      const [monsters] = await connection.execute(
        'SELECT * FROM monsters WHERE game_id = ?',
        [player.id]
      );

      const gameState = {
        player,
        floors,
        rooms,
        monsters,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(gameState, null, 2),
          },
        ],
      };
    } finally {
      await connection.end();
    }
  }

  async handleGetMonsterTypes() {
    const connection = await this.getConnection();
    
    try {
      const [monsterTypes] = await connection.execute(`
        SELECT mt.*, 
               GROUP_CONCAT(mtr.name) as traits
        FROM monster_types mt
        LEFT JOIN monster_type_traits mtt ON mt.id = mtt.monster_type_id
        LEFT JOIN monster_traits mtr ON mtt.trait_id = mtr.id
        GROUP BY mt.id
        ORDER BY mt.species, mt.tier
      `);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(monsterTypes, null, 2),
          },
        ],
      };
    } finally {
      await connection.end();
    }
  }

  async handleGetFloorsAndRooms(args) {
    const { gameId } = args;
    const connection = await this.getConnection();
    
    try {
      const [floors] = await connection.execute(
        'SELECT * FROM floors WHERE game_id = ? ORDER BY number',
        [gameId]
      );
      
      const [rooms] = await connection.execute(
        'SELECT * FROM rooms WHERE game_id = ? ORDER BY floor_number, position',
        [gameId]
      );
      
      // Group rooms by floor
      const floorsWithRooms = floors.map(floor => ({
        ...floor,
        rooms: rooms.filter(room => room.floor_number === floor.number)
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(floorsWithRooms, null, 2),
          },
        ],
      };
    } finally {
      await connection.end();
    }
  }

  async handleUnlockSpecies(args) {
    const { sessionId, speciesName } = args;
    const connection = await this.getConnection();
    
    try {
      // Get player
      const [players] = await connection.execute(
        'SELECT * FROM players WHERE session_id = ?',
        [sessionId]
      );
      
      if (players.length === 0) {
        throw new Error('Player not found');
      }

      const player = players[0];
      let unlockedSpecies = [];
      
      // Parse existing unlocked species
      if (player.unlocked_species) {
        try {
          unlockedSpecies = JSON.parse(player.unlocked_species);
        } catch (e) {
          unlockedSpecies = [];
        }
      }
      
      // Add species if not already unlocked
      if (!unlockedSpecies.includes(speciesName)) {
        unlockedSpecies.push(speciesName);
        
        // Update database
        await connection.execute(
          'UPDATE players SET unlocked_species = ? WHERE id = ?',
          [JSON.stringify(unlockedSpecies), player.id]
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Successfully unlocked species: ${speciesName}`,
          },
        ],
      };
    } finally {
      await connection.end();
    }
  }

  async handleGetSchemaInfo(args) {
    const { tableName } = args;
    const connection = await this.getConnection();
    
    try {
      let query = "SHOW TABLES";
      let params = [];
      
      if (tableName) {
        query = "DESCRIBE ??";
        params = [tableName];
      }
      
      const [results] = await connection.execute(query, params);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } finally {
      await connection.end();
    }
  }

  async handleReadBackendFile(args) {
    const { filePath } = args;
    const backendDir = path.join(process.cwd(), 'backend');
    const fullPath = path.join(backendDir, filePath);
    
    // Security check - ensure file is within backend directory
    if (!fullPath.startsWith(backendDir)) {
      throw new Error('Access denied: File must be within backend directory');
    }
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async handleReadFrontendFile(args) {
    const { filePath } = args;
    const frontendDir = path.join(process.cwd(), 'frontend');
    const fullPath = path.join(frontendDir, filePath);
    
    // Security check - ensure file is within frontend directory
    if (!fullPath.startsWith(frontendDir)) {
      throw new Error('Access denied: File must be within frontend directory');
    }
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  setupRequestHandlers() {
    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Dungeon Core MCP server running on stdio');
  }
}

// Start the server
const server = new DungeonCoreMCPServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
