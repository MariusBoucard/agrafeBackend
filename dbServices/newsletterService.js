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
                const data  = rawData
                data.newsletter.push(userToAdd);
                saveToFile(data)
                return idd
             
    } else {
        return { error : "Correspond pas a une news"}
    }
    },
  

//delete a user 
deleteNewsletter : async function deleteNewsletter(id){
    const rawData = await readDataFromFile()
    const index = rawData.newsletter.findIndex(idd => id === idd.id)
    if(index !== -1){
        rawData.newsletter.splice(index,1)
        //delet the assets :
        saveToFile(rawData)    
    }
},

//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllNewsletter : async function getAllNewsletter(){
  const rawData = await readDataFromFile()
  const userFound = rawData.newsletter
  if(userFound){
return userFound   
 }
}}
export default newsletterService