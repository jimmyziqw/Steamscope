try{
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if(changeInfo.status == 'complete'){
        console.log("executing injector js")
        chrome.scripting.executeScript({
          files: ["settings.js", "dataloader.js", "d3.min.js", "dashboard.js", "injector.js"],
          target: {tabId: tab.id}
        });
      }
    });
  }catch(e){
    console.log(e);
  }