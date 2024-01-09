import express from 'express'
const app = express();
import cors from 'cors';
const port = process.env.PORT || 3000;
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
import focaleService from './dbServices/focaleService.js';
import axios from 'axios'
import querystring from 'querystring'
/**
 * Here's the server class, where all the server is defined and all the routes because I haven't did several files
 */
const upload = multer();
const millisecondsInADay = 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
const interval = setInterval(lectureService.updateLectures, millisecondsInADay);
app.use(express.json());
const allowedOrigins = ['http://localhost:8080','http://127.0.0.1:8080'];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
    
  },
  // credentials: true, // This is important.
  
};
app.use('/save',cors(corsOptions), express.static('save'));

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




// Begining of routes :
//=================================================================================================
/*
* Admin user registration
*/
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
/*
* Admin user registration
*/
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

/*
admin login
*/
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

/**
 * Admin delete user
 */
app.post('/api/deleteUser', userService.authenticateToken, (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.body;

    const resu = userService.deleteUser(id);
    return  res.status(resu.code).json({ message: resu.message });

  })
  
/**
 * Admin modify user
 */
app.post('/api/modifyUser',userService.authenticateToken ,(req, res) => {
  const { user } = req.body;

  const resu =userService.modifyUser(user);
  return  res.status(resu.code).json({ message: resu.message });
  // Implement your logic to fetch and send data here
});

/**
 * Admin get user
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

/**
 * Admin get all user
 */
app.get('/api/getAllUser',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await userService.getAllUser()
  return res.status(resu.code).json(resu.users);
});

/**
 * Admin delete user
 */
app.delete('/api/deleteUser/:id',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const { id } = req.params;
  const resu = await userService.deleteUser(id);
  return  res.status(resu.code).json({ message: resu.message });
})

// Articles PARTTTT


/**
 * Admin add article
 */
app.post('/api/addArticle',userService.authenticateToken ,upload.none(), async (req, res) => {
  // Handle the FormData here
  const { article } = req.body;
 const resu= await articleService.addArticle(article)
return res.status(resu.code).json(resu.article.id)

 
});

/* Admin upload image article
*/
app.post('/api/uploadImage',userService.authenticateToken ,upload.single('imageLogo'), (req, res) => {
  if (!req.file) {
    return res.status(200).json({ message: 'No image file received.' });
  }
  const infoString = req.body.articleId; // Access the string data
  const imageBuffer = req.file.buffer; // Access the uploaded image buffer
  const filename = infoString+".png";
  const imagePath = path.join(path.resolve(), 'save', 'saveArticle', 'cover', filename);
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }
  });
  return res.status(200).json({ message: 'Image uploaded successfully.' });
});


/**
 * Admin api upload image article
 */
app.post('/api/uploadArticleImages',userService.authenticateToken, upload.array('images'), (req, res) => {
  const uploadedFiles = req.files;
  const ids = req.body;
  const generalId = ids['generalId']
  console.log(generalId)
  const directoryPath = path.join(path.resolve(), 'save', 'saveArticle','images', generalId );

  fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
    } else {
      console.log('Directory created successfully');
    }
  });

  for (let i = 0; i < uploadedFiles.length; i++) {
    const imageBuffer = uploadedFiles[i].buffer;
    const imgId = ids[`id${i}`];
    const filename = imgId+".png";
    const imagePath = path.join(path.resolve(), 'save', 'saveArticle','images', generalId , filename);
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }})
  }
  console.log(uploadedFiles)
  console.log(ids)
  res.status(200).json({ message: 'Images uploaded successfully' });
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
/**
 * Admin delete article
 */
app.delete('/api/deleteArticle/:id',userService.authenticateToken , async (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.params;
    const resu = await articleService.deleteArticle(id);
    return  res.status(resu.code).json({ message: resu.message });

  })
  
/**
 * Admin modify article
 */
app.post('/api/modifyArticle',userService.authenticateToken , async (req, res) => {
  const { article } = req.body;
  const resu = await articleService.modifyArticle(article);
  return  res.status(resu.code).json({ message: resu.message });
  // Implement your logic to fetch and send data here
});
/**
 * Admin private article
 */
app.post('/api/privateArticle',userService.authenticateToken ,async (req, res) => {
  const { id } = req.body;
  const resu = await articleService.publicArticle(id);
  return  res.status(resu.code).json({ message: resu.message });
  // Implement your logic to fetch and send data here
});
/**
 * Admin get article
 */
app.get('/api/getArticle',userService.authenticateToken,async (req, res) => {
    // Retrieve the 'id' parameter from the query string
    const id = req.query.id;
   const resu =  await articleService.getArticle(id)
  return res.status(resu.code).json(resu.article);
  // Implement your logic to fetch and send data here
});

/**
 * Public get article
 */
