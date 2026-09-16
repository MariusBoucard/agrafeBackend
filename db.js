import mysql from 'mysql2/promise'; // Import the MySQL2 promise-based library

// MySQL connection configuration
const mysqlConfig = {
  host: 'localhost',
  user: 'agrafe',
  password: 'Metallica1234',
  database: 'agrafe',
};

// Function to establish a MySQL connection
async function connectToMySQL() {
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    console.log('Connected to MySQL');
    return connection;
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
    throw err;
  }
}

export default connectToMySQL;