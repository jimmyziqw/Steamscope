import showBubbleChart from './dashboard.js';
import getReviews from './steamScraper.js';
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



//const localStorage = require('./userSettings.js')
// const NUM_REVIEWS = 300;
// const APP_ID = 570;
// const params = {
// 	numOfTopics: 7,
// 	query: JSON.stringify({})
// };

// const path = `steam/${APP_ID}/data?${new URLSearchParams(params)}`
// const URI = 'http://127.0.0.1:8080/' + path;

// get review and preprocess


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
		//if (init === true) {initTopicModel();}
		//showBubbleChart(data);
	} catch (error) {
		console.error(error);
	}
}

function initTopicModel() {
	//init all components
	const button = document.createElement("button");
	button.setAttribute("id", "return-button");
	button.innerHTML = "&larr;"

	const bubbleChart = document.getElementById("bubble-chart");
	const keywordPanel = document.getElementById("keyword-panel");
	bubbleChart.innerHTML = "";
	keywordPanel.innerHTML = "";

	const container = document.getElementById("title");
	container.innerHTML = "";

	const title = document.createElement("div");
	container.appendChild(button);
	container.appendChild(title);

	//back to mixed sentiments
	button.addEventListener("click", function () {
		localStorage.setItem("query", JSON.stringify({}));
		updateInfo();
	})
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
	query: localStorage.getItem('query'),
}) {
	//request topic model data update
	//numOfTopics is currently offline from UI
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		let url = tabs[0].url;
		console.log(params.query,"query")
		//find server uri
		const app = getIdByUrl(url);
		const path = `${app.platform}/${app.id}/data?${new URLSearchParams(params)}`
		const uri = 'http://18.204.203.44:8080/' + path;
		const local = 'http://127.0.0.1:8080/' + path;

		//add custom css
		addStylesheet(app.platform);
		

	getReviews(app.id, 1000)
		.then(data =>
			data.filter(({ review }) => {
				const wordCount = review.split(' ').length;
				//console.log(data,"data before posting");
				return wordCount > 5 && wordCount < 100;
			})
		)
		.then(data => data.map(
			({ review, voted_up }) => ({
				review,
				sentiment: voted_up ? 1 : 0
			})
		))
		.then(data =>
			postData(local, data))
		.then(data => {
			initTopicModel();
			showBubbleChart(data);
		})
		//.then(data => console.log(data[0]))
		.catch(err => { console.log(err); });
	
	})
}

