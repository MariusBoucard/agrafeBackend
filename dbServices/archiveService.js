import {nanoid } from 'nanoid'
import fs from 'fs'

// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

function archiveSanityCheck(archive){
    console.log(archive)
    return "titreFront" in archive 
    && "pathPdf" in archive && "pathBack" in archive 
  && "pathCover" in archive && "description" in archive 
    && "date" in archive && "numero" in archive && "lectures" in archive 
}

const archiveService = {

    //add admin user 

    addArchive : async function addArchive(archive){
        let archiveToAdd = {}
        if ( archiveSanityCheck(archive)){
            // try{
                
                archiveToAdd = {
                    id : nanoid(),
                    "titreFront" : archive.titreFront,
                    "description" : archive.description,
                    pathPdf : archive.pathPdf,
                    pathBack : archive.pathBack,
                    pathCover  : archive.pathCover,
                    numero : archive.numero,
                    date : archive.date,
                    lectures : archive.lectures,
                    private : true
                }
                //getdb,
                const rawData = await readDataFromFile()
                console.log(rawData)
                const data  = rawData
                data.archives.push(archiveToAdd);
                saveToFile(data)
                //save 
                console.log("archive adddeedd")
        //     } catch {
        //         console.log("error")
        //         return { error : "Mon soos ça a chié en rajoutant le user"}
        // }
    } else {
        console.log('pas bon')
        return { error : "Correspond pas a un archive"}
    }
    },
  

//delete a user 
deleteArchive : async function deleteArchive(id){
    const rawData = await readDataFromFile()
    
    const index = rawData.archives.findIndex(idd => id === idd.id)
    if(index !== -1){
        console.log(rawData)
        rawData.archives.splice(index,1)
        saveToFile(rawData)
    }
    console.log(index)
},
//modify a user
modifyArchive : async function modifyArchive(archive){
    const rawData = await readDataFromFile()
    const arti = rawData.archives.find(idd => archive.id === idd.id)
    if(arti){
        arti.titreFront = archive.titreFront,
        arti.description = archive.description,
        arti.pathPdf = archive.pathPdf,
        arti.pathBack = archive.pathBack,
        arti.pathCover  = archive.pathCover,
        arti.date = archive.date,
        arti.private = archive.private,
        arti.numero = archive.numero,
        arti.lectures = archive.lectures,
        saveToFile(rawData)
    }
},


//GetUser ATTention DTO MDP
getArchive : async function getArchive(id){
    const rawData = await readDataFromFile()
    const userFound = rawData.archives.find(idd => id === idd.id)
return userFound    
},


//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllArchives : async function getAllArchives(){
  const rawData = await readDataFromFile()
  const userFound = rawData.archives
  if(userFound){
return userFound   
 }
},
}

export default archiveService