import { nanoid } from 'nanoid'
import fs from 'fs'

// Function to read the JSON file
function readDataFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile('data/lectures.json', 'utf8', (err, data) => {
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
function readArticleData() {
    return new Promise((resolve, reject) => {
        fs.readFile('data/article.json', 'utf8', (err, data) => {
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
    fs.writeFileSync('data/lectures.json', JSON.stringify(data, null, 2));
}



const lectureService = {
    updateLectures: async function updateLectures() {
        const articleData = await readArticleData()
        let allReads = 0
        articleData.articles.forEach(art => allReads += art.lectures)

        const lectures = await readDataFromFile()
        const currentDate = new Date();
        // Extract day, month, and year components
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1; // Note: Months are zero-based, so add 1
        const year = currentDate.getFullYear();

        // Format the date as "day/month/year"
        const formattedDate = `${day}/${month}/${year}`;
        lectures.lectures.push(
            {
                "date": formattedDate,
                "lectures": allReads
            }
        )
        saveToFile(lectures)
    },
    getLectures :  async function getLectures() {
        const lectures = await readDataFromFile()
        const lastFiveElements = lectures.lectures.slice(-6);
        return lastFiveElements
    }

}

export default lectureService