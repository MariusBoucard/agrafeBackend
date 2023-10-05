import {nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'
import rubriqueService from './rubriqueService.js';
// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data/article.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data/article.json', JSON.stringify(data, null, 2));
}

function articleSanityCheck(article){
    return "titreFront" in article && "description" in article
    && "imageLogo" in article && "path" in article 
  && "auteur" in article && "numeroParu" in article 
    && "date" in article && "rubrique" in article 
    &&"misEnLigne" in article  
}

const articleService = {

    //add admin user 

    addArticle : async function addArticle(article){
        let articleToAdd = {}
        if ( articleSanityCheck(article)){
            // try{
                const idd = nanoid()
                articleToAdd = {
                    id :  idd,
                    "titreFront" : article.titreFront,
                    "description" : article.description,
                    imageLogo : "/save/saveArticle/cover/"+idd,
                    path : article.path,
                    auteur  : article.auteur,
                    numeroParu : article.numeroParu,
                    date : article.date,
                    private : true,
                    // Attention, bien save l id de la rubrique
                    rubrique : article.rubrique,
                    misEnLigne : article.misEnLigne,
                    rang : article.rangArticle,
                    lectures : 0
                }
                //getdb,
                const rawData = await readDataFromFile()
                const data  = rawData
                data.articles.push(articleToAdd);
                saveToFile(data)
                rubriqueService.addArticleToRubrique(article.rubrique)
                return { code: 200, message: "article added" , article : articleToAdd};
    } else {
      return { code: 404, message: "article not added" , article : null};
    }
    },
  
addLectureArticle : async function addLectureArticle(id){
  const rawData = await readDataFromFile()
  const arti = rawData.articles.find(idd => id === idd.id)
  arti.lectures +=1
  saveToFile(rawData)
},
//delete a user 
deleteArticle : async function deleteArticle(id){
    const rawData = await readDataFromFile()
    const index = rawData.articles.findIndex(idd => id === idd.id)

    if(index !== -1){
        rubriqueService.removeArticleFromRubrique(rawData.articles[index].rubrique)

        rawData.articles.splice(index,1)
        //delet the assets :
        const filePath = path.join(path.resolve(), 'save', 'saveArticle', 'pdf', id+'.pdf');
  // Use the fs module to write the image buffer to the file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          } else {
            console.log(`File deleted: ${filePath}`);
          }
        });
        const imgPath = path.join(path.resolve(), 'save', 'saveArticle', 'cover', id+'.png');
        // Use the fs module to write the image buffer to the file
              fs.unlink(imgPath, (err) => {
                if (err) {
                  console.error(`Error deleting file: ${err}`);
                } else {
                  console.log(`File deleted: ${filePath}`);
                }
              });
        
        
        saveToFile(rawData)
        return { code: 200, message: "article deleted" };

    }
    return { code: 404, message: "article not found"};

},
//modify a user
modifyArticle : async function modifyArticle(article){
    const rawData = await readDataFromFile()
    const arti = rawData.articles.find(idd => article.id === idd.id)
    if(arti){
        arti.titreFront = article.titreFront,
        arti.description = article.description,
        arti.imageLogo = article.imageLogo,
        arti.path = article.path,
        arti.auteur  = article.auteur,
        arti.numeroParu = article.numeroParu,
        arti.date = article.date,
        arti.private = article.private,
        arti.rubrique = article.rubrique,
        arti.misEnLigne = article.misEnLigne,
        arti.fileType = article.fileType
        saveToFile(rawData)
        return { code: 200, message: "article modified" };
    }
    return { code: 404, message: "article not modified" };

},

publicArticle : async function publicArticle(id){
  const rawData = await readDataFromFile()
  const userFound = rawData.articles.find(idd => id === idd.id)
  if(userFound){
    userFound.private = !userFound.private
    saveToFile(rawData)
    return { code: 200, message: "article passé public" };
  }
  return { code: 404, message: "article pas passé public" };
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
getPublicArticle : async function getPublicArticle(id){
  const rawData = await readDataFromFile()
  const userFound = rawData.articles.find(idd => id === idd.id)
  if(userFound){
    if(!userFound.private){
      return { code: 200, message: "Voila les articles bg" , article : userFound};
    }
    return { code: 404, message: "pas d article bg" , article : null};
  }
  return { code: 404, message: "pas d article" , article : null};
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

getAllPublicArticles : async function getAllPublicArticles(){
  const rawData = await readDataFromFile()
  const userFound = rawData.articles.filter(ar => ar.private === false)
  if(userFound){
    return { code: 200, message: "Voila les articles bg" , article : userFound};
 }
 return { code: 404, message: "pas d article bg" , articles : null};
},

// TO ADD IN ROUTES :
getArticlesFromRubrique : async function getArticlesFromRubrique(rubId){
  const rawData = await readDataFromFile()
  const tab = rawData.articles.filter(arti => arti.rubrique === rubId)
  if(tab){
    return { code: 200, message: "Voila les articles bg" , articles : tab};
  }
  return { code: 404, message: "pas d article bg" , articles : null};
},

//TODO
// TO ADD IN ROUTES :
getArticlesPage : async function getArticlesPage(number){
  const rawData = await readDataFromFile()
  const pageSize = 5
  const startIndex = number*pageSize
  const endIndex = startIndex+pageSize
  const result = rawData.articles.slice(startIndex, endIndex);
  // TODO : On sort comment ? Il faudrait l'envoyer aussi
  return { code: 200, message: "Voila les articles bg" , articles : result};
},
//TODO
getArticleFromName : async function getArticleFromName(name){
  const rawData = await readDataFromFile()
  const result = rawData.articles.filter(arto => 
    arto.titreFront
    .toLowerCase() // Convert the article title to lowercase
    .replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
    .includes(name.toLowerCase()) )
    return { code: 200, message: "Voila les articles bg" , articles : result};
  }

}

export default articleService