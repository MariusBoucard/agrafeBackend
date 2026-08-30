import {nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'
import rubriqueService from './rubriqueService.js';
import { config } from '../config/env.js';
import * as repos from '../db/repos.js';
import userService from './userService.js';
import { resolveAuthorSlug } from '../utils/authorSlug.js';

async function withAuthorSlugs(payload) {
  if (!payload) return payload;
  try {
    const usersRes = await userService.getAllUser();
    const users = usersRes.users || [];
    const attach = (article) => {
      if (!article || typeof article !== 'object') return article;
      return { ...article, authorSlug: resolveAuthorSlug(article.auteur, users) };
    };
    if (Array.isArray(payload)) return payload.map(attach);
    return attach(payload);
  } catch {
    const attach = (article) => {
      if (!article || typeof article !== 'object') return article;
      return { ...article, authorSlug: resolveAuthorSlug(article.auteur, []) };
    };
    if (Array.isArray(payload)) return payload.map(attach);
    return attach(payload);
  }
}

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
                    created_at : article.date || new Date().toISOString().split('T')[0],
                    updated_at : new Date().toISOString(),
                    private : true,
                    rubrique : article.rubrique,
                    dossier_id : article.dossier_id || null,
                    misEnLigne : article.misEnLigne,
                    rang : article.rangArticle,
                    lectures : 0
                }
                //getdb,
                if (config.usePostgres) {
                  await repos.articles.insert(articleToAdd);
                  await repos.rubriques.bumpArticles(article.rubrique, 1);
                } else {
                  const rawData = await readDataFromFile()
                  const data  = rawData
                  data.articles.push(articleToAdd);
                  saveToFile(data)
                  rubriqueService.addArticleToRubrique(article.rubrique)
                }

                const filePath = 'save/saveArticle/articleText/'+idd+'.txt';
                const fileContent = JSON.stringify(article.contenu) ;
                // ON a pas get le contenu !!!!!
                fs.writeFile(filePath, fileContent, (err) => {
                  if (err) {
                    console.error('Error creating file:', err);
                    return;
                  }
                  console.log('File created successfully.');
                });
                return { code: 200, message: "article added" , article : articleToAdd};
    } else {
      return { code: 404, message: "article not added" , article : null};
    }
    },
  
addLectureArticle : async function addLectureArticle(id){
  if (config.usePostgres) {
    const article = await repos.articles.byId(id);
    if (article) await repos.articles.incrementLectures(id);
    return;
  }
  const rawData = await readDataFromFile()
  const arti = rawData.articles.find(idd => id === idd.id)
  arti.lectures +=1
  saveToFile(rawData)
},
//delete a user 
deleteArticle : async function deleteArticle(id){
    if (config.usePostgres) {
        const article = await repos.articles.byId(id);
        if (!article) return { code: 404, message: "article not found"};
        await repos.articles.remove(id);
        if (article.rubrique) await repos.rubriques.bumpArticles(article.rubrique, -1);
    } else {
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
    } else {
      return { code: 404, message: "article not found"};
    }
    }
    //delet the assets :
    const filePath = path.join(path.resolve(), 'save', 'saveArticle', 'pdf', id+'.pdf');
    fs.unlink(filePath, () => {});
    const imgPath = path.join(path.resolve(), 'save', 'saveArticle', 'cover', id+'.png');
    fs.unlink(imgPath, () => {});
    return { code: 200, message: "article deleted" };

},
//modify a user
modifyArticle : async function modifyArticle(article){
    if (config.usePostgres) {
      const existing = await repos.articles.byId(article.id);
      if (!existing) return { code: 404, message: "article not modified" };
      const updated = {
        ...existing,
        ...article,
        created_at: existing.created_at || existing.date,
        dossier_id: article.dossier_id ?? existing.dossier_id,
        updated_at: new Date().toISOString(),
      };
      await repos.articles.update(updated);
      if (article.contenu) {
        fs.writeFileSync('save/saveArticle/articleText/'+article.id+'.txt', JSON.stringify(article.contenu));
      }
      return { code: 200, message: "article modified" };
    }
    const rawData = await readDataFromFile()
    const arti = rawData.articles.find(idd => article.id === idd.id)
    if(arti){
        if (!arti.created_at) {
          arti.created_at = arti.date;
        }
        arti.titreFront = article.titreFront
        arti.description = article.description
        arti.imageLogo = article.imageLogo
        arti.path = article.path
        arti.auteur  = article.auteur
        arti.numeroParu = article.numeroParu
        arti.date = article.date
        arti.private = article.private
        arti.rubrique = article.rubrique
        arti.dossier_id = article.dossier_id ?? arti.dossier_id
        arti.misEnLigne = article.misEnLigne
        arti.fileType = article.fileType
        arti.updated_at = new Date().toISOString()
        saveToFile(rawData)
        if (article.contenu) {
          const filePath = 'save/saveArticle/articleText/'+article.id+'.txt';
          fs.writeFileSync(filePath, JSON.stringify(article.contenu));
        }
        return { code: 200, message: "article modified" };
    }
    return { code: 404, message: "article not modified" };

},

