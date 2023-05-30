function countDistinctKeywords(doc, keywords) {
    let count = 0;
    console.log(doc, keywords);
    keywords.forEach((keyword) => {
        if (doc.includes(keyword)) {
            count++;
        }
    });
    return count;
}

function countWords(review) {
    return review.trim().split(/\s+/).length;
}

function keywordDensity(doc, keywords) {
    const distinctKeywordsCount = countDistinctKeywords(doc, keywords);
    const wordCount = countWords(doc);
    return distinctKeywordsCount / wordCount**0.2;
}

function findTopNDocumentsByDensity(documents, keywords, n) {
    // Calculate keyword density for each document
    const documentsWithKeywordDensity = documents.map((doc) => ({
        review:doc.review,
        sentiment:doc.sentiment,
        keywordDensity: keywordDensity(doc.review, keywords),
    }));

    // Sort documents by keyword density in descending order
    const sortedDocuments = documentsWithKeywordDensity.sort(
        (a, b) => b.keywordDensity - a.keywordDensity
    );

    // Return top n documents
    return sortedDocuments;
}


