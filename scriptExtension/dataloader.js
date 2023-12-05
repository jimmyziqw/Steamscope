
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
console.log("steamDataloader loaded");
async function getReviewsFromAPI(appid, n, cursor = '*') {
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


 async function updateReviews(appid, n, data, url) {
    const response = await fetch(url);
    
    
    if (response.status == 200) {
        console.log("data received from db!");
        const data = response.json();
        return data;
    } else if (response.status == 202) {
        //console.log(response.json());
        return response.json();
       
    } else if (response.status == 204) {
        
        console.log("data not received from db!");
        let reviewObj;
        if (appid === data.appid) {
            console.log("no scrap")
            return data.reviews
        } else {
            console.log("new scrap");
            reviewObj = await getReviewsFromAPI(appid, n);

            reviewObj.reviews = steamFormatter(reviewObj.reviews);
            loadingProgress("Analyzing reviews ...");
        }
        console.log("posting data..")
        return postData(url, reviewObj.reviews)
    } else {
        console.error("error in GET method, status", response.status);
    } 
    
    
}
async function postData(uri, postData) {
    if (postData.length <= 100) {
        console.log(`Not enough data. Current number: ${postData.length}`);
        return
    }

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
    } catch (error) {
        console.error(error);
    }
}

function steamFormatter(data) {
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