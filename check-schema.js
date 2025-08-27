import mysql from 'mysql2/promise';

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dungeon_core',
  charset: 'utf8mb4'
};

async function checkSchema() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Get all tables
    console.log('\n=== Available Tables ===');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(tables);
    
    // Check players table structure
    console.log('\n=== Players Table Structure ===');
    const [playersSchema] = await connection.execute('DESCRIBE players');
    console.log(playersSchema);
    
    // Check if required columns exist
    const columnNames = playersSchema.map(col => col.Field);
    console.log('\n=== Column Analysis ===');
    console.log('Available columns:', columnNames);
    console.log('Has unlocked_species:', columnNames.includes('unlocked_species'));
    console.log('Has species_experience:', columnNames.includes('species_experience'));
    
    // Check other important tables
    const importantTables = ['monster_types', 'monster_traits', 'floors', 'rooms', 'monsters'];
    
    for (const tableName of importantTables) {
      if (tables.some(t => Object.values(t)[0] === tableName)) {
        console.log(`\n=== ${tableName} Table Structure ===`);
        const [schema] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log(schema);
      } else {
        console.log(`\n=== ${tableName} Table ===`);
        console.log('Table does not exist!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSchema();
