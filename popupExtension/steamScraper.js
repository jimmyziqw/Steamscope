
async function getReviewsPerRequest(appid, params) {
    const url = `https://store.steampowered.com/appreviews/${appid}`;
    const response = await fetch(url + "?" + new URLSearchParams(params));
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    } else {
        const data = await response.json();  // convert the response to JSON format
        //console.log(data,"await data")
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
    //console.log(reviews, cursor);
    return {reviews, cursor};
}

export default async function updateReviews(appid, n, data) {
    const reviewInCache = data.reviews;
    console.log(data,"data in updateReviews")
    const percToScrapeMore = 0.1;
    // need browser to look up localStorage
    // let newReviews;
    // let cursor;
    let reviewObj;
    if (appid === data.appid) {
        console.log("no scrap")
        return data.reviews
    } //else if (data.reviews.length < n*percToScrapeMore && appid === data.appid) {
        // console.log("scrap more", reviewInCache.length)
        // reviewObj = await getReviews(appid, n - data.reviews.length, data.cursor);
        // //console.log("new reviews", newReviews);
        // reviewObj.reviews = processData(reviewObj.reviews).concat(reviewInCache);
        // //return newReviews

        //}
     else {
        console.log("new scrap");
        reviewObj = await getReviews(appid, n);
        reviewObj.reviews = processData(reviewObj.reviews)
        // localStorage.setItem('data-in-cache', JSON.stringify({
        //     appid,
        //     cursor:reviewObj.cursor,
        //     reviews: reviewObj.reviews 
        // }))
    }
    console.log(reviewObj.reviews)
    return reviewObj.reviews  
}

// function(data) {
     
//      let newData =    data.filter(({ review }) => {
//              const wordCount = review.split(' ').length;
//              //console.log(data,"data before posting");
//              return wordCount > 5 && wordCount < 100;
//          })
     
//         .then(data => data.map(
//             ({ review, voted_up }) => ({
//                 review,
//                 sentiment: voted_up ? 1 : 0
//             })
//         ))
//     return newData;
// }
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