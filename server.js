import axios from 'axios';
import bcrypt from 'bcrypt';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import cron from 'node-cron';
import path from 'path';
import querystring from 'querystring';
import { config } from './config/env.js';
import archiveService from './dbServices/archiveService.js';
import articleService from './dbServices/articlesService.js';
import focaleService from './dbServices/focaleService.js';
import lectureService from './dbServices/lectureService.js';
import newsletterService from './dbServices/newsletterService.js';
import newsService from './dbServices/newsService.js';
import rubriqueService from './dbServices/rubriqueService.js';
import userService from './dbServices/userService.js';
import { loginLimiter, newsletterLimiter, proposerLimiter } from './middleware/rateLimit.js';
const app = express();
const port = config.port;
/**
 * Here's the server class, where all the server is defined and all the routes because I haven't did several files
 */
// const bodyParser = require('body-parser');

// app.use(bodyParser.json({ limit: '400mb' }));
// app.use(bodyParser.urlencoded({ limit: '400mb', extended: true }));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024*8 }, // 50 MB
 });
const millisecondsInADay = 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
const interval = setInterval(lectureService.updateLectures, millisecondsInADay);
app.use(express.json());
const allowedOrigins = config.corsOrigins;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use('/api/save', cors(corsOptions), express.static('save'));
app.use(cors(corsOptions));

// Schedule your function to run at 12:00 and 00:00 every day
cron.schedule('0 0,12 * * *', () => {
  lectureService.updateLectures();
  newsService.expireBanners();
});




// Begining of routes :
//=================================================================================================
/*
* Admin user registration
*/
app.get('/api/up', (req, res) => {
  lectureService.updateLectures()
  res.send('Hello World!');

})

