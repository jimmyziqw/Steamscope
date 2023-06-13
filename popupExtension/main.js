const getReviews = require('./steamScraper.js');
//const localStorage = require('./userSettings.js')
const NUM_REVIEWS = 300;
const APP_ID = 570;
const params = {
    numOfTopics: 7,
    query: JSON.stringify({})
};

const path = `steam/${APP_ID}/data?${new URLSearchParams(params)}`
const URI = 'http://127.0.0.1:8080/' + path;

// get review and preprocess
getReviews(NUM_REVIEWS, APP_ID)
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
    //.then(mappedData => console.log(NUM_REVIEWS, mappedData.length))
    //.then(data=> console.log(data,1))
    .then(data => postData(URI, data, init = false))
    .then(data => console.log(data))
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
