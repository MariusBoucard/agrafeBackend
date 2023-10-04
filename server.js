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
import newsletterService from './dbServices/newsletterService.js';
import newsService from './dbServices/newsService.js';
import lectureService from './dbServices/lectureService.js';
app.use('/save', express.static('save'));
const upload = multer();

const millisecondsInADay = 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
const interval = setInterval(lectureService.updateLectures, millisecondsInADay);



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




// User registration
app.post('/api/register', userService.authenticateToken,(req, res) => {
  const { username ,mail, password } = req.body;
  // Hash the password before saving it in the database
  const hashedPassword = bcrypt.hashSync(password, 10);
  const ret = userService.addUser(
    {
      name : username,
      mail : mail,
      password : hashedPassword
    }
  )
  return res.status(ret.code).json({ message: ret.message });
});
// User registration
app.post('/api/registerAdmin' ,async (req, res) => {
  const { username ,mail, password } = req.body;
  // Hash the password before saving it in the database
  const hashedPassword = bcrypt.hashSync(password, 10);
  const ret = await userService.addAdminUser(
    {
      name : username,
      mail : mail,
      password : hashedPassword
    }
  )
  return res.status(ret.code).json({ message: ret.message });
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password, mail } = req.body;
 const id = await userService.doUserExists({
    name : username,
    mail: mail,
    password : password
  })
  if(id !== false){
    const token = userService.generateToken(id)
    res.status(200).json({ token : token, connected : true });
  }
  res.status(401)
});

// Protected route
app.get('/protected', userService.authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route' });
});




app.post('/api/deleteUser', userService.authenticateToken, (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.body;

    const resu = userService.deleteUser(id);
    return  res.status(resu.code).json({ message: resu.message });

  })
  

app.post('/api/modifyUser',userService.authenticateToken ,(req, res) => {
  const { user } = req.body;

  const resu =userService.modifyUser(user);
  return  res.status(resu.code).json({ message: resu.message });
  // Implement your logic to fetch and send data here
});

/**
 * Refactored
 */
app.get('/api/getUser',userService.authenticateToken,async (req, res) => {
  const { id } = req.body;
  const result = await userService.getUser(id);
  if (result.user) {
    return res.status(result.code).json(result);
  } else {
    return res.status(result.code).json(result); 
  }
});

app.get('/api/getAllUser',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await userService.getAllUser()
  return res.status(resu.code).json(resu.users);
});

app.delete('/api/deleteUser/:id',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const { id } = req.params;
  const resu = await userService.deleteUser(id);
  return  res.status(resu.code).json({ message: resu.message });
})

// Articles PARTTTT


/**
 * Approche utilisant une bd sql
 */
app.post('/api/addArticle',userService.authenticateToken ,upload.none(), async (req, res) => {
  // Handle the FormData here
  const { article } = req.body;
 const resu= await articleService.addArticle(article)
return res.status(resu.code).json(resu.article.id)

 
});

// Handle the image upload separately
app.post('/api/uploadImage',userService.authenticateToken ,upload.single('imageLogo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file received.' });
  }
  const infoString = req.body.articleId; // Access the string data
  // You can now access the uploaded image in req.file.buffer
  // Process and save the image as needed
  const imageBuffer = req.file.buffer; // Access the uploaded image buffer
  // Generate a unique filename (e.g., using a timestamp)
  const timestamp = Date.now();
  const filename = infoString+".png";
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
app.post('/api/uploadPdfArticle',userService.authenticateToken ,upload.single('articlePdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No pdf file received.' });
  }
  const infoString = req.body.articleId; // Access the string data
  const imageBuffer = req.file.buffer; // Access the uploaded image buffer
  const filename = infoString+".pdf";
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

app.delete('/api/deleteArticle/:id',userService.authenticateToken , async (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.params;
    const resu = await articleService.deleteArticle(id);
    return  res.status(resu.code).json({ message: resu.message });

  })
  

app.post('/api/modifyArticle',userService.authenticateToken , async (req, res) => {
  const { article } = req.body;
  const resu = await articleService.modifyArticle(article);
  return  res.status(resu.code).json({ message: resu.message });
  // Implement your logic to fetch and send data here
});

app.post('/api/privateArticle',userService.authenticateToken ,async (req, res) => {
  const { id } = req.body;
  const resu = await articleService.publicArticle(id);
  return  res.status(resu.code).json({ message: resu.message });
  // Implement your logic to fetch and send data here
});

app.get('/api/getArticle',userService.authenticateToken,async (req, res) => {
    // Retrieve the 'id' parameter from the query string
    const id = req.query.id;
   const resu =  await articleService.getArticle(id)
  return res.status(resu.code).json(resu.article);
  // Implement your logic to fetch and send data here
});

app.get('/api/getPublicArticle',async (req, res) => {
  const id = req.query.id;
  const resu =  await articleService.getPublicArticle(id)
return res.status(resu.code).json(resu.article);
// Implement your logic to fetch and send data here
});
app.get('/api/getAllArticles', userService.authenticateToken,async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu =  await articleService.getAllArticles()
  return res.status(resu.code).json(resu.articles);
});

app.get('/api/getAllPublicArticles', async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await articleService.getAllPublicArticles()
  return res.status(resu.code).json(resu.articles);
});

app.post('/api/addLecture', async (req, res) => {
  const { id } = req.body;
  return res.status(200).json( await articleService.addLectureArticle(id))
})

app.get('/api/getLectures',userService.authenticateToken ,async (req, res) => {
  return res.status(200).json( await lectureService.getLectures())
})
/// Lets go la suite


