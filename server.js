import express from 'express'
const app = express();
import cors from 'cors';
const port = process.env.PORT || 3000;
import connectToMySQL from './db.js'; // Import the database connection
import fs from 'fs'
import path from 'path'
import userService from './dbServices/userService.js';
import articleService from './dbServices/articlesService.js'
import archiveService from './dbServices/archiveService.js';
import multer from 'multer'
import bcrypt from 'bcrypt'
import rubriqueService from './dbServices/rubriqueService.js';
app.use('/save', express.static('save'));
const upload = multer();

app.use(express.json());
// Allow requests from your frontend URL (replace with your actual frontend URL)
const allowedOrigins = ['http://localhost:8080'];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));


app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    // const dbConnection = await connectToMySQL();
    
    // You can pass the dbConnection to your routes/controllers as needed
    // For example, you can pass it to your User model if necessary.
    // const user = new User(dbConnection);

  } catch (err) {
    console.error('Error establishing MySQL connection:', err);
  }
});

app.get('api/ser')



// User registration
app.post('/api/register', (req, res) => {
  const { username ,mail, password } = req.body;
  // Hash the password before saving it in the database
  const hashedPassword = bcrypt.hashSync(password, 10);
  userService.addUser(
    {
      name : username,
      mail : mail,
      password : hashedPassword
    }
  )
  return res.status(200).json({ message: 'User registered successfully' });
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
 const id = userService.doUserExists({
    name : username,
    password : password
  })
  if(id !== false){
    const token = userService.generateToken(id)
    res.json({ token : token, connected : true });
  }

});

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

// Middleware to authenticate tokens
function authenticateToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token is not valid' });
    req.user = user;
    next();
  });
}


app.post('/api/login', async (req,res) => {
  console.log("c passé")
  return res.status(200).json({ message : "request received"})
})


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
app.post('/api/addArticle', upload.none(), async (req, res) => {
  // Handle the FormData here
  const { article } = req.body;
  console.log(article, 'article');

  
return res.status(201).json( await articleService.addArticle(article))

 
});

// Handle the image upload separately
app.post('/api/uploadImage', upload.single('imageLogo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file received.' });
  }
  console.log("articleId",req.body)
  const infoString = req.body.articleId; // Access the string data
  // You can now access the uploaded image in req.file.buffer
  // Process and save the image as needed

  const imageBuffer = req.file.buffer; // Access the uploaded image buffer

  // Generate a unique filename (e.g., using a timestamp)
  const timestamp = Date.now();
  const filename = infoString+".png";
  console.log(filename)
  // Define the path to save the image file on your server
  const imagePath = path.join(path.resolve(), 'save', 'saveArticle', 'cover', filename);
  // Use the fs module to write the image buffer to the file
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }

    // At this point, the image has been successfully saved to the server
  });
  



  return res.status(200).json({ message: 'Image uploaded successfully.' });
});


// Handle the image upload separately
app.post('/api/uploadPdfArticle', upload.single('articlePdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No pdf file received.' });
  }
  console.log("articleId",req.body)
  const infoString = req.body.articleId; // Access the string data

  const imageBuffer = req.file.buffer; // Access the uploaded image buffer

  const filename = infoString+".pdf";
  console.log(filename)
  // Define the path to save the image file on your server
  const imagePath = path.join(path.resolve(), 'save', 'saveArticle', 'pdf', filename);
  // Use the fs module to write the image buffer to the file
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }

    // At this point, the image has been successfully saved to the server
  });
  
  return res.status(200).json({ message: 'pdf uploaded successfully.' });
});



app.delete('/api/deleteArticle/:id', (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.params;
    console.log(id)
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
app.post('/api/addRubrique', async (req,res) => {
  const { rubrique } = req.body;

   
  return  res.status(200).json(await  rubriqueService.addARubrique(rubrique));

})

app.get('/api/getrubriques', async (req, res)=> {
  console.log('tataa')
  return res.status(200).json( await rubriqueService.getAllRubriques());

})