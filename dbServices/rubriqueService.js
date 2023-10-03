import {nanoid } from 'nanoid'
import fs from 'fs'

// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data/rubrique.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data/rubrique.json', JSON.stringify(data, null, 2));
}

function rubriqueSanityCheck(rubrique){
    console.log(rubrique)
    return "rubrique" in rubrique 
    && "rubRoute" in rubrique &&
    "description" in rubrique 
  
}

const rubriqueService = {

    //add admin user 

    addARubrique : async function addRubrique(rubrique){
        let rubriqueToAdd = {}
        if ( rubriqueSanityCheck(rubrique)){
            // try{
                
                rubriqueToAdd = {
                    id : nanoid(),
                    "rubrique" : rubrique.rubrique,
                    "description" : rubrique.description,
                    "rubRoute" : rubrique.rubRoute,
                    "nombreArticles" : 0
                }
                //getdb,
                const rawData = await readDataFromFile()
                console.log(rawData)
                const data  = rawData
                data.rubriques.push(rubriqueToAdd);
                saveToFile(data)
                //save 
                console.log("rubrique adddeedd")
        //     } catch {
        //         console.log("error")
        //         return { error : "Mon soos ça a chié en rajoutant le user"}
        // }
    } else {
        console.log('pas bon')
        return { error : "Correspond pas a un rubrique"}
    }
    },
  

//delete a user 
deleteRubrique : async function deleteRubrique(id){
    const rawData = await readDataFromFile()
    
    const index = rawData.rubriques.findIndex(idd => id === idd.id)
    if(index !== -1){
        console.log(rawData)
        rawData.rubriques.splice(index,1)
        saveToFile(rawData)
    }
    console.log(index)
},
//modify a user
modifyRubrique : async function modifyRubrique(rubrique){
    const rawData = await readDataFromFile()
    const arti = rawData.rubriques.find(idd => rubrique.id === idd.id)
    if(arti){
        arti.rubRoute = rubrique.rubRoute,
        arti.description = rubrique.description,
        arti.rubrique = rubrique.rubrique,
        saveToFile(rawData)
    }
},


//GetUser ATTention DTO MDP
getRubrique : async function getRubrique(id){
    const rawData = await readDataFromFile()
    const userFound = rawData.rubriques.find(idd => id === idd.id)
return userFound    
},


//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllRubriques : async function getAllRubriques(){
  const rawData = await readDataFromFile()
  const userFound = rawData.rubriques
  console.log("appelle",userFound)
  if(userFound){
return userFound   
 }
},
}

export default rubriqueService