publicArticle : async function publicArticle(id){
  if (config.usePostgres) {
    const article = await repos.articles.byId(id);
    if (article) {
      await repos.articles.togglePrivate(id);
      return { code: 200, message: "article passé public" };
    }
    return { code: 404, message: "article pas passé public" };
  }
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
    if (config.usePostgres) {
      const article = await repos.articles.byId(id);
      if (article) {
        const filePath = 'save/saveArticle/articleText/'+id+'.txt';
        article.contenu = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
        return { code: 200, message: "Voila l'article bg" , article };
      }
      return { code: 404, message: "Voila l'article bg" , article : null};
    }
    const rawData = await readDataFromFile()
    const userFound = rawData.articles.find(idd => id === idd.id)
    if(userFound){
      const filePath = 'save/saveArticle/articleText/'+id+'.txt';
      if (fs.existsSync(filePath)) {
        userFound.contenu = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        userFound.contenu = [];
      }
      if (!userFound.created_at) userFound.created_at = userFound.date;
      return { code: 200, message: "Voila l'article bg" , article : userFound};
    }
    return { code: 404, message: "Voila l'article bg" , article : null};
  },
getPublicArticle : async function getPublicArticle(id){
  if (config.usePostgres) {
    const article = await repos.articles.byId(id);
    if (article && !article.private) {
      await repos.articles.incrementLectures(id);
      const filePath = 'save/saveArticle/articleText/'+id+'.txt';
      article.contenu = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
      article.lectures = (article.lectures ?? 0) + 1;
      return { code: 200, message: "Voila le article bg" , article: await withAuthorSlugs(article) };
    }
    if (article) return { code: 404, message: "pas d article bg" , article : null};
    return { code: 404, message: "pas d article" , article : null};
  }
  const rawData = await readDataFromFile()
  const userFound = rawData.articles.find(idd => id === idd.id)
  // Add a lecture and write to file

  if(userFound){
    if(!userFound.private){
      userFound.lectures +=1
      saveToFile(rawData)
      
      // Read the content from file 
      const filePath = 'save/saveArticle/articleText/'+id+'.txt';
      const fileContent = fs.readFileSync(filePath, 'utf8');
      userFound.contenu = JSON.parse(fileContent)
      return { code: 200, message: "Voila le article bg" , article: await withAuthorSlugs(userFound) };
    }
    return { code: 404, message: "pas d article bg" , article : null};
  }
  return { code: 404, message: "pas d article" , article : null};
},


//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllArticles : async function getAllArticles(){
  if (config.usePostgres) {
    const articles = await repos.articles.all();
    return { code: 200, message: "Voila les articles bg" , articles };
  }
  const rawData = await readDataFromFile()
  const userFound = rawData.articles
  if(userFound){
    return { code: 200, message: "Voila les articles bg" , articles : userFound};
 }
 return { code: 404, message: "pas d article bg" , articles : null};
},

getAllPublicArticles : async function getAllPublicArticles(){
  if (config.usePostgres) {
    const article = await withAuthorSlugs(await repos.articles.publicAll());
    return { code: 200, message: "Voila les articles bg" , article };
  }
  const rawData = await readDataFromFile()
  const userFound = rawData.articles.filter(ar => ar.private === false)
  if(userFound){
    return { code: 200, message: "Voila les articles bg" , article: await withAuthorSlugs(userFound) };
 }
 return { code: 404, message: "pas d article bg" , articles : null};
},

// TO ADD IN ROUTES :
getArticlesFromRubrique : async function getArticlesFromRubrique(rubId){
  if (config.usePostgres) {
    const articles = await withAuthorSlugs(await repos.articles.byRubrique(rubId));
    return { code: 200, message: "Voila les articles bg" , articles };
  }
  const rawData = await readDataFromFile()
  const tab = rawData.articles.filter(arti => arti.rubrique === rubId)
  if(tab){
    return { code: 200, message: "Voila les articles bg" , articles: await withAuthorSlugs(tab) };
  }
  return { code: 404, message: "pas d article bg" , articles : null};
},

//TODO
// TO ADD IN ROUTES :
getArticlesPage : async function getArticlesPage(number){
  if (config.usePostgres) {
    const articles = await withAuthorSlugs(await repos.articles.page(number));
    return { code: 200, message: "Voila les articles bg" , articles };
  }
  const rawData = await readDataFromFile()
  const pageSize = 5
  const startIndex = number*pageSize
  const endIndex = startIndex+pageSize
  const result = rawData.articles.slice(startIndex, endIndex);
  // TODO : On sort comment ? Il faudrait l'envoyer aussi
  return { code: 200, message: "Voila les articles bg" , articles: await withAuthorSlugs(result) };
},
//TODO
getArticleFromName : async function getArticleFromName(name){
  if (config.usePostgres) {
    const articles = await withAuthorSlugs(await repos.articles.searchByTitle(name));
    return { code: 200, message: "Voila les articles bg" , articles };
  }
  const rawData = await readDataFromFile()
  const result = rawData.articles.filter(arto => 
    arto.titreFront
    .toLowerCase() // Convert the article title to lowercase
    .replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
    .includes(name.toLowerCase()) )
    return { code: 200, message: "Voila les articles bg" , articles: await withAuthorSlugs(result) };
  },
  getRecentArticles : async function getRecentArticles(){
    if (config.usePostgres) {
      const article = await withAuthorSlugs(await repos.articles.recent());
      if (article.length) return { code: 200, message: "Voila les articles bg" , article };
      return { code: 404, message: "pas d article bg" , article : null};
    }
    const rawData = await readDataFromFile()
    let userFound = rawData.articles.filter(ar => ar.private === false)
    if(userFound.length){
    userFound = userFound.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
    return { code: 200, message: "Voila les articles bg" , article: await withAuthorSlugs(userFound) };
 }
 return { code: 404, message: "pas d article bg" , article : null};

  }

}

export default articleService