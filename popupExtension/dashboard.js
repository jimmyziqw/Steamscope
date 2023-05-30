function showBubbleChart(data){
    //name data
    const circleArray = data["bubble-chart-data"]
    const keywordsWeights = data["keyword-weights"]
    const docs = data['reviews'];
    
    const topKeywordPerTopic = keywordsWeights.map(
        topic=>topic.map(
            keywordsFreqPair=>keywordsFreqPair[0]
            )[0]
    )
    console.log(topKeywordPerTopic)
    //canvas 1: tsne visulization
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
        sentimentDomain = Object.keys(circleArray[0].sentiment);
    }
        //const sentimentDomain = Array.from({length: max}, (_, i) => i+1);
        console.log(sentimentDomain)
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
const legendRectSize = 18;
const legendSpacing = 4;
const legend = canvas1.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${0}, ${height-legendRectSize-legendSpacing})`);

const legendItems = legend.selectAll(".legend-item")
  .data(color.domain())
  .join("g")
    .attr("transform", (d, i) => `translate(
        ${i * (legendRectSize + legendSpacing)+legendSpacing},
        ${-height + legendRectSize + legendSpacing})`);

    legendItems.append("rect")
        .attr("width", legendRectSize)
        .attr("height", legendRectSize)
        .attr("class", d=> `slice-${d}`)
        .style("stroke", "transparent");

    legendItems.append("text")
        .attr("x", 5)
        .attr("y", legendRectSize - legendSpacing)
        .text(d => d);
 
    legendItems.on('click', function (event, d) {
        localStorage.setItem("query", JSON.stringify({ sentiment: d }));
        // updateInfo({
        //     numOfTopics:localStorage.
        //   query:JSON.stringify({ sentiment: d })  
        // });
        updateInfo();
    });
    
                    //circles with pie chart
        circles.on('click',function(event, d){
                        console.log(`showing topic ${d.topic_idx}`);
                        d3.selectAll("#histogram").remove();
                        //console.log(docs)
                        showHistogram(d.topic_idx, keywordsWeights, docs);//remove things
                        });
}
//canvas 2: hist: term /topic;
function showHistogram(topic_idx, data, docs){
    var margin = { top: 0, right: 0, bottom: 0, left: 0 }
        console.log(docs);
        var wordsFreqArray = data.map(x=>x.map(y=>y[1]))[topic_idx];
        var topWordsArray = data.map(x=>x.map(y=>y[0]))[topic_idx];
        console.log(wordsFreqArray);
        var canvasWidth = 100; 
        var canvasHeight = 300;
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
        .attr("y", function(d,i){return i*(barHeight+barSpaceHeight)})
        .attr("opacity", 0.5);

    bars.data(topWordsArray)
        .append("text")
        .attr("x", 10)
        .attr("y", function(d,i){return (i+textOffset)*(barHeight+barSpaceHeight)})
        //.attr("text-anchor", "middle")
        .attr("font-size","18px")
        .attr("font-family", "Serif, sans-serif")
        //.attr("stroke","black")
        .text(x=>x);
    
    

    bars.on("click",function(event,d){
        return showRepresentativeDocs(d, topWordsArray, docs)})
        //.catch(function(error) {
       // console.error(error);
        //});
    showRepresentativeDocs(topWordsArray[0], topWordsArray, docs);
    }
//canvas 3: query representative //doc per term relationship
//representaive sentences...
//onclick event on term.  adding to database.. query top sentencess
const parentElement = document.getElementById("review-container");

function showRepresentativeDocs(keyword, topicKeywords, reviews) {
    let docNum = 3
    //const docs = reviews.map(x => x.review);
    const reviewWithKeyword = reviews.filter(x => x.review.includes(keyword));
    //const docWithKeyword = dataWithKeyword.map(x => x.review);

    const docQueried = findTopNDocumentsByDensity(reviewWithKeyword, topicKeywords, "max")
    
    //remove current tags
    if (parentElement !== null) {
        parentElement.innerHTML = "";
    }
    if (docQueried.length >= docNum) {
        //create button,
        //add onclick effect
        //// Get the container element
        const container = document.getElementById('button-container');
        const button = document.createElement('button');
        button.setAttribute("id", "load-more-button");
        button.textContent = 'Load more';
        container.innerHTML = "";
        container.appendChild(button);

        // Add an event listener for the button click
        button.addEventListener('click', () => {
            reviewContainer = document.getElementById("review-container");
            reviewContainer.innerHTML = "";
            maxDocNum += 20;
            showReviews(maxDocNum);
        });

        

    }
    var maxDocNum = Math.min(docNum, docQueried.length);
    showReviews(maxDocNum);
    function showReviews(maxDocNum) {
        for (let i = 0; i < maxDocNum; i++) {
            console.log(i)
    
            const divElement = document.createElement("div");
            //divElement.setAttribute("class", `review`);
            divElement.setAttribute("class", `review slice-${docQueried[i].sentiment}`);
            divElement.innerHTML = highlightDocs(keyword, docQueried[i].review);
           //console.log(divElement)
            parentElement.appendChild(divElement);
        }
        const searchMessage = document.getElementById("search-result");
        searchMessage.innerHTML = `${docQueried.length} reviews found, ${maxDocNum} reviews shown`
        //parentElement.appendChild(searchMessage);
    };
}
function highlightDocs(keywords, text){
// Convert the keywords into a regular expression
    if (Array.isArray(keywords)){
        keywords = keywords.join("|")
        console.log(text)
    } 
    var sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
    console.log(sentences);

    var selectedSentences = sentences.filter(x => x.includes(keywords))
    console.log(selectedSentences)
    var stext = selectedSentences.join('...')

    const regex = new RegExp(keywords, 'gi');
    // Define the replacement pattern with highlighting
    const replacement = `<span>${keywords}</span>`;
    // Highlight the keywords in the text
    const highlightedText = stext.replace(regex, replacement);
    // Display the highlighted text
    return highlightedText
    //filter chrome extension 
}


