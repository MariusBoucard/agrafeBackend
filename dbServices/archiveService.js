import {nanoid } from 'nanoid'
import fs from 'fs'
import { PDFDocument } from 'pdf-lib';

import pdf2img from 'pdf-img-convert'
import  path from 'path'
// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data/archive.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data/archive.json', JSON.stringify(data, null, 2));
}

function archiveSanityCheck(archive){
    console.log(archive)
    return "titre" in archive 
   && "description" in archive 
    && "date" in archive && "numero" in archive 
  }

const archiveService = {

    //add admin user 

    addArchive : async function addArchive(archive){
        let archiveToAdd = {}
        if ( archiveSanityCheck(archive)){
            // try{
                const idd = nanoid()
                archiveToAdd = {
                    id : idd,
                    titre : archive.titre,
                    description : archive.description,
                    numero : archive.numero,
                    date : archive.date,
                    lectures : 0,
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
                return idd
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
        arti.titre = archive.titre,
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

privateArchive : async function privateArchive(id){
  const rawData = await readDataFromFile()
  const userFound = rawData.archives.find(idd => id === idd.id)
  userFound.private = ! userFound.private
  saveToFile(rawData)
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
extractPdf : async function extractPdf(filename) {
  try {
    // Read the PDF file
    const pdfPath = path.join(path.resolve(), 'save', 'saveArchive', 'pdf', filename);
    var outputImages = pdf2img.convert(pdfPath+".pdf");
    const coverPath = path.join(path.resolve(), 'save', 'saveArchive', 'cover', filename+".png");
    const backPath = path.join(path.resolve(), 'save', 'saveArchive', 'back', filename+".png");

outputImages.then(function(outputImages) {
  fs.writeFile(coverPath, outputImages[0], function (error) {
    if (error) { console.error("Error: " + error); }
  });
  fs.writeFile(backPath, outputImages[outputImages.length-1], function (error) {
    if (error) { console.error("Error: " + error); }
  });
});
  
    console.log('Images extracted and saved successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}
}

export default archiveService