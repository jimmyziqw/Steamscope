import updateInfo from './popup2.js'
export default function showBubbleChart(data) {
    //load data for three panels
    const circleArray = data["bubble-chart-data"]
    const keywordsWeights = data["keyword-weights"]
    const docs = data['reviews'];
    

    const topKeywordPerTopic = keywordsWeights.map(
        topic=>topic.map(
            keywordsFreqPair=>keywordsFreqPair[0]
            )[0]
    )

    //component 1: tsne visulization
    const width = 300;
    const height = 300;
    const margin = 30;
    const minRadius =0.05;

    const cx = [...circleArray.map(d=>d.x+d.r),...circleArray.map(d=>d.x-d.r)];
    const cy = [...circleArray.map(d=>d.y+d.r),...circleArray.map(d=>d.y-d.r)];
    const xScale = d3.scaleLinear()
            .domain([Math.min(...cx),Math.max(...cx)])
            .range([0+margin, width-margin]);
    const yScale = d3.scaleLinear()
            .domain([Math.min(...cy),Math.max(...cy)])
            .range([0+margin, height-margin]);
    

    const canvas1 = d3.select("#bubble-chart").append("svg").attr("width", width).attr("height", height);
    var circles = canvas1.selectAll("g")
                    .data(circleArray)
                    .enter()
                    .append("g")
                    .attr("transform", d=>`translate(${xScale(d.x)},${yScale(d.y)})`);
    circles.append("circle")
        .attr("r", d=>d.r+minRadius)
        .attr("fill","blue")
        .attr("class","donut-center"); 
    circles.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em")
        .text((d, i) => topKeywordPerTopic[i])
        .attr("transform", d => `translate(${0},${-d.r})`);
                      

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
            
        //color range
    const sentiments = circleArray.map(x=>Object.keys(x.sentiment).length);
    const maxScore = Math.max(...sentiments)
    let sentimentDomain;
    if (maxScore == 2) {
        sentimentDomain = [0, 1];
    } else if (maxScore ==5) {
        sentimentDomain = [1, 2, 3, 4, 5];
    } else if (maxScore ==1) {
        sentimentDomain = Object.keys(circleArray[0].sentiment).concat(["-1"]);

    }
  
    
        const color = d3.scaleOrdinal()
        .domain(sentimentDomain)
        .range(d3.schemeCategory10);
    
        const pieGroups = canvas1.selectAll(".pie-group")
  .data(circleArray)
  .join("g")
  .attr("class", "pie-group")
  .attr("transform", d=>`translate(${xScale(d.x)},${yScale(d.y)})`);

  

pieGroups.each(function(d) {

    const arcGenerator = d3.arc()
        .innerRadius((d.r+minRadius) * Math.min(width, height)-10)
        .outerRadius((d.r+minRadius) * Math.min(width, height));

    const pieData = pie(Object.entries(d.sentiment).map(([key, value]) => ({ label: key, value })));

    d3.select(this).selectAll("path")
        .data(pieData)
        .join("path")
        .attr("d", arcGenerator)
        .attr("class", d=> `slice-${d.data.label}`)
});
       
    showHistogram(0, keywordsWeights, docs);     


//---legend---
    document.getElementById('legend-radio-buttons').addEventListener('change', function (event) {
        let value = event.target.value;
        // Your logic for each legend goes here
        if (value === "mixed") {
            localStorage.setItem("query", JSON.stringify({}));
        } else if (value === "up") {
            localStorage.setItem("query", JSON.stringify({ sentiment: 1 }));
        } else {
            localStorage.setItem("query", JSON.stringify({ sentiment: 0 }));
        }
        updateInfo();
    });
    
    pieGroups.append("circle")
        .attr("r", d => (d.r + minRadius) * Math.min(width, height)) // Use the same radius as your pie chart
        .attr("fill", "transparent") // Make the circle transparent
        .style("cursor", "pointer") // Change the cursor style when hovering over the circle
        .on("click", function (event, d) {
            //console.log(`showing topic ${d.topic_idx}`);
            d3.selectAll("#histogram").remove();
            showHistogram(d.topic_idx, keywordsWeights, docs);
        });
    
}
//canvas 2: histogram: word per topic;
function showHistogram(topic_idx, data, docs){
    //console.log(docs);
    var wordsFreqArray = data.map(x=>x.map(y=>y[1]))[topic_idx];
    var topWordsArray = data.map(x=>x.map(y=>y[0]))[topic_idx];
    //console.log(wordsFreqArray);
    var canvasWidth = 100; 
    var canvasHeight = 300;
    const histTopMargin = 10;
    var barHeight = 18;
    var barSpaceHeight = 6;
    var textOffset =0.5;
    var canvas2 = d3.select("#keyword-panel")
                .append("svg")
                .attr('id','histogram')
                .attr("width", canvasWidth)
                .attr("height", canvasHeight)
                .style('fill',"transparent");
        var xScale = d3.scaleLinear()
                        .domain([0, d3.max(wordsFreqArray)])
                        .range([0, canvasWidth]);

        var bars = canvas2.selectAll("g")
                    .data(wordsFreqArray)
                    .enter()
                        .append("g");
    bars.append("rect")
        .attr("width", function(d){return xScale(d)})
        .attr("height", barHeight)
        .attr("y", function(d,i){return histTopMargin+i*(barHeight+barSpaceHeight)})
        .attr("opacity", 0.5);

    bars.data(topWordsArray)
        .append("text")
        .attr("x", 10)
        .attr("y", function(d,i){return histTopMargin+(i+textOffset)*(barHeight+barSpaceHeight)})
        .attr("font-size","18px")
        .attr("font-family", "Serif, sans-serif")
        .text(x=>x);
    
    bars.on("click",function(event,d){
        return showRepresentativeDocs(d, topWordsArray, docs)})

    showRepresentativeDocs(topWordsArray[0], topWordsArray, docs);
}
    
