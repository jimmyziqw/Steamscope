chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
      try {
          chrome.scripting.executeScript({
              files: ["settings.js", "dataloader.js", "d3.min.js", "dashboard.js", "injector.js"],
              target: {tabId: tab.id}
          }, (result) => {
              // Handle any results or errors from the script execution
          });
      } catch(e) {
          console.error('Error executing scripts:', e);
      }
  }
});