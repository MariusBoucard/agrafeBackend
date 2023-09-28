import express from 'express'
const app = express();
const port = process.env.PORT || 3000;
import connectToMySQL from './db.js'; // Import the database connection
import fs from 'fs'
// Define routes and middleware here

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    const dbConnection = await connectToMySQL();
    
    // You can pass the dbConnection to your routes/controllers as needed
    // For example, you can pass it to your User model if necessary.
    // const user = new User(dbConnection);

  } catch (err) {
    console.error('Error establishing MySQL connection:', err);
  }
});


// Function to read the JSON file
function readDataFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile('data.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
}


// Express route to handle a GET request to retrieve data
app.get('/api/getData', async (req, res) => {
  try {
    const data = await readDataFromFile();
    res.json(data);
  } catch (err) {
    console.error('Error reading data:', err);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});


app.get('/api/data', (req, res) => {
    // Implement your logic to fetch and send data here
  });
  

app.use(express.json());
/**
 * Approche utilisant une bd sql
 */
app.post('/api/addData', async (req, res) => {
  const { username, email,password } = req.body;
  console.log(username)
  console.log(req.body)
  //VERSION DB
  // try {
  //   const dbConnection = await connectToMySQL();

  //   const sql = 'INSERT INTO users (username, email,password) VALUES (?, ?,?)';
  //   const values = [username, email,password];

  //   const [result] = await dbConnection.query(sql, values);

  //   dbConnection.end(); // Close the connection when done

  //   console.log('User added successfully');
  //   return res.status(201).json({ message: 'User added successfully' });
  // } catch (err) {
  //   console.error('Error adding user:', err);
  //   return res.status(500).json({ error: 'Failed to add user' });
  // }
  // VERSION FILE 
  try {

  const rawData = fs.readFileSync('data.json');
  const data = JSON.parse(rawData);

// Access user data
const users = data.users;

const newUser = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
};

data.users.push(newUser);

// Write updated data back to the file
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
return res.status(201).json({message : 'My boiiiii to add user'})

  } catch {
    return res.status(500).json({error : 'Failed to add user'})
  }
});


app.post('/api/add', async (req,res) => {
  const fs = require('fs');

  const rawData = fs.readFileSync('data.json');
  const data = JSON.parse(rawData);

// Access user data
const users = data.users;

const newUser = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
};

data.users.push(newUser);

// Write updated data back to the file
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
})