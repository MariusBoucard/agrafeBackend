import {nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { rimraf } from 'rimraf';
// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data/proposerArticle.json', 'utf8', (err, data) => {
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



function saveToFile(data){
    fs.writeFileSync('data/proposerArticle.json', JSON.stringify(data, null, 2));
}


const articleService = {

    //add admin user 

    addArticle : async function addArticle(article){
        let articleToAdd = {}
      
            // try{
                const idd = nanoid()
                articleToAdd = {
                    id :  idd,
                    "rubriqueId" : article.rubriqueId,
                    "auteur" : article.auteur,
                    titre : article.titre,
                    "sous-titre" : article["sous-titre"],
                    article  : article.article,
                    notesBasPage : article.notesBasPage,
                    sources : article.sources,
                    contact : article.contact,
                    // Attention, bien save l id de la rubrique
                    commentaire : article.commentaire
                }
                //getdb,
                const rawData = await readDataFromFile()
                const data  = rawData
                if(data.articles.length >10){
                    return { code: 400, message: "Trop d'articles en attente" , article : articleToAdd};

                }
                data.articles.push(articleToAdd);
                saveToFile(data)
                return { code: 200, message: "article added" , article : articleToAdd};
    
    },
  

        //delete a user 
        deleteArticle : async function deleteArticle(id){
            const rawData = await readDataFromFile()
            const index = rawData.articles.findIndex(idd => id === idd.id)

            if (index !== -1) {
                rawData.articles.splice(index, 1);
                // delete the assets:
                const folderPath = path.join(path.resolve(), 'save', 'propalArticle', id);
                // Use the rimraf module to delete the folder
                rimraf(folderPath, {}, function (err) {
                    if (err) {
                        console.error(`Error deleting folder: ${err}`);
                    } else {
                        console.log(`Folder deleted: ${folderPath}`);
                    }
                });

                saveToFile(rawData);
                return { code: 200, message: 'article deleted' };
            }
            return { code: 404, message: "article not found"};

        },


//GetUser ATTention DTO MDP
getArticle : async function getArticle(id){
    const rawData = await readDataFromFile()
    const userFound = rawData.articles.find(idd => id === idd.id)
    if(userFound){
      return { code: 200, message: "Voila l'article bg" , article : userFound};
    }
    return { code: 404, message: "Voila l'article bg" , article : null};
  },

//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllArticles : async function getAllArticles(){
  const rawData = await readDataFromFile()
  const userFound = rawData.articles
  if(userFound){
    return { code: 200, message: "Voila les articles bg" , articles : userFound};
 }
 return { code: 404, message: "pas d article bg" , articles : null};
},

createArchive : async function createArchive(id){
    const rawData = await readDataFromFile()
    const article = rawData.articles.find(idd => id === idd.id)
    let fileContent = '';

        for (let key in article) {
        fileContent += `${key}: ${article[key]}\n`;
        }

        fs.writeFileSync(`propal/${id}.txt`, fileContent, (err) => {})


  // create a file to stream archive data to.
  const output = fs.createWriteStream(`propal/${id}.zip`);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  // pipe archive data to the file
  archive.pipe(output);

  // append files
  archive.file(`propal/${id}.txt`, { name: `${id}.txt` });
  const directoryPath = path.join(path.resolve(), 'save', 'propalArticle', id);
  fs.readdirSync(directoryPath).forEach(file => {
    archive.file(path.join(directoryPath, file), { name: file });
  });


  // finalize the archive (ie we are done appending files but streams have to finish yet)
  await archive.finalize();
  return true
}
}

export default articleService