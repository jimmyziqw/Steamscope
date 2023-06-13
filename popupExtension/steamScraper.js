const axios = require('axios');

async function getReviewsPerRequest(appid, params) {
    const url = `https://store.steampowered.com/appreviews/${appid}`;
    const response = await axios.get(url, { params: params });
    return response.data;
}

async function getReviews(appid, n) {
    let reviews = [];
    let params = {
        json: 1,
        filter: 'recent',
        language: 'english',
        day_range: '',
        review_type: 'all',
        purchase_type: 'all',
    };
    let cursor = '*';
    let numRequests = Math.floor(n / 100) + 1;

    for (let idx = 0; idx < numRequests; idx++) {
        params.cursor = cursor;
        if (idx === numRequests - 1) {
            params.num_per_page = n % 100;
        } else {
            params.num_per_page = 100;
        }
        const response = await getReviewsPerRequest(appid, params);
        cursor = response.cursor;
        reviews = reviews.concat(response.reviews);
    }
    return reviews;
}


module.exports = getReviews;
