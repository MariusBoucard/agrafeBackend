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
                const data  = rawData
                data.rubriques.push(rubriqueToAdd);
                saveToFile(data)
                return { code: 200, message: "Rubrique added" };

    } else {
      return { code: 404, message: "Erreur ajout rubrique" };
    }
    },
  

//delete a user 
deleteRubrique : async function deleteRubrique(id){
    const rawData = await readDataFromFile()
    
    const index = rawData.rubriques.findIndex(idd => id === idd.id)
    if(index !== -1){
        rawData.rubriques.splice(index,1)
        saveToFile(rawData)
        return { code: 200, message: "Rubrique deleted" };
    }
    return { code: 404, message: "Rubrique not found" };

},
//modify a user
modifyRubrique : async function modifyRubrique(rubrique){
    const rawData = await readDataFromFile()
    const arti = rawData.rubriques.find(idd => rubrique.id === idd.id)
    if(arti){ 
         arti.rubrique = rubrique.rubrique
        arti.rubRoute = rubrique.rubRoute,
        arti.description = rubrique.description,
        arti.rubrique = rubrique.rubrique,
        saveToFile(rawData)
        return { code: 200, message: "Rubrique Modified" };
    }
    return { code: 404, message: "Rubrique not found" };
},

//GetUser ATTention DTO MDP
getRubrique : async function getRubrique(id){
    const rawData = await readDataFromFile()
    const userFound = rawData.rubriques.find(idd => id === idd.id)
    if(userFound){
      return { code: 200, message: "Rubrique found" , rubrique : userFound};
    }
    return { code: 404, message: "Rubrique not found" , rubrique : null};
  },


//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllRubriques : async function getAllRubriques(){
  const rawData = await readDataFromFile()
  const userFound = rawData.rubriques
    if(userFound){
      return { code: 200, message: "Rubrique found" , rubriques : userFound};
  }
  return { code: 404, message: "Rubriques not found" , rubriques : null};

},
addArticleToRubrique : async function addArticleToRubrique(id){
  const rawData = await readDataFromFile()
  const userFound = rawData.rubriques
  const found = userFound.find(rub => rub.id === id)
  if(found){
    found.nombreArticles +=1
    saveToFile(rawData)
    return { code: 200, message: "article added to rubrique" };
  }
  return { code: 404, message: "article not added to rubrique" };
},
removeArticleFromRubrique : async function removeArticleFromRubrique(id){
  const rawData = await readDataFromFile()
  const userFound = rawData.rubriques
  const found = userFound.find(rub => rub.id === id)
  if(found){
    found.nombreArticles -=1
    saveToFile(rawData)
    return { code: 200, message: "article deleted" };

  }
  return { code: 404, message: "article not deleted" };

}
}

export default rubriqueService