app.post('/api/register', userService.authenticateToken, userService.requireMinRole('admin'), async (req, res) => {
  const { username, mail, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const ret = await userService.addUser({
    name: username,
    mail,
    password: hashedPassword,
    role: req.body.role || 'contributor',
  });
  return res.status(ret.code).json({ message: ret.message });
});


/*
* Admin user registration
*/
app.post('/api/registerAdmin' ,userService.authenticateToken,async (req, res) => {
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

app.post('/api/login', loginLimiter, async (req, res) => {
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
  return res.status(401).json({ message: 'Invalid credentials', connected: false });
});

/**
 * Admin delete user
 */
app.post('/api/deleteUser', userService.authenticateToken, userService.requireMinRole('admin'), (req, res) => {
    const { id } = req.body;
    const resu = userService.deleteUser(id);
    return  res.status(resu.code).json({ message: resu.message });
  })
  
/**
 * Admin modify user
 */
app.post('/api/modifyUser',userService.authenticateToken, userService.requireMinRole('admin'), async (req, res) => {
  const { user } = req.body;
  const resu = await userService.modifyUser(user);
  return res.status(resu.code).json({ message: resu.message });
});

app.get('/api/me', userService.authenticateToken, userService.requireMinRole('contributor'), async (req, res) => {
  const result = await userService.getUser(req.user.id);
  if (result.code !== 200) return res.status(result.code).json({ message: result.message });
  return res.status(200).json(result.user);
});

app.put('/api/me/profile', userService.authenticateToken, userService.requireMinRole('contributor'), async (req, res) => {
  const resu = await userService.updateOwnProfile(req.user.id, req.body || {});
  return res.status(resu.code).json({ message: resu.message });
});

/**
 * Admin get user
 */
app.get('/api/getUser',userService.authenticateToken, userService.requireMinRole('admin'), async (req, res) => {
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
app.get('/api/getAllUser',userService.authenticateToken, userService.requireMinRole('admin'), async (req, res) => {
  const resu = await userService.getAllUser()
  return res.status(resu.code).json(resu.users);
});

/**
 * Admin delete user
 */
app.delete('/api/deleteUser/:id',userService.authenticateToken, userService.requireMinRole('admin'), async (req, res) => {
  const { id } = req.params;
  const resu = await userService.deleteUser(id);
  return  res.status(resu.code).json({ message: resu.message });
})

// Articles PARTTTT


/**
 * Admin add article
 */
app.post('/api/addArticle',userService.authenticateToken, userService.requireMinRole('contributor'), upload.none(), async (req, res) => {
  // Handle the FormData here
  const { article } = req.body;
 const resu= await articleService.addArticle(article)
return res.status(resu.code).json(resu.article.id)

 
});

/* Admin upload image article
*/
app.post('/api/uploadImage',userService.authenticateToken, userService.requireMinRole('contributor'), upload.single('imageLogo'), (req, res) => {
  if (!req.file) {
    return res.status(200).json({ message: 'No image file received.' });
  }
  const infoString = req.body.articleId; // Access the string data
	console.log('REQ FILE:', req.file);
  const filename = infoString+".png";
//  const fileBuffer = fs.readFileSync(req.file.path);
  const imagePath = path.join(path.resolve(), 'save', 'saveArticle', 'cover', filename);

  fs.writeFile(imagePath, req.file.buffer, err => {
    if (err) {
      console.error(err);
    }
  });
//  fs.rmSync(req.file.path)
  return res.status(200).json({ message: 'Image uploaded successfully.' });
});


/**
 * Admin api upload image article
 */

app.post('/api/uploadArticleImages', userService.authenticateToken, upload.array('images'), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    const ids = req.body;
    const generalId = ids['generalId'];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: 'No images received.' });
    }

    const directoryPath = path.join(path.resolve(), 'save', 'saveArticle', 'images', generalId);


    fs.mkdirSync(directoryPath, { recursive: true });

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const imgId = ids[`id${i}`];
      const filename = `${imgId}.png`;
      const imagePath = path.join(directoryPath, filename);

      if (file.path) {
        const imageBuffer = fs.readFileSync(file.path);
        fs.writeFileSync(imagePath, imageBuffer);
        fs.rmSync(file.path);
      } else if (file.buffer) {
        fs.writeFileSync(imagePath, file.buffer);
      }
    }

    return res.status(200).json({ message: 'Images uploaded successfully' });
  } catch (error) {
    console.error('Error uploading article images:', error);
    return res.status(500).json({ message: 'Server error during image upload.' });
  }
});

/**
 * Admin delete article
 */
app.delete('/api/deleteArticle/:id',userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.params;
    const resu = await articleService.deleteArticle(id);
    return  res.status(resu.code).json({ message: resu.message });

  })
  
/**
 * Admin modify article
 */
app.post('/api/modifyArticle',userService.authenticateToken, userService.requireMinRole('contributor'), async (req, res) => {
  const { article } = req.body;
  const resu = await articleService.modifyArticle(article);
  return  res.status(resu.code).json({ message: resu.message });
  // Implement your logic to fetch and send data here
});
/**
 * Admin private article
 */
app.post('/api/privateArticle',userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
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
app.get('/api/getLectures',userService.authenticateToken, userService.requireMinRole('admin'), async (req, res) => {
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
app.post('/api/addArchive',userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  const { archive } = req.body;
  const resu = await archiveService.addArchive(archive)
return res.status(resu.code).json(resu.archive.id)
});

/**
 * Admin upload pdf archive
 */
// Handle the image upload separately
app.post('/api/uploadPdfArchive', userService.authenticateToken, upload.single('archivePdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No pdf file received.' });
    }

    const infoString = req.body.archiveId;
    const filename = `${infoString}.pdf`;
    const pdfPath = path.join(path.resolve(), 'save', 'saveArchive', 'pdf', filename);

    // Support both memory storage and disk storage seamlessly
    if (req.file.buffer) {
      // Memory storage: write buffer directly
      fs.writeFileSync(pdfPath, req.file.buffer);
    } else if (req.file.path) {
      // Disk storage: read temp file, write to destination, then clean up temp file
      const fileBuffer = fs.readFileSync(req.file.path);
      fs.writeFileSync(pdfPath, fileBuffer);
      fs.rmSync(req.file.path);
    } else {
      return res.status(400).json({ message: 'Invalid file upload configuration.' });
    }

    // Call extraction service (awaited in case it's asynchronous)
    if (typeof archiveService.extractPdf === 'function') {
      await archiveService.extractPdf(infoString);
    }

    return res.status(200).json({ message: 'PDF uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading PDF archive:', error);
    return res.status(500).json({ message: 'Server error during PDF upload.' });
  }
});
/**
 * Admin delete archive
 */
