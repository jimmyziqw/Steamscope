
import getReviews from './steamScraper.js';
//import showBubbleChart from './dashboard.js';
//const localStorage = require('./userSettings.js')
const NUM_REVIEWS = 10000;
const APP_ID = 570;
const params = {
    numOfTopics: 7,
    query: JSON.stringify({})
};

const path = `steam/${APP_ID}/data?${new URLSearchParams(params)}`
const URI = 'http://127.0.0.1:8080/' + path;

// get review and preprocess
getReviews( APP_ID, NUM_REVIEWS)
    .then(data =>
        data.filter(({ review }) => {
            const wordCount = review.split(' ').length;
            return wordCount > 5 && wordCount < 100;
        })
    )
    .then(data => data.map(
        ({ review, voted_up }) => ({
            review,
            sentiment: voted_up ? 1 : 0
        })
    ))
    .then(data => { console.log(getSizeInBytes(data))})
    //.then(data =>postData(URI, data))
    //.then(showBubbleChart(data))
    .then(data => console.log(data, "print data here"))
    .catch(err => { console.log(err); });

async function postData(uri, postData, init = true) {
    try {
        const response = await fetch(uri, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
        });
        if (!response.ok) {
            throw new Error('Request failed. Returned status: ' + response.status);
        }
        const data = await response.json();
        return data;
        if (init === true) {initTopicModel();}
        //showBubbleChart(data);
    } catch (error) {
        console.error(error);
    }
}

function getSizeInBytes(list) {
    let totalSize = 0;
    list.forEach(obj => {
        const jsonString = JSON.stringify(obj);
        totalSize += new Blob([jsonString], { type: 'application/json' }).size;
    });
    return totalSize;
}
