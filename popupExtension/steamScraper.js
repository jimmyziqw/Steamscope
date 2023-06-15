
async function getReviewsPerRequest(appid, params) {
    const url = `https://store.steampowered.com/appreviews/${appid}`;
    const response = await fetch(url + "?" + new URLSearchParams(params));
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    } else {
        const data = await response.json();  // convert the response to JSON format
        return data;
    }
   
}

async function getReviews(appid, n, cursor = '*') {
    let reviews = [];
    let params = {
        json: 1,
        filter: 'recent',
        language: 'english',
        day_range: '',
        review_type: 'all',
        purchase_type: 'all',
    };
    let numRequests = Math.floor(n / 100) + 1;

    for (let idx = 0; idx < numRequests; idx++) {
        params.cursor = cursor;

        if (idx === numRequests - 1) {
            params.num_per_page = n % 100;
        } else {
            params.num_per_page = 100;
        }
        const response = await getReviewsPerRequest(appid, params);
        
        if (response.cursor) {
            cursor = response.cursor;
        } else {
            console.warn("no cursor in response", response);
            break;
        }
        reviews = reviews.concat(response.reviews);
    }
    return {reviews, cursor};
}

export default async function updateReviews(appid, n, data) {
    let reviewObj;
    if (appid === data.appid) {
        console.log("no scrap")
        return data.reviews
    } else {
        console.log("new scrap");
        reviewObj = await getReviews(appid, n);
        reviewObj.reviews = processData(reviewObj.reviews)
    }
    console.log(reviewObj.reviews)
    return reviewObj.reviews  
}


function processData(data) {
    let newData = data
        .filter(({ review }) => {
            const wordCount = review.split(' ').length;
            return wordCount > 5 && wordCount < 100;
        })
        .map(({ review, voted_up }) => ({
            review,
            sentiment: voted_up ? 1 : 0
        }));

    return newData;
}