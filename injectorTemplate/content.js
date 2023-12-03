const currSite = window.location.hostname

if (currSite.includes('store.steampowered.com')) { 
    initTopicModel();
    addStylesheet();
 }

function addStylesheet(){
    var link = document.createElement('link');
    link.href = chrome.runtime.getURL('steam.css'); 
    link.type = 'text/css';
    link.rel = 'stylesheet';
    var head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(link);
}

function initTopicModel() {
    // locate target div element 
    var targetElement = document.querySelector('.block.game_media_and_summary_ctn');
    if (!targetElement){
        console.log("target element not found!");
    }
    
    //clear graph elements when switch radio button
    if (document.getElementById('dashboard')) { 
        document.getElementById("bubble-chart").innerHTML="";
        document.getElementById("keyword-panel").innerHTML="";
        return;
    }
    // Create main grid container
    var gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';
    gridContainer.id = 'dashboard';

    // Create headline section
    var headline = document.createElement('div');
    headline.id = 'headline';
    headline.textContent = "Review Type: ";


    var toolsDiv = document.createElement('div');
    toolsDiv.className = 'tools';
    toolsDiv.id = 'legend-radio-buttons';
    headline.appendChild(toolsDiv);

    // Radio buttons
    var radioButtons = [
        {id: 'voted-down-reviews', label: 'Voted Down ', checked: false},
        {id: 'voted-mixed-reviews', label: 'Mixed ', checked: true},
        {id: 'voted-up-reviews', label: 'Voted Up ', checked: false}
    ];

    radioButtons.forEach(function(btn) {
        var input = document.createElement('input');
        input.type = 'radio';
        input.id = btn.id;
        input.name = 'direction';
        input.value = btn.id;
        input.checked = btn.checked;

        var label = document.createElement('label');
        label.htmlFor = btn.id;
        label.textContent = btn.label;

        toolsDiv.appendChild(input);
        toolsDiv.appendChild(label);
    });

    //gridContainer.appendChild(headline);

    // Create graph containers
    var graphs = [
        {id: 'bubble-chart-container', title: 'Topics', innerId: 'bubble-chart'},
        {id: 'keyword-panel-container', title: 'Keywords', innerId: 'keyword-panel'},
        {id: 'review-panel', title: 'Reviews', innerId: 'review-container'}
    ];

    graphs.forEach(function(graph) {
        var graphContainer = document.createElement('div');
        graphContainer.className = 'graph-container';
        graphContainer.id = graph.id;

        var graphTitle = document.createElement('div');
        graphTitle.className = 'graph-title';
        graphTitle.textContent = graph.title;

        var innerDiv = document.createElement('div');
        innerDiv.className = 'graph';
        innerDiv.id = graph.innerId;

        graphContainer.appendChild(graphTitle);
        graphContainer.appendChild(innerDiv);
        gridContainer.appendChild(graphContainer);
    });
    
    gridContainer.appendChild(headline);
    targetElement.appendChild(gridContainer);
}