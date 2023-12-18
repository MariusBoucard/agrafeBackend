import { nanoid } from 'nanoid'
import fs from 'fs-extra'
import path from 'path'
// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile('data/focale.json', 'utf8', (err, data) => {
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

function saveToFile(data) {
    fs.writeFileSync('data/focale.json', JSON.stringify(data, null, 2));
}
//TODO
function focaleSanityCheck(focale){
    return true
}
//TODO
function imgSanityCheck(focale){
    return true
}

const focaleService = {
    deleteFocale : async function deleteFocale(id){
        const data = await readDataFromFile()
        console.log(id)
        const found = data.focale.find(da => da.id === id)
        console.log("deleted")

        if(found){
            data.focale = data.focale.filter(da => da.id !== id)
            saveToFile(data)
            const directoryPath = path.join(path.resolve(),'save','saveFocale',id)
            fs.remove(directoryPath, (err) => {
                if (err) {
                  console.error('Error removing directory:', err);
                } else {
                  console.log('Directory removed successfully');
                }
              });
            return { code : 200, message : "C'est kré le s"}
        }
        return { code : 404, message : "Pas trouvé"}

    },
    publicFocale : async function publicFocale(id){
        const data = await readDataFromFile()
        const found = data.focale.find(da => da.id === id)
        if(found){
            found.private = !found.private
            saveToFile(data)
            return { code : 200, message : "public c bon"}
        }
        return { code : 404, message : "public c pas bon"}
    },
    getFocale : async function getFocale(){
        const data = await readDataFromFile()
        if(data.focale){
            return { code : 200, focales : data.focale}
        }
        return { code : 404, focales : null}
    },
    getFocaleFromId : async function getFocaleFromId(id){
        const data = await readDataFromFile()
        const found = data.focale.find(da => da.id === id)
        if(found){
            return { code : 200, focale : found}
        }
        return { code : 404, focale : null}
    },
    getFocaleFromIdPublic : async function getFocaleFromIdPublic(id){
        const data = await readDataFromFile()
        const found = data.focale.find(da => da.id === id)
        if(found && !found.private){
            return { code : 200, focale : found}
        }
        return { code : 404, focale : null}
    },
    getFocalePublic : async function getFocalePublic(){
        const data = await readDataFromFile()
        const found = data.focale.filter(da => !da.private)
        if(found){
            return { code : 200, focales : found}
        }
        return { code : 404, focales : null}
    },
   addToFocale : async function addToFocale(focale){
        if(focaleSanityCheck(focale)){
            const idd = nanoid()
            var focaleToAdd = {
                id : idd,
                titre : focale.titre,
                numero : focale.numero,
                description : focale.description,
                auteur : focale.auteur,
                technique : focale.technique,
                date : focale.date,
                private : true,
            }
           console.log(focaleToAdd)
            const data = await readDataFromFile()
            data.focale.push(focaleToAdd)
            saveToFile(data)
            return idd
        }
   }


}

export default focaleService