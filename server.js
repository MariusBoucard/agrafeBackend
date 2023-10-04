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
app.post('/api/registerAdmin' ,(req, res) => {
  const { username ,mail, password } = req.body;
  // Hash the password before saving it in the database
  const hashedPassword = bcrypt.hashSync(password, 10);
  const ret = userService.addAdminUser(
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

    const res = userService.deleteUser(id);
    return  res.status(res.code).json({ message: res.message });

  })
  

app.post('/api/modifyUser',userService.authenticateToken ,(req, res) => {
  const { user } = req.body;

  const res =userService.modifyUser(user);
  return  res.status(res.code).json({ message: res.message });
  // Implement your logic to fetch and send data here
});

/**
 * Refactored
 */
app.get('/api/getUser',userService.authenticateToken,async (req, res) => {
  const { id } = req.body;
  const result = await userService.getUser(id);
  if (result.user) {
    return res.status(res.code).json(result);
  } else {
    return res.status(res.code).json(result); 
  }
});

app.get('/api/getAllUser',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const res = await userService.getAllUser()
  return res.status(res.code).json(res.users);
});

app.delete('/api/deleteUser/:id',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const { id } = req.params;
  const res = await userService.deleteUser(id);
  return  res.status(res.code).json({ message: res.message });
})

// Articles PARTTTT


/**
 * Approche utilisant une bd sql
 */
app.post('/api/addArticle',userService.authenticateToken ,upload.none(), async (req, res) => {
  // Handle the FormData here
  const { article } = req.body;
 const res= await articleService.addArticle(article)
return res.status(res.code).json({message : res.message } )

 
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
    const res = await articleService.deleteArticle(id);
    return  res.status(res.code).json({ message: res.message });

  })
  

app.post('/api/modifyArticle',userService.authenticateToken , async (req, res) => {
  const { article } = req.body;
  const res = articleService.modifyArticle(article);
  return  res.status(res.code).json({ message: res.message });
  // Implement your logic to fetch and send data here
});

app.post('/api/privateArticle',userService.authenticateToken ,async (req, res) => {
  const { id } = req.body;
  const res = await articleService.publicArticle(id);
  return  res.status(res.code).json({ message: res.message });
  // Implement your logic to fetch and send data here
});

app.get('/api/getArticle',userService.authenticateToken,async (req, res) => {
    // Retrieve the 'id' parameter from the query string
    const id = req.query.id;
   const res =  await articleService.getArticle(id)
  return res.status(res.code).json(res.article);
  // Implement your logic to fetch and send data here
});

app.get('/api/getPublicArticle',async (req, res) => {
  const id = req.query.id;
  const res =  await articleService.getPublicArticle(id)
return res.status(res.code).json(res.articles);
// Implement your logic to fetch and send data here
});
app.get('/api/getAllArticles', userService.authenticateToken,async (req, res) => {
  // Implement your logic to fetch and send data here
  const res =  await articleService.getAllArticles()
  return res.status(res.code).json(res.articles);
});

app.get('/api/getAllPublicArticles', async (req, res) => {
  // Implement your logic to fetch and send data here
  const res = await articleService.getAllPublicArticles()
  return res.status(res.code).json(res.articles);
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
  const res = await archiveService.addArchive(archive)
return res.status(res.code).json({ id : res.archive.id, archive : res.archive})
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
    const res = await  archiveService.deleteArchive(id)
    return  res.status(res.code).json(res.message);

  })
  
app.post('/api/modifyArchive',userService.authenticateToken ,async (req, res) => {
  const { archive } = req.body;
  const res = await archiveService.modifyArchive(archive)
  return  res.status(res.code).json(res.message);
  // Implement your logic to fetch and send data here
});

app.get('/api/getArchive',userService.authenticateToken,async (req, res) => {
  const { id } = req.body;
  const res =  await archiveService.getArchive(id)
  return res.status(res.code).json(res.archive);
  // Implement your logic to fetch and send data here
});
app.get('/api/getArchivePublic',async (req, res) => {
  const { id } = req.body;
  const res =  await archiveService.getArchivePublic(id)
  return res.status(res.code).json(res.archive);
  // Implement your logic to fetch and send data here
});

app.get('/api/getAllArchives',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const res = await archiveService.getAllArchives()
  return res.status(res.code).json(res.archives);
});

app.get('/api/getPublicArchives',async (req, res) => {
  // Implement your logic to fetch and send data here
  const res = await archiveService.getPublicArchives()
  return res.status(res.code).json(res.archives);
});

app.post('/api/privateArchive',userService.authenticateToken ,async (req, res) => {
  const { id } = req.body;
  return res.status(200).json(await archiveService.privateArchive(id))
})

/// Lets go la suite
app.post('/api/addRubrique',userService.authenticateToken ,async (req,res) => {
  const { rubrique } = req.body;
  const res = await  rubriqueService.addARubrique(rubrique)
  return  res.status(res.code).json(res.message);
})

app.get('/api/getrubriques', async (req, res)=> {
  const res = await rubriqueService.getAllRubriques()
  return res.status(res.code).json(res.rubriques);
})

app.post('/api/modifyRubrique',userService.authenticateToken ,async (req, res) => {
  const { rubrique } = req.body;
  const res = await rubriqueService.modifyRubrique(rubrique)
  return  res.status(res.code).json(res.message);
  // Implement your logic to fetch and send data here
});


// Newsletter
app.post('/api/addNewsletter', async (req, res) => {
  const { user } = req.body;
  const res = await  newsletterService.addNewsletter(user)
  return  res.status(res.code).json({ id : res.newsletter.id, message : res.message});
})
app.get('/api/getNewsletter',userService.authenticateToken ,async (req,res) => {
  const res = await newsletterService.getAllNewsletter()
  return res.status(res.code).json(res.newsletter)
})
app.delete('/api/deleteNewsletter/:id', async (req, res) => {
  const { id } = req.params
  const res = await newsletterService.deleteNewsletter(id)
  return res.status(res.code).json(res.message)

})

// News

app.post('/api/addNews',userService.authenticateToken ,async (req, res) => {
  const { news } = req.body
  const res = await newsService.addNews(news)
  return res.status(res.code).json(res.news)
})

app.post('/api/uploadImageNews',userService.authenticateToken ,upload.single('imageLogo'), (req, res) => {
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
  const res = await newsService.getAllNews()
  return res.status(res.code).json(res.news)
})
app.get('/api/getPublicNews',async (req,res) => {
  const res = await newsService.getPublicNews()
  return res.status(res.code).json(res.news)
})


app.delete('/api/deleteNews/:id', userService.authenticateToken,async (req, res) => {
  const { id } = req.params
  const res = await newsService.deleteNews(id)
  return res.status(res.code).json(res.message)
})

app.post('/api/privateNews',userService.authenticateToken ,async (req,res) => {
  const { id } = req.body
  const res = await newsService.privateNews(id)
  return res.status(res.code).json(res.message)
})