app.get('/api/getPublicArticle/:caca', async (req, res) => {
  console.log('triggered');
  const { caca } = req.params;
  console.log(caca);
  const resu = await articleService.getPublicArticle(caca);
  return res.status(resu.code).json(resu.article);
  // Implement your logic to fetch and send data here
});


app.get('/api/getrecentarticle',async (req, res) => {
  const resu =  await articleService.getRecentArticles()
  console.log(resu)

return res.status(resu.code).json(resu.article);
// Implement your logic to fetch and send data here
});


app.get('/api/getrecentarticle',async (req, res) => {
  const resu =  await articleService.getRecentArticles()
  console.log(resu)

return res.status(resu.code).json(resu.article);
// Implement your logic to fetch and send data here
});
/**
 * Admin get all article
 */
app.get('/api/getAllArticles', userService.authenticateToken,async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu =  await articleService.getAllArticles()
  return res.status(resu.code).json(resu.articles);
});
/**
 * Public get all article
 */
app.get('/api/getAllPublicArticles', async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await articleService.getAllPublicArticles()
  return res.status(resu.code).json(resu.articles);
});
/**
 * Public add lecture article
 */
app.post('/api/addLecture', async (req, res) => {
  const { id } = req.body;
  return res.status(200).json( await articleService.addLectureArticle(id))
})
/**
 * admin get lectures article
 */
app.get('/api/getLectures',userService.authenticateToken ,async (req, res) => {
  return res.status(200).json( await lectureService.getLectures())
})
/// Lets go la suite


// ARCHIVE PART 
// Articles PARTTTT
/**
 * Public add lecture aarchive
 */
app.post('/api/addLectureArchive', async (req, res) => {
  const { id } = req.body;
  return res.status(200).json( await archiveService.addLecture(id))
})

/**
 * Approche utilisant une bd sql
 */
/**
 * Admin add archive
 */
app.post('/api/addArchive',userService.authenticateToken ,async (req, res) => {
  const { archive } = req.body;
  const resu = await archiveService.addArchive(archive)
return res.status(resu.code).json(resu.archive.id)
});

/**
 * Admin upload pdf archive
 */
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
/**
 * Admin delete archive
 */
app.delete('/api/deleteArchive/:id',userService.authenticateToken ,async (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.params;
    const resu = await  archiveService.deleteArchive(id)
    return  res.status(resu.code).json(resu.message);

  })
  
/**
 * Admin modify archive
 */
app.post('/api/modifyArchive',userService.authenticateToken ,async (req, res) => {
  const { archive } = req.body;
  const resu = await archiveService.modifyArchive(archive)
  return  res.status(resu.code).json(resu.message);
  // Implement your logic to fetch and send data here
});

/**
 * Public add archive
 */
app.get('/api/getArchive',userService.authenticateToken,async (req, res) => {
  const { id } = req.body;
  const resu =  await archiveService.getArchive(id)
  return res.status(resu.code).json(resu.archive);
  // Implement your logic to fetch and send data here
});

app.get('/api/lastArchive',async (req, res) => {
  const resu =  await archiveService.getLastArchive()
  return res.status(resu.code).json(resu.archive);
  // Implement your logic to fetch and send data here
});
/**
 * Public get archive
 */
app.get('/api/getArchivePublic/:id',async (req, res) => {
  const { id } = req.params;
  const resu =  await archiveService.getArchivePublic(id)
  return res.status(resu.code).json(resu.archive);
  // Implement your logic to fetch and send data here
});
/**
 * Admin getall archive
 */
app.get('/api/getAllArchives',userService.authenticateToken ,async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await archiveService.getAllArchives()
  return res.status(resu.code).json(resu.archives);
});
/**
 * Public get all archive
 */
app.get('/api/getPublicArchives',async (req, res) => {
  // Implement your logic to fetch and send data here
  const resu = await archiveService.getPublicArchives()
  return res.status(resu.code).json(resu.archives);
});

/**
 * Admin private archive
 */
app.post('/api/privateArchive',userService.authenticateToken ,async (req, res) => {
  const { id } = req.body;
  return res.status(200).json(await archiveService.privateArchive(id))
})

app.get('/api/lastArchive',async (req,res) => {
  const resu = await archiveService.getLastArchive()
  console.log(resu)
  return res.status(resu.code).json(resu.archive);
}
)
/**
 * Admin add rubriuqe
 */
/// Lets go la suite
app.post('/api/addRubrique',userService.authenticateToken ,async (req,res) => {
  const { rubrique } = req.body;
  const resu = await  rubriqueService.addARubrique(rubrique)
  return  res.status(resu.code).json(resu.message);
})
/**
 * Public get rubriuqe
 */
app.get('/api/getrubriques', async (req, res)=> {
  const resu = await rubriqueService.getAllRubriques()
  return res.status(resu.code).json(resu.rubriques);
})
/**
 * Public modify rubrique
 */
