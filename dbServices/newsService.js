import {nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'
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
                   private : true
                }
                //getdb,
                const rawData = await readDataFromFile()
                const data  = rawData
                data.news.push(newsToAdd);
                saveToFile(data)
                return idd
             
    } else {
        console.log('pas bon')
        return { error : "Correspond pas a une news"}
    }
    },
  privateNews : async function privateNews(id){
    const rawData = await readDataFromFile()
    const found = rawData.news.find(idd => id === idd.id)
    if(found){
      found.private = !found.private
      saveToFile(rawData)
    }
  },

//delete a user 
deleteNews : async function deleteNews(id){
    const rawData = await readDataFromFile()
    const index = rawData.news.findIndex(idd => id === idd.id)
    if(index !== -1){
        rawData.news.splice(index,1)
        saveToFile(rawData)
    }
    console.log(index)
},



//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllNews : async function getAllNews(){
  const rawData = await readDataFromFile()
  const userFound = rawData.news
  console.log(userFound)
  if(userFound){
return userFound   
 }
},
getPublicNews : async function getPublicNews(){
  const rawData = await readDataFromFile()
  const userFound = rawData.news.filter(ne => ne.private === false)
  console.log(userFound)
  if(userFound){
return userFound   
 }
}

}
export default newsService