import {nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'
// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data/newsletter.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data/newsletter.json', JSON.stringify(data, null, 2));
}

function newsletterSanityCheck(news){
    return "username" in news && "mail" in news
}

const newsletterService = {

    //add admin user 

    addNewsletter : async function addNewsletter(user){
        let userToAdd = {}
        console.log(user)
        if ( newsletterSanityCheck(user)){
            // try{
                const idd = nanoid()
                userToAdd = {
                    id :  idd,
                   name : user.username,
                   mail : user.mail
                }
                //getdb,
                const rawData = await readDataFromFile()
                console.log(rawData)
                const data  = rawData
                data.newsletter.push(userToAdd);
                saveToFile(data)
                return idd
             
    } else {
        console.log('pas bon')
        return { error : "Correspond pas a une news"}
    }
    },
  

//delete a user 
deleteNewsletter : async function deleteNewsletter(id){
    const rawData = await readDataFromFile()
    const index = rawData.articles.findIndex(idd => id === idd.id)
    if(index !== -1){
        console.log(rawData)
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
getAllNewsletter : async function getAllNewsletter(){
  const rawData = await readDataFromFile()
  const userFound = rawData.newsletter
  console.log(userFound)
  if(userFound){
return userFound   
 }
}}
export default newsletterService