app.post('/api/modifyRubrique',userService.authenticateToken ,async (req, res) => {
  const { rubrique } = req.body;
  const resu = await rubriqueService.modifyRubrique(rubrique)
  return  res.status(resu.code).json(resu.message);
  // Implement your logic to fetch and send data here
});

/**
 * public add newsletter
 */
// Newsletter
app.post('/api/addNewsletter', async (req, res) => {
  const { user } = req.body;
  const resu = await  newsletterService.addNewsletter(user)
  return  res.status(resu.code).json({ id : resu.newsletter.id, message : resu.message});
})
/**
 * Admin get newsletter
 */
app.get('/api/getNewsletter',userService.authenticateToken ,async (req,res) => {
  const resu = await newsletterService.getAllNewsletter()
  return res.status(resu.code).json(resu.newsletter)
})
/**
 * public delete newsletter
 */
app.delete('/api/deleteNewsletter/:mail', async (req, res) => {
  const { mail } = req.params
  const resu = await newsletterService.deleteNewsletter(mail)
  return res.status(resu.code).json(resu.message)

})

/**
 * Admin add news
 */
app.post('/api/addNews',userService.authenticateToken ,async (req, res) => {
  const { news } = req.body
  const resu = await newsService.addNews(news)
  return res.status(resu.code).json(resu.news.id)
})
/**
 * Admin add image news
 */
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
/**
 * Admin get news
 */
app.get('/api/getAllNews',userService.authenticateToken ,async (req,res) => {
  const resu = await newsService.getAllNews()
  return res.status(resu.code).json(resu.news)
})
/**
 * Public get news
 */
app.get('/api/getPublicNews',async (req,res) => {
  const resu = await newsService.getPublicNews()
  return res.status(resu.code).json(resu.news)
})

/**
 * Admin delete news
 */
app.delete('/api/deleteNews/:id', userService.authenticateToken,async (req, res) => {
  const { id } = req.params
  const resu = await newsService.deleteNews(id)
  return res.status(resu.code).json(resu.message)
})
/**
 * Admin private news
 */
app.post('/api/privateNews',userService.authenticateToken ,async (req,res) => {
  const { id } = req.body
  const resu = await newsService.privateNews(id)
  return res.status(resu.code).json(resu.message)
})

/////////////////// FOCALLEEEEE
/**
 * Admin  add focale
 *  */
app.post('/api/addFocale', userService.authenticateToken, async (req, res) => {
  const { focale } = req.body; // Assuming the JSON object is sent in the request body
  const resu = await focaleService.addToFocale(focale)
  // Process and save the JSON object as needed
  // Respond with a success message or other appropriate response
  res.status(200).json(resu);
});

// Route to send the files
/**
 * Admin  upload image focale
 *  */
app.post('/api/uploadFocale',userService.authenticateToken, upload.array('images'), (req, res) => {
  const uploadedFiles = req.files;
  const ids = req.body;
  const generalId = ids['generalId']
  console.log(generalId)
  const directoryPath = path.join(path.resolve(), 'save', 'saveFocale', generalId );

  fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
    } else {
      console.log('Directory created successfully');
    }
  });

  for (let i = 0; i < uploadedFiles.length; i++) {
    const imageBuffer = uploadedFiles[i].buffer;
    const imgId = ids[`id${i}`];
  
    const filename = imgId+".png";
  // Define the path to save the image file on your server
    const imagePath = path.join(path.resolve(), 'save', 'saveFocale', generalId , filename);
  // Use the fs module to write the image buffer to the file
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }})
  }
  console.log(uploadedFiles)
  console.log(ids)
  res.status(200).json({ message: 'Images uploaded successfully' });
});
app.post('/api/uploadPDFFocale',userService.authenticateToken, upload.array('focalePDF'), (req, res) => {
  const uploadedFiles = req.files;
  const ids = req.body;
  const generalId = ids['focaleID']
  console.log(generalId)
  const directoryPath = path.join(path.resolve(), 'save', 'saveFocale', generalId );

  fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
    } else {
      console.log('Directory created successfully');
    }
  });

    const pdf1Buffer = uploadedFiles[0].buffer;
    
    const filename = "1.pdf";
    
  // Define the path to save the image file on your server
    const file1 = path.join(path.resolve(), 'save', 'saveFocale', generalId , filename);
  // Use the fs module to write the image buffer to the file
  fs.writeFile(file1, pdf1Buffer, err => {
    if (err) {
      console.error(err);
    }})
    const pdf2Buffer = uploadedFiles[1].buffer;
    
    const filename2 = "2.pdf";
    
  // Define the path to save the image file on your server
    const file2 = path.join(path.resolve(), 'save', 'saveFocale', generalId , filename2);
  // Use the fs module to write the image buffer to the file
  fs.writeFile(file2, pdf1Buffer, err => {
    if (err) {
      console.error(err);
    }})
  
  console.log(uploadedFiles)
  console.log(ids)
  res.status(200).json({ message: 'Images uploaded successfully' });
});

