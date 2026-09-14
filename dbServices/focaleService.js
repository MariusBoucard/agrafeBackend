import { nanoid } from 'nanoid'
import fs from 'fs-extra'
import path from 'path'
import { config } from '../config/env.js';
import * as repos from '../db/repos.js';
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
        if (config.usePostgres) {
            const found = await repos.focale.byId(id);
            if (!found) return { code : 404, message : "Pas trouvé"}
            await repos.focale.remove(id);
            const directoryPath = path.join(path.resolve(),'save','saveFocale',id)
            fs.remove(directoryPath, () => {});
            return { code : 200, message : "C'est kré le s"}
        }
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
        if (config.usePostgres) {
            const found = await repos.focale.byId(id);
            if (found) {
                await repos.focale.togglePrivate(id);
                return { code : 200, message : "public c bon"}
            }
            return { code : 404, message : "public c pas bon"}
        }
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
        if (config.usePostgres) {
            const focales = await repos.focale.all();
            if (focales) return { code : 200, focales }
            return { code : 404, focales : null}
        }
        const data = await readDataFromFile()
        if(data.focale){
            return { code : 200, focales : data.focale}
        }
        return { code : 404, focales : null}
    },
    getFocaleFromId : async function getFocaleFromId(id){
        if (config.usePostgres) {
            const focale = await repos.focale.byId(id);
            if (focale) return { code : 200, focale }
            return { code : 404, focale : null}
        }
        const data = await readDataFromFile()
        const found = data.focale.find(da => da.id === id)
        if(found){
            return { code : 200, focale : found}
        }
        return { code : 404, focale : null}
    },
    getFocaleFromIdPublic : async function getFocaleFromIdPublic(id){
        if (config.usePostgres) {
            const focale = await repos.focale.byId(id);
            if (focale && !focale.private) return { code : 200, focale }
            return { code : 404, focale : null}
        }
        const data = await readDataFromFile()
        const found = data.focale.find(da => da.id === id)
        if(found && !found.private){
            return { code : 200, focale : found}
        }
        return { code : 404, focale : null}
    },
    getFocalePublic : async function getFocalePublic(){
        if (config.usePostgres) {
            const focales = await repos.focale.publicAll();
            if (focales) return { code : 200, focales }
            return { code : 404, focales : null}
        }
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
            if (config.usePostgres) {
                await repos.focale.insert(focaleToAdd);
            } else {
                const data = await readDataFromFile()
                data.focale.push(focaleToAdd)
                saveToFile(data)
            }
            return idd
        }
   }


}

export default focaleService