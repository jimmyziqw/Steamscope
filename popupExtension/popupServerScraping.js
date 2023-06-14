import showBubbleChart from './dashboard.js';
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
function initTopicModel() {
	//init all components
	const button = document.createElement("button");
	button.setAttribute("id", "return-button");
	button.innerHTML = "&larr;"

	const bubbleChart = document.getElementById("bubble-chart");
	const keywordPanel = document.getElementById("keyword-panel");
	bubbleChart.innerHTML = "";
	keywordPanel.innerHTML = "";//init it

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

async function fetchData(uri, init = true) {
	try {
		const response = await fetch(uri);
		if (!response.ok) {
			throw new Error('Request failed. Returned status: ' + response.status);
		}
		const data = await response.json();
		//console.log(data);
		if (init === true) {
			initTopicModel();
		}
		showBubbleChart(data);//call graph function
	} catch (error) {
		console.error(error);
	}
}

function addStylesheet(platform) {
	//add dynamic css
	const linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	linkElement.href = platform + ".css";
	document.head.appendChild(linkElement);
}

function updateInfo(params = {
	numOfTopics: localStorage.getItem('num-of-topics'),
	query: localStorage.getItem('query'),
}) {
	//request topic model data update
	//numOfTopics is currently offline from UI
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		let url = tabs[0].url;

		//find server uri
		const app = getIdByUrl(url);
		const path = `${app.platform}/${app.id}/data?${new URLSearchParams(params)}`
		console.log('path',path)
		const uri = 'http://18.204.203.44:8080/' + path;
		const local = 'http://127.0.0.1:8080/' + path;

		//add custom css
		addStylesheet(app.platform);
		
		//fetch and visualize data
		fetchData(uri);
	})
}

