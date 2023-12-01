try{

    //ON page change
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        console.log("bg.js init");
      if(changeInfo.status == 'complete'){
      //if (changeInfo.url) {
        console.log("executing injector js")
        chrome.scripting.executeScript({
          files: ["userSettings.js", "steamDataloader.js", "d3.min.js", "dashboard.js",'injector.js'],
          target: {tabId: tab.id}
        });
      //}
      }
    });
  
  
  }catch(e){
    console.log(e);
  }