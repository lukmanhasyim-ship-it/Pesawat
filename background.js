chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-blast' || command === 'pause-blast') {
    chrome.runtime.sendMessage({ action: command });
  }
});
