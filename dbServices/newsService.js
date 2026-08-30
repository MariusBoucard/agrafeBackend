import {nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'
import { config } from '../config/env.js';
import * as repos from '../db/repos.js';
// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data/news.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data/news.json', JSON.stringify(data, null, 2));
}

function newsSanityCheck(news){
    return "titre" in news && "description" in news
}

const newsService = {

    //add admin user 

    addNews : async function addNews(news){
        let newsToAdd = {}
        if ( newsSanityCheck(news)){
            // try{
                const idd = nanoid()
                newsToAdd = {
                    id :  idd,
                   "titre" : news.titre,
                   date: news.date,
                   description : news.description,
                   // Un bandeau doit être public pour s'afficher sur le site
                   private : news.is_banner ? false : true,
                   is_banner: news.is_banner ?? false,
                   banner_text: news.banner_text || news.titre,
                   starts_at: news.starts_at || null,
                   expires_at: news.expires_at || null,
                }
                //getdb,
                if (config.usePostgres) {
                  await repos.news.insert(newsToAdd);
                } else {
                  const rawData = await readDataFromFile()
                  const data  = rawData
                  data.news.push(newsToAdd);
                  saveToFile(data)
                }
                return { code: 200, message: "news added" , news : newsToAdd};
             
    } else {
      return { code: 404, message: "news pas ajoutée" , news : null};
    }
    },
  privateNews : async function privateNews(id){
    if (config.usePostgres) {
      const news = await repos.news.byId(id);
      if (news) {
        await repos.news.togglePrivate(id);
        return { code: 200, message: "news passed private" };
      }
      return { code: 404, message: "news pas passed private" };
    }
    const rawData = await readDataFromFile()
    const found = rawData.news.find(idd => id === idd.id)
    if(found){
      found.private = !found.private
      saveToFile(rawData)
      return { code: 200, message: "news passed private" };
    }
    return { code: 404, message: "news pas passed private" };

  },

//delete a user 
deleteNews : async function deleteNews(id){
    if (config.usePostgres) {
      const news = await repos.news.byId(id);
      if (news) {
        await repos.news.remove(id);
        return { code: 200, message: "news deleted" };
      }
      return { code: 404, message: "news not found" };
    }
    const rawData = await readDataFromFile()
    const index = rawData.news.findIndex(idd => id === idd.id)
    if(index !== -1){
        rawData.news.splice(index,1)
        saveToFile(rawData)
        return { code: 200, message: "news deleted" };

    }
    return { code: 404, message: "news not found" };

},



//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllNews : async function getAllNews(){
  if (config.usePostgres) {
    const news = await repos.news.all();
    return { code: 200, message: "news found", news };
  }
  const rawData = await readDataFromFile()
  const userFound = rawData.news
  if(userFound){
    return { code: 200, message: "news found", news : userFound };
 }
 return { code: 404, message: "news not found", news : null };

},
getPublicNews : async function getPublicNews(){
  if (config.usePostgres) {
    const news = await repos.news.publicAll();
    if (news.length) return { code: 200, message: "news found", news };
    return { code: 404, message: "news not found", news : null };
  }
  const rawData = await readDataFromFile()
  const userFound = rawData.news.filter(ne => ne.private === false)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  if(userFound.length){
    return { code: 200, message: "news found", news : userFound };
 }
 return { code: 404, message: "news not found", news : null };

},

getActiveBanner: async function getActiveBanner() {
  if (config.usePostgres) {
    return { code: 200, banner: await repos.news.activeBanner() };
  }
  const rawData = await readDataFromFile();
  const now = new Date();
  const banner = rawData.news.find((n) => {
    if (!n.is_banner || n.private) return false;
    if (n.starts_at && new Date(n.starts_at) > now) return false;
    if (n.expires_at && new Date(n.expires_at) < now) return false;
    return true;
  });
  return { code: 200, banner: banner || null };
},

expireBanners: async function expireBanners() {
  if (config.usePostgres) {
    await repos.news.expireBanners();
    return;
  }
  const rawData = await readDataFromFile();
  const now = new Date();
  let changed = false;
  rawData.news.forEach((n) => {
    if (n.is_banner && n.expires_at && new Date(n.expires_at) < now && !n.private) {
      n.private = true;
      changed = true;
    }
  });
  if (changed) saveToFile(rawData);
}

}
export default newsService