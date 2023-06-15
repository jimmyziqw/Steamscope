import showBubbleChart from './dashboard.js';
import updateReviews from './steamScraper.js';
updateInfo();

function getIdByUrl(url) {
	let id;
	let platform;
	if (url.includes("play.google.com")) {
		const regex = /(?<=id=)[^&]+/;
		id = url.match(regex)[0];
		platform = "google-play";
	} else if (url.includes("store.steampowered.com")) {
		const regex = /(?:\/app\/)(\d+)/;
		id = url.match(regex)[1];
		platform = "steam";
	} else {
		console.log("url not match")
	};
	return {
		id: id,
		platform: platform
	}
}


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
	} catch (error) {
		console.error(error);
	}
}

function initTopicModel() {
	//init all components
	const bubbleChart = document.getElementById("bubble-chart");
	const keywordPanel = document.getElementById("keyword-panel");
	bubbleChart.innerHTML = "";
	keywordPanel.innerHTML = "";

	const container = document.getElementById("title");
	container.innerHTML = "";

	const title = document.createElement("div");
	container.appendChild(title);
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
		console.log(params.query,"query")
		//find server uri
		const app = getIdByUrl(url);
		let searchParams = {
			params: params.numOfTopics,
			query: params.query
		};
		const path = `${app.platform}/${app.id}/data?${new URLSearchParams(searchParams)}`
		const uri = 'http://18.204.203.44:8080/' + path;
		const local = 'http://127.0.0.1:8080/' + path;

		//add custom css
		addStylesheet(app.platform);
	
		const dataInCache = JSON.parse(params.dataInCache);
		console.log(dataInCache.appid, "appid");
		updateReviews(app.id, params.numOfReviews, dataInCache)
		.then(data =>
			postData(local, data))
			.then(responseData => {
				if (Object.keys(JSON.parse(params.query)).length===0) {
					let data = {
						appid: app.id,
						reviews: responseData.reviews
					}
					console.log('responseData', responseData)
					localStorage.setItem('data-in-cache', JSON.stringify(data));
			}
		 	initTopicModel();
		 	showBubbleChart(responseData);
		 })
		.catch(err => { console.log(err); });
	
	})
}

