import express from 'express'
const app = express();
const port = process.env.PORT || 3000;
import connectToMySQL from './db.js'; // Import the database connection
import fs from 'fs'
import userService from './dbServices/userService.js';
import articleService from './dbServices/articlesService.js'
import archiveService from './dbServices/archiveService.js';
app.use(express.json());
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


app.post('/api/deleteUser', (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.body;

    userService.deleteUser(id);
    return  res.status(200).json({ message: 'C delete' });

  })
  

app.post('/api/modifyUser', (req, res) => {
  const { user } = req.body;

  userService.modifyUser(user);
  return  res.status(200).json({ message: 'C delete' });
  // Implement your logic to fetch and send data here
});

app.get('/api/getUser',async (req, res) => {
  const { id } = req.body;
  console.log(id)
  console.log("caca")
  return res.status(200).json( await userService.getUser(id));
  // Implement your logic to fetch and send data here
});

app.get('/api/getAllUser', async (req, res) => {
  // Implement your logic to fetch and send data here
  return res.status(200).json( await userService.getAllUser());
});

/**
 * Approche utilisant une bd sql
 */
app.post('/api/addUser', async (req, res) => {
  const { name, mail,password } = req.body;
  await userService.addUser({
    name : name,
    mail : mail,
    password : password
  })
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

  
return res.status(201).json({message : 'My boiiiii to add user'})

 
});



// Articles PARTTTT


/**
 * Approche utilisant une bd sql
 */
app.post('/api/addArticle', async (req, res) => {
  const { article } = req.body;
  
return res.status(201).json( await articleService.addArticle(article))

 
});

app.post('/api/deleteArticle', (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.body;

    articleService.deleteArticle(id);
    return  res.status(200).json({ message: 'C delete' });

  })
  

app.post('/api/modifyArticle', (req, res) => {
  const { article } = req.body;

  articleService.modifyArticle(article);
  return  res.status(200).json({ message: 'C modif' });
  // Implement your logic to fetch and send data here
});

app.get('/api/getArticle',async (req, res) => {
  const { id } = req.body;
  console.log(id)
  console.log("caca")
  return res.status(200).json( await articleService.getArticle(id));
  // Implement your logic to fetch and send data here
});

app.get('/api/getAllArticles', async (req, res) => {
  // Implement your logic to fetch and send data here
  return res.status(200).json( await articleService.getAllArticles());
});

/// Lets go la suite


// ARCHIVE PART 
// Articles PARTTTT


/**
 * Approche utilisant une bd sql
 */
app.post('/api/addArchive', async (req, res) => {
  const { archive } = req.body;
  
return res.status(201).json( await archiveService.addArchive(archive))

 
});

app.post('/api/deleteArchive', async (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.body;

   
    return  res.status(200).json(await  archiveService.deleteArchive(id));

  })
  

app.post('/api/modifyArchive', async (req, res) => {
  const { archive } = req.body;

 
  return  res.status(200).json(await archiveService.modifyArchive(archive));
  // Implement your logic to fetch and send data here
});

app.get('/api/getArchive',async (req, res) => {
  const { id } = req.body;
  console.log(id)
  console.log("caca")
  return res.status(200).json( await archiveService.getArchive(id));
  // Implement your logic to fetch and send data here
});

app.get('/api/getAllArchives', async (req, res) => {
  // Implement your logic to fetch and send data here
  return res.status(200).json( await archiveService.getAllArchives());
});

/// Lets go la suite