/**
 * Admin  get focale
 *  */
app.get('/api/getFocaleFromId/:id',  userService.authenticateToken,async (req,res) => {
  const { id } = req.params
  const resu = await focaleService.getFocaleFromId(id)
  return res.status(resu.code).json(resu.focale)
})
/**
 * Admin private focale
 *  */
app.post('/api/publicFocale',  async (req,res) => {
  const { id } = req.body
  const resu = await focaleService.publicFocale(id)
  return res.status(resu.code).json(resu)
})
/**
 * public  get id focale
 *  */
app.get('/api/getFocaleFromIdPublic/:id', async (req,res) => {
  const { id } = req.params
  const resu = await focaleService.getFocaleFromIdPublic(id)
  return res.status(resu.code).json(resu.focale)
})
/**
 * Admin  get focale
 *  */
app.get('/api/getFocale', userService.authenticateToken,async (req,res) => {
  const resu = await focaleService.getFocale()
  return res.status(resu.code).json(resu.focales)
})
/**
 * public  get focale
 *  */
app.get('/api/getPublicFocale', async (req,res) => {
  const resu = await focaleService.getFocalePublic()
  return res.status(resu.code).json(resu.focales)
})
/**
 * Admin  delete add focale
 *  */
app.delete('/api/deleteFocale/:id', async (req,res) => {
  const { id }= req.params
  const resu = await focaleService.deleteFocale(id)
  return res.status(resu.code).json(resu)
})


/**
 * Security part
 */

app.post('/verifyRecaptcha' , async (req,res) => {
  const { captcha } = req.body
  const secret_key = "6LdFZPQoAAAAAPRETSD9-IuqspvBnx0dVTOs2tvM"
  const postData = querystring.stringify({
    secret: secret_key,
    response: captcha
  });
  await axios.post(`https://www.google.com/recaptcha/api/siteverify`,postData)
  .then(response => {
    console.log(response.data)
      if (response.data.success) {
          console.log('Success!')
          res.status(200).json({ value: 'captcha OK', succes : true})
          // The reCAPTCHA was verified successfully. Continue processing the form.
      } else {
          console.log('Failed!')
          res.status(400).json({ value: 'captcha NOK' , success : false})

          // The reCAPTCHA verification failed. Send an error response.
      }
  })
  .catch(error => {
      console.error('Error verifying reCAPTCHA:', error);
  });}
)


// Proposer Article
import proposerArticleService from './dbServices/proposerArticleService.js';

app.post('/api/proposerArticle',upload.none(), async (req, res) => {
  // Handle the FormData here
  const { article } = req.body;
  console.log(article)
 const resu= await proposerArticleService.addArticle(article)
return res.status(resu.code).json(resu.article.id)
});


app.get('/api/getPropalArticles', async (req, res) => {
  // Handle the FormData here
 const resu= await proposerArticleService.getAllArticles()
 console.log(resu)
return res.status(resu.code).json(resu.articles)
});


app.post('/api/uploadFilesProposer', upload.array('files'), (req, res) => {
  const uploadedFiles = req.files;
  const ids = req.body;

  const generalId = ids['generalId']
  const directoryPath = path.join(path.resolve(), 'save', 'propalArticle', generalId );

  fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
    } else {
      console.log('Directory created successfully');
    }
  });

  for (let i = 0; i < uploadedFiles.length; i++) {
    const imageBuffer = uploadedFiles[i].buffer;
  
    const filename = uploadedFiles[i].originalname;
  // Define the path to save the image file on your server
    const imagePath = path.join(path.resolve(), 'save', 'propalArticle', generalId , filename);
  // Use the fs module to write the image buffer to the file
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }})
  }

  res.status(200).json({ message: 'Files uploaded successfully' });
});

app.delete('/api/deletePropalArticle/:id', async (req, res) => {
  // Handle the FormData here
  const { id } = req.params;
 const resu= await proposerArticleService.deleteArticle(id)
 res.status(200).json({ message: 'Files deleted successfully' });

})

app.get('/api/downloadPropal/:id', async (req, res) => {
  const { id } = req.params;

  const filePath = path.join(path.resolve(), 'propal', id+".zip");

  await proposerArticleService.createArchive(id)
  
  const filename = id+".zip";
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;
  res.setHeader('Content-Length', fileSizeInBytes);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=${id}.zip`);

  // Wait for 2 seconds
  setTimeout(() => {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(`Error downloading file: ${err}`);
      } else {
        console.log(`File downloaded: ${filePath}`);
      }
    });
  }, 2000);
});