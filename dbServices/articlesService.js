import {nanoid } from 'nanoid'
import fs from 'fs'
import crypto from 'crypto'; // Import the Node.js crypto module
import { start } from 'repl';

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
    console.log(article)
    return "titreFront" in article && "description" in article
    && "imageLogo" in article && "path" in article 
  && "auteur" in article && "numeroParu" in article 
    && "date" in article && "rubrique" in article 
    &&"misEnLigne" in article && "fileType" in article 
}

const articleService = {

    //add admin user 

    addArticle : async function addArticle(article){
        let articleToAdd = {}
        console.log(article)
        if ( articleSanityCheck(article)){
            // try{
                
                articleToAdd = {
                    id : nanoid(),
                    "titreFront" : article.titreFront,
                    "description" : article.description,
                    imageLogo : article.imageLogo,
                    path : article.path,
                    auteur  : article.auteur,
                    numeroParu : article.numeroParu,
                    date : article.date,
                    private : article.private,
                    // Attention, bien save l id de la rubrique
                    rubrique : article.rubrique,
                    misEnLigne : article.misEnLigne,
                    fileType : article.fileType
                }
                //getdb,
                const rawData = await readDataFromFile()
                console.log(rawData)
                const data  = rawData
                data.articles.push(articleToAdd);
                saveToFile(data)
                return articleToAdd.id
                //save 
                console.log("article adddeedd")
        //     } catch {
        //         console.log("error")
        //         return { error : "Mon soos ça a chié en rajoutant le user"}
        // }
    } else {
        console.log('pas bon')
        return { error : "Correspond pas a un article"}
    }
    },
  

//delete a user 
deleteArticle : async function deleteArticle(id){
    const rawData = await readDataFromFile()
    
    const index = rawData.articles.findIndex(idd => id === idd.id)
    if(index !== -1){
        console.log(rawData)
        rawData.articles.splice(index,1)
        saveToFile(rawData)
    }
    console.log(index)
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
        console.log("toruvé")
    }
},


//GetUser ATTention DTO MDP
getArticle : async function getArticle(id){
    const rawData = await readDataFromFile()
    const userFound = rawData.articles.find(idd => id === idd.id)
return userFound    
},


//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllArticles : async function getAllArticles(){
  const rawData = await readDataFromFile()
  const userFound = rawData.articles
  if(userFound){
return userFound   
 }
},


// TO ADD IN ROUTES :
getArticlesFromRubrique : async function getArticlesFromRubrique(rubId){
  const rawData = await readDataFromFile()
  const tab = rawData.articles.filter(arti => arti.rubrique === rubId)
  if(tab){
   return tab   
  }

},

// TO ADD IN ROUTES :
getArticlesPage : async function getArticlesPage(number){
  const rawData = await readDataFromFile()
  const pageSize = 5
  const startIndex = number*pageSize
  const endIndex = startIndex+pageSize
  const result = rawData.articles.slice(startIndex, endIndex);
  // TODO : On sort comment ? Il faudrait l'envoyer aussi
  return result
},
getArticleFromName : async function getArticleFromName(name){
  const rawData = await readDataFromFile()
  const result = rawData.articles.filter(arto => 
    arto.titreFront
    .toLowerCase() // Convert the article title to lowercase
    .replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
    .includes(name.toLowerCase()) )
  return result
}

}

export default articleService