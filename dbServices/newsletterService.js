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
    return "name" in news && "mail" in news
}

const newsletterService = {

    //add admin user 

    addNewsletter : async function addNewsletter(user){
        let userToAdd = {}
        if ( newsletterSanityCheck(user)){
            // try{
                userToAdd = {
                   name : user.username,
                   mail : user.mail
                }
                //getdb,
                const rawData = await readDataFromFile()
                const data  = rawData
                data.newsletter.push(userToAdd);
                saveToFile(data)
                return { code: 200, message: "newsletters added" , newsletter : userToAdd};
             
    } else {
      return { code: 404, message: "newsletters not added" , newsletter : null};
    }
    },
  

//delete a user 
deleteNewsletter : async function deleteNewsletter(mail){
    const rawData = await readDataFromFile()
    const index = rawData.newsletter.findIndex(user => mail === user.mail)
    if(index !== -1){
        rawData.newsletter.splice(index,1)
        //delet the assets :
        saveToFile(rawData)  
        return { code: 200, message: "mail deleted" };
    }
    return { code: 406, message: "mail not found"};

},

//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllNewsletter : async function getAllNewsletter(){
  const rawData = await readDataFromFile()
  const userFound = rawData.newsletter
  if(userFound){
return { code: 200, message: "Voila toutes les newsletters" , newsletter : userFound};

 } else {
  return { code: 404, message: "news not found" , newsletter : null};

 }
}}
export default newsletterService