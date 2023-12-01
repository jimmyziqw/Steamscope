import showBubbleChart from './dashboard.js';
import updateReviews from './steamDataloader.js';

updateInfo();

function getIdByUrl(url) {
	let appid;
	let pattern = /https:\/\/store\.steampowered\.com\/app\/(\d+)\/([\w\d]+)/;
	let match = url.match(pattern);
	if (match) {
		appid = match[1];
		let name = match[2];
		console.log("Successfully find appid.")
		return {
			id: appid,
			platform: "steam"
		};
	} else if (!match && url.includes("store.steampowered.com")) {
		console.log("Not in app page")
		showErrorMessage("Please navigate to an app page");	
		return
	} else {
		console.log("URL does not match the pattern, page to steam");
		chrome.tabs.create({ url: "https://store.steampowered.com" })
		return ;
	}
}

function showErrorMessage(message) {
	const loadingScreen = document.getElementById("loading");
	loadingScreen.innerHTML = message;	
}


function initTopicModel() {
	//init all components
	const bubbleChart = document.getElementById("bubble-chart");
	const keywordPanel = document.getElementById("keyword-panel");
	bubbleChart.innerHTML = "";
	keywordPanel.innerHTML = "";

	const loadingScreen = document.getElementById("loading");
	loadingScreen.style.display = "none";

 }

function addStylesheet(platform) {
	//add dynamic css
	const linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	linkElement.href = platform + ".css";
	document.head.appendChild(linkElement);
}

export default function updateInfo(params = {
	numOfTopics: localStorage.getItem('num-of-topics'),
	numOfReviews: localStorage.getItem('num-of-reviews'),
	query: localStorage.getItem('query'),
	dataInCache: localStorage.getItem('data-in-cache')
}) {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		let url = tabs[0].url;
		console.log(params.query, "query")
		
		//find server uri
		const app = getIdByUrl(url);
		let searchParams = {
			params: params.numOfTopics,
			query: params.query
		};
		const path = `${app.platform}/${app.id}/data?${new URLSearchParams(searchParams)}`
		const URI = 'https://www.steamscope.net/' + path;
		const LOCAL = 'http://127.0.0.1:8080/' + path;

		//add custom css
		addStylesheet(app.platform);
		const dataInCache = JSON.parse(params.dataInCache);
		
		//GET data from DB; If not present then GET from API then POST data
		console.log("")
		updateReviews(app.id, params.numOfReviews, dataInCache,url=URI)
		// SET PORT HERE
			.then(responseData => {
				if ("reviews" in responseData) {
					if (Object.keys(JSON.parse(params.query)).length === 0) {
					
						let data = {
							appid: app.id,
							reviews: responseData.reviews
						}
						console.log('responseData', responseData)
						localStorage.setItem('data-in-cache', JSON.stringify(data));
					}
					initTopicModel();
					showBubbleChart(responseData);
				} else if ("errorMessage" in responseData) {
	
					showErrorMessage(responseData.errorMessage);
				}
		 })
		.catch(err => { console.log(err); });
	
	})
}

