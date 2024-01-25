import {nanoid } from 'nanoid'
import fs from 'fs'
import crypto from 'crypto'; // Import the Node.js crypto module
import bcrypt from 'bcrypt'
import jsonWebToken   from 'jsonwebtoken'
const jwtSecret = 'SecretKey2LagrafeWesh';
// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
      fs.readFile('data/user.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data/user.json', JSON.stringify(data, null, 2));
}

// Function to calculate SHA-256 hash
async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    // Change to hash TODO
    const hashBuffer = data
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

const userService = {

    //add admin user 
    addAdminUser : async function addAdminUser(user){
        let userToAdd = {}
        if ( "name" in user && "mail" in user && "password" in user){
            // try{
                
                userToAdd = {
                    id : nanoid(),
                    type : 'admin',
                    name : user.name,
                    mail : user.mail,
                    hash : user.password,
                    // TODO
                    mailCheck : true
                }
                //getdb,
                const rawData = await readDataFromFile()
                const data  = rawData
                if(!data.users.find(e => e.mail === userToAdd.mail)){
                  data.users.push(userToAdd);
                  saveToFile(data)
                    return { code: 200, message: "User added" };
                  }   
                else {
                  return { code: 500, message: "Utilisateur déja existant" };

                }
          } else {
              return { error : "Correspond pas a un utilisateur"}
          }
    },
    // Add a user
   addUser : async function addUser(user){
    let userToAdd = {}
    if ( "name" in user && "mail" in user && "password" in user){
        // try{
            
            userToAdd = {
                id : nanoid(),
                type : 'user',
                name : user.name,
                mail : user.mail,
                hash : user.password,
                // TODO
                mailCheck : true
            }
            //getdb,
            const rawData = await readDataFromFile()
            const data  = rawData
            if( ! data.users.find(aa => aa.mail === userToAdd.mail)){
              data.users.push(userToAdd);
              saveToFile(data)
              return { code: 200, message: "User added" };
            } else {
              return { code: 500, message: "User deja existant" };
            }      
} else {
    return { error : "Correspond pas a un utilisateur"}
}
},

//delete a user 
deleteUser : async function deleteUser(id){
    const rawData = await readDataFromFile()
    const index = rawData.users.findIndex(idd => id === idd.id)
    if(index !== -1){
        rawData.users.splice(index,1)
        saveToFile(rawData)
        return { code: 200, message: "User deleted" };
    }
    return { code: 404, message: "User not found" };

},
//modify a user
modifyUser : async function modifyUser(user){
    const rawData = await readDataFromFile()
    const userFound = rawData.users.find(idd => user.id === idd.id)
    if(userFound){
        userFound.name = user.name
        userFound.mail = user.mail
        saveToFile(rawData)            
         return { code: 200, message: "User modified" };
    }
    return { code: 404, message: "User not found" };

},


//GetUser ATTention DTO MDP
getUser : async function getUser(id){
    const rawData = await readDataFromFile()
    const userFound = rawData.users.find(idd => id === idd.id)
    if (userFound) {
      userFound.hash = "Si tu pensais avoir le Hash du mdp, t'es mignon, ça fait des DTO stupides ici";
      return { code :200 , user: userFound, message: "User found" };
    } else {
      return { code : 404 ,user: null, message: "User not found" };
    }
},


//getAllUser Attention DTO mdp
//GetUser ATTention DTO MDP
getAllUser : async function getAllUser(){
  const rawData = await readDataFromFile()
  const userFound = rawData.users
  if(userFound){
      userFound.forEach(user=> user.hash = "Si tu pensais avoir le Hash du mdp, t'es mignon, ça fait des DTO stupides ici")
     return { code: 200, message: "User added" , users : userFound};
 }
 return { code: 404, message: "User not found" , users : null};
},
doUserExists : async function doUserExists(user){
  const rawData = await readDataFromFile()
  const users = rawData.users
  const userFound = users.find((u) => u.mail === user.mail);
  if ((userFound===undefined) || !bcrypt.compareSync(user.password, userFound.hash)) {
    return false
  }
  return  userFound.id
},
generateToken : function generateToken(user){
  const token = jsonWebToken.sign({ userId: user.id }, jwtSecret);
  return token
},
// Middleware to authenticate tokens
authenticateToken : function authenticateToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jsonWebToken.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token is not valid' });
    req.user = user;
    next();
  });
}


}

export default userService