app.delete('/api/deleteArchive/:id',userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
    // Implement your logic to fetch and send data here
    const { id } = req.params;
    const resu = await  archiveService.deleteArchive(id)
    return  res.status(resu.code).json(resu.message);

  })
  
/**
 * Admin modify archive
 */
app.post('/api/modifyArchive',userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
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
app.post('/api/privateArchive',userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
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
app.post('/api/addRubrique',userService.authenticateToken, userService.requireMinRole('editor'), async (req,res) => {
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
app.post('/api/modifyRubrique',userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  const { rubrique } = req.body;
  const resu = await rubriqueService.modifyRubrique(rubrique)
  return  res.status(resu.code).json(resu.message);
  // Implement your logic to fetch and send data here
});

/**
 * public add newsletter
 */
// Newsletter
app.post('/api/addNewsletter', newsletterLimiter, async (req, res) => {
  const { user } = req.body;
  const resu = await newsletterService.addNewsletter(user);
  return res.status(resu.code).json({
    id: resu.newsletter?.id || null,
    message: resu.message,
  });
});
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
app.delete('/api/deleteNewsletter/:mail', newsletterLimiter, async (req, res) => {
  const { mail } = req.params
  const resu = await newsletterService.deleteNewsletter(mail)
  return res.status(resu.code).json(resu.message)

})

/**
 * Admin add news
 */
app.post('/api/addNews',userService.authenticateToken, userService.requireMinRole('contributor'), async (req, res) => {
  const { news } = req.body
  const resu = await newsService.addNews(news)
  return res.status(resu.code).json(resu.news.id)
})
/**
 * Admin add image news
 */
app.post('/api/uploadImageNews', userService.authenticateToken, upload.single('imageLogo'), async (req, res) => {
  try {
    console.log("upload image");
    if (!req.file) {
      return res.status(400).json({ message: 'No image file received.' });
    }

    const infoString = req.body.newsId; 
    const filename = `${infoString}.png`;
    const imagePath = path.join(path.resolve(), 'save', 'newsImage', filename);


    fs.mkdirSync(path.dirname(imagePath), { recursive: true });


    if (req.file.buffer) {

      fs.writeFileSync(imagePath, req.file.buffer);
    } else if (req.file.path) {

      const fileBuffer = fs.readFileSync(req.file.path);
      fs.writeFileSync(imagePath, fileBuffer);
      fs.rmSync(req.file.path);
    } else {
      return res.status(400).json({ message: 'Invalid file upload configuration.' });
    }

    return res.status(200).json({ message: 'Image uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading news image:', error);
    return res.status(500).json({ message: 'Server error during image upload.' });
  }
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
app.delete('/api/deleteNews/:id', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  const { id } = req.params
  const resu = await newsService.deleteNews(id)
  return res.status(resu.code).json(resu.message)
})
/**
 * Admin private news
 */
app.post('/api/privateNews',userService.authenticateToken, userService.requireMinRole('editor'), async (req,res) => {
  const { id } = req.body
  const resu = await newsService.privateNews(id)
  return res.status(resu.code).json(resu.message)
})

/////////////////// FOCALLEEEEE
/**
 * Admin  add focale
 *  */
app.post('/api/addFocale', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
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
// app.post('/api/uploadFocale',userService.authenticateToken, upload.array('images'), (req, res) => {
//   const uploadedFiles = req.files;
//   const ids = req.body;
//   const generalId = ids['generalId']
//   console.log(generalId)
//   const directoryPath = path.join(path.resolve(), 'save', 'saveFocale', generalId );

//   fs.mkdirSync(directoryPath, { recursive: true }, (err) => {
//     if (err) {
//       console.error('Error creating directory:', err);
//     } else {
//       console.log('Directory created successfully');
//     }
//   });

//   for (let i = 0; i < uploadedFiles.length; i++) {
//     const imageBuffer = uploadedFiles[i].buffer;
//     const imgId = ids[`id${i}`];
  
//     const filename = imgId+".png";
//   // Define the path to save the image file on your server
//     const imagePath = path.join(path.resolve(), 'save', 'saveFocale', generalId , filename);
//   // Use the fs module to write the image buffer to the file
//   fs.writeFile(imagePath, imageBuffer, err => {
//     if (err) {
//       console.error(err);
//     }})
//   }
//   console.log(uploadedFiles)
//   console.log(ids)
//   res.status(200).json({ message: 'Images uploaded successfully' });
// });
app.post('/api/uploadPDFFocale', userService.authenticateToken, upload.array('focalePDF'), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    const ids = req.body;
    const generalId = ids['focaleID'];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: 'No PDF files received.' });
    }

    const directoryPath = path.join(path.resolve(), 'save', 'saveFocale', generalId);

    // Fixed: fs.mkdirSync does not accept a callback
    fs.mkdirSync(directoryPath, { recursive: true });

    // Loop through files dynamically (names them 1.pdf, 2.pdf, etc.)
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const filename = `${i + 1}.pdf`; 
      const targetPath = path.join(directoryPath, filename);

      if (file.path) {
        const fileBuffer = fs.readFileSync(file.path);
        fs.writeFileSync(targetPath, fileBuffer);
        fs.rmSync(file.path); // Clean up Multer's temp file
      } else if (file.buffer) {
        fs.writeFileSync(targetPath, file.buffer);
      }
    }

    console.log('Uploaded Files:', uploadedFiles);
    console.log('IDs:', ids);
    
    return res.status(200).json({ message: 'PDFs uploaded successfully' });
  } catch (error) {
    console.error('Error uploading Focale PDFs:', error);
    return res.status(500).json({ message: 'Server error during PDF upload.' });
  }
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
app.post('/api/publicFocale', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
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
app.delete('/api/deleteFocale/:id', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
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
import dossierService from './dbServices/dossierService.js';
import pageService from './dbServices/pageService.js';
import proposerArticleService from './dbServices/proposerArticleService.js';

app.post('/api/proposerArticle', proposerLimiter, upload.none(), async (req, res) => {
  // Handle the FormData here
  const { article } = req.body;
  console.log(article)
 const resu= await proposerArticleService.addArticle(article)
return res.status(resu.code).json(resu.article.id)
});


app.get('/api/getPropalArticles', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  // Handle the FormData here
 const resu= await proposerArticleService.getAllArticles()
 console.log(resu)
return res.status(resu.code).json(resu.articles)
});


app.post('/api/uploadFilesProposer', proposerLimiter, upload.array('files'), (req, res) => {
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
    const imageBuffer = fs.readFileSync(uploadedFiles[i].path);

  
    const filename = uploadedFiles[i].originalname;
  // Define the path to save the image file on your server
    const imagePath = path.join(path.resolve(), 'save', 'propalArticle', generalId , filename);
  // Use the fs module to write the image buffer to the file
  fs.writeFile(imagePath, imageBuffer, err => {
    if (err) {
      console.error(err);
    }})
    fs.rmSync(uploadedFiles[i].path)
  }

  res.status(200).json({ message: 'Files uploaded successfully' });
});

app.delete('/api/deletePropalArticle/:id', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  // Handle the FormData here
  const { id } = req.params;
 const resu= await proposerArticleService.deleteArticle(id)
 res.status(200).json({ message: 'Files deleted successfully' });

})

app.get('/api/downloadPropal/:id', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
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


// Disabled file manager routes (security)
app.post('/deletefile', userService.authenticateToken, (req, res) => {
  res.status(410).json({ message: 'This endpoint has been disabled for security reasons.' });
});

app.post('/fileList/', userService.authenticateToken, (req, res) => {
  res.status(410).json({ message: 'This endpoint has been disabled for security reasons.' });
});

app.post('/upload', userService.authenticateToken, (req, res) => {
  res.status(410).json({ message: 'This endpoint has been disabled for security reasons.' });
});

app.post('/getFile', (req, res) => {
  res.status(410).json({ message: 'This endpoint has been disabled for security reasons.' });
});

// --- Dossiers ---
app.get('/api/dossiers', async (req, res) => {
  const resu = await dossierService.getPublic();
  return res.status(resu.code).json(resu.dossiers);
});

app.get('/api/dossiers/:id', async (req, res) => {
  const resu = await dossierService.getById(req.params.id);
  if (resu.code !== 200) return res.status(resu.code).json({ message: 'Not found' });
  const articles = await articleService.getAllPublicArticles();
  const dossierArticles = (articles.article || []).filter((a) => a.dossier_id === req.params.id);
  return res.json({ ...resu.dossier, articles: dossierArticles });
});

app.post('/api/dossiers', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  const resu = await dossierService.add(req.body.dossier);
  return res.status(resu.code).json(resu.dossier);
});

app.put('/api/dossiers/:id', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  const resu = await dossierService.modify({ ...req.body.dossier, id: req.params.id });
  return res.status(resu.code).json(resu.dossier);
});