//canvas 3: query representative 
const parentElement = document.getElementById("review-container");

function showRepresentativeDocs(keyword, topicKeywords, reviews) {
    const reviewWithKeyword = reviews.filter(x => x.review.includes(keyword));
    const docQueried = findTopNDocumentsByDensity(reviewWithKeyword, topicKeywords, "max")
    
    //remove current tags
    if (parentElement !== null) {
        parentElement.innerHTML = "";
    }
    
    var maxDocNum = Math.min(50, docQueried.length);
    showReviews(maxDocNum);
    function showReviews(maxDocNum) {
        for (let i = 0; i < maxDocNum; i++) {
            //console.log(i)
    
            const divElement = document.createElement("div");
            divElement.setAttribute("class", `review slice-${docQueried[i].sentiment}`);
            divElement.innerHTML = highlightDocs(keyword, docQueried[i].review);
            parentElement.appendChild(divElement);
        }
        const searchMessage = document.getElementById("search-result");
        searchMessage.innerHTML = `${docQueried.length} reviews found`
    };
}
function highlightDocs(keywords, text){
//  keywords conversion with regular expression
    if (Array.isArray(keywords)){
        keywords = keywords.join("|")
        //console.log(text)
    } 
    var sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    //console.log(sentences);

    var selectedSentences = sentences.filter(x => x.includes(keywords))
    //console.log(selectedSentences)
    var stext = selectedSentences.join('...')

    const regex = new RegExp(keywords, 'gi');
    const replacement = `<span>${keywords}</span>`;
    const highlightedText = stext.replace(regex, replacement);
    return highlightedText
}


function countDistinctKeywords(doc, keywords) {
    let count = 0;
    //console.log(doc, keywords);
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
    return distinctKeywordsCount / wordCount ** 0.2;
}

function findTopNDocumentsByDensity(documents, keywords, n) {
    // Calculate keyword density for each document
    const documentsWithKeywordDensity = documents.map((doc) => ({
        review: doc.review,
        sentiment: doc.sentiment,
        keywordDensity: keywordDensity(doc.review, keywords),
    }));

    // Sort documents by keyword density in descending order
    const sortedDocuments = documentsWithKeywordDensity.sort(
        (a, b) => b.keywordDensity - a.keywordDensity
    );

    // Return top n documents
    return sortedDocuments;
}

function forceDirectedGraph() {
    //add rebel force between bubbles to avoid overlap
}