// ARCHIVE PART 
// Articles PARTTTT

app.post('/api/addLectureArchive', async (req, res) => {
  const { id } = req.body;
  return res.status(200).json( await archiveService.addLecture(id))
})

/**
 * Approche utilisant une bd sql
 */
app.post('/api/addArchive',userService.authenticateToken ,async (req, res) => {
  const { archive } = req.body;
  const resu = await archiveService.addArchive(archive)
return res.status(resu.code).json(resu.archive.id)
});


// Handle the image upload separately
app.post('/api/uploadPdfArchive',userService.authenticateToken ,upload.single('archivePdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No pdf file received.' });
  }
  const infoString = req.body.archiveId; // Access the string data
  const imageBuffer = req.file.buffer; // Access the uploaded image buffer
  const filename = infoString+".pdf";
  const pdfPath = path.join(path.resolve(), 'save', 'saveArchive', 'pdf', filename);
  // Use the fs module to write the image buffer to the file
  fs.writeFileSync(pdfPath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }
    // At this point, the image has been successfully saved to the server
  });
  archiveService.extractPdf(infoString)
  return res.status(200).json({ message: 'pdf uploaded successfully.' });
});

app.delete('/api/deleteArchive/:id',userService.authenticateToken ,async (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.params;
    const resu = await  archiveService.deleteArchive(id)
    return  res.status(resu.code).json(resu.message);

  })
  
app.post('/api/modifyArchive',userService.authenticateToken ,async (req, res) => {
  const { archive } = req.body;
  const resu = await archiveService.modifyArchive(archive)
  return  res.status(resu.code).json(resu.message);
  // Implement your logic to fetch and send data here
});

app.get('/api/getArchive',userService.authenticateToken,async (req, res) => {
  const { id } = req.body;
  const resu =  await archiveService.getArchive(id)
  return res.status(resu.code).json(resu.archive);
  // Implement your logic to fetch and send data here
});
app.get('/api/getArchivePublic',async (req, res) => {
  const { id } = req.body;
  const resu =  await archiveService.getArchivePublic(id)
  return res.status(resu.code).json(resu.archive);
  // Implement your logic to fetch and send data here
});

app.get('/api/getAllArchives',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await archiveService.getAllArchives()
  return res.status(resu.code).json(resu.archives);
});

app.get('/api/getPublicArchives',async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await archiveService.getPublicArchives()
  return res.status(resu.code).json(resu.archives);
});

app.post('/api/privateArchive',userService.authenticateToken ,async (req, res) => {
  const { id } = req.body;
  return res.status(200).json(await archiveService.privateArchive(id))
})

/// Lets go la suite
app.post('/api/addRubrique',userService.authenticateToken ,async (req,res) => {
  const { rubrique } = req.body;
  const resu = await  rubriqueService.addARubrique(rubrique)
  return  res.status(resu.code).json(resu.message);
})

app.get('/api/getrubriques', async (req, res)=> {
  const resu = await rubriqueService.getAllRubriques()
  return res.status(resu.code).json(resu.rubriques);
})

app.post('/api/modifyRubrique',userService.authenticateToken ,async (req, res) => {
  const { rubrique } = req.body;
  const resu = await rubriqueService.modifyRubrique(rubrique)
  return  res.status(resu.code).json(resu.message);
  // Implement your logic to fetch and send data here
});


// Newsletter
app.post('/api/addNewsletter', async (req, res) => {
  const { user } = req.body;
  const resu = await  newsletterService.addNewsletter(user)
  return  res.status(resu.code).json({ id : resu.newsletter.id, message : resu.message});
})
app.get('/api/getNewsletter',userService.authenticateToken ,async (req,res) => {
  const resu = await newsletterService.getAllNewsletter()
  return res.status(resu.code).json(resu.newsletter)
})
app.delete('/api/deleteNewsletter/:id', async (req, res) => {
  const { id } = req.params
  const resu = await newsletterService.deleteNewsletter(id)
  return res.status(resu.code).json(resu.message)

})

// News

app.post('/api/addNews',userService.authenticateToken ,async (req, res) => {
  const { news } = req.body
  const resu = await newsService.addNews(news)
  return res.status(resu.code).json(resu.news.id)
})

app.post('/api/uploadImageNews',userService.authenticateToken ,upload.single('imageLogo'), (req, res) => {
  console.log("upload image")
  if (!req.file) {
    return res.status(400).json({ message: 'No image file received.' });
  }
  const infoString = req.body.newsId; // Access the string data
  const imageBuffer = req.file.buffer; 
  const filename = infoString+".png";
  const imagePath = path.join(path.resolve(), 'save', 'newsImage', filename);
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }
  });

  return res.status(200).json({ message: 'Image uploaded successfully.' });
});

app.get('/api/getAllNews',userService.authenticateToken ,async (req,res) => {
  const resu = await newsService.getAllNews()
  return res.status(resu.code).json(resu.news)
})
app.get('/api/getPublicNews',async (req,res) => {
  const resu = await newsService.getPublicNews()
  return res.status(resu.code).json(resu.news)
})


app.delete('/api/deleteNews/:id', userService.authenticateToken,async (req, res) => {
  const { id } = req.params
  const resu = await newsService.deleteNews(id)
  return res.status(resu.code).json(resu.message)
})

app.post('/api/privateNews',userService.authenticateToken ,async (req,res) => {
  const { id } = req.body
  const resu = await newsService.privateNews(id)
  return res.status(resu.code).json(resu.message)
})