app.delete('/api/dossiers/:id', userService.authenticateToken, userService.requireMinRole('editor'), async (req, res) => {
  const resu = await dossierService.delete(req.params.id);
  return res.status(resu.code).json({ message: resu.message });
});

// --- Pages éditables ---
app.get('/api/pages/:slug', async (req, res) => {
  const resu = await pageService.getPage(req.params.slug);
  return res.status(resu.code).json(resu.page);
});

app.post('/fileList/',  userService.authenticateToken,(req, res) => {
    console.log(process.cwd())
 
    let cwd = process.cwd();
    let directoryPath = path.join(cwd);
    const { pathfile }= req.body; // Assuming the request body is a string
    console.log(pathfile);

    if(pathfile){
     directoryPath = path.join(directoryPath, pathfile);
    } 
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err.message}`);
            res.status(500).send(`Error reading directory: ${err.message}`);
            return;
        }

        const fileObjects = files.map((file) => {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);
            const fileType = stats.isDirectory() ? 'directory' : 'file';
            return { name: file, type: fileType };
        });

        res.send(fileObjects);
    });
});

app.post('/upload', upload.single('file'),  userService.authenticateToken,(req, res) => {
  const file = req.file; 
  const destinationPath = req.body.path;


  if (!destinationPath) {
      res.status(400).send('No path provided');
      return;
  }


  const finalDest = path.join(process.cwd(), destinationPath);
  fs.mkdirSync(finalDest, { recursive: true });


  const newFilePath = path.join(finalDest, file.originalname);

  fs.rename(file.path, newFilePath, err => {
      if (err) {
          console.error(`Error moving file: ${err.message}`);
          res.status(500).send(`Error moving file: ${err.message}`);
          return;
      }

      res.send('File uploaded successfully');
  });
});

app.post('/getFile', (req, res) => {
  const { pathfile } = req.body;


  const filePath = path.join(process.cwd(), pathfile);


  fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
          console.error(`Error reading file: ${err.message}`);
          res.status(500).send(`Error reading file: ${err.message}`);
          return;
      }

      res.send(data);
  });
});


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
