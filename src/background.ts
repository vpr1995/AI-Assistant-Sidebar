// background.ts - bundled background service worker for the extension
// Use chrome.* APIs; @types/chrome provides types in the dev environment

chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });

// Listen for action click to open side panel (compat fallback)
chrome.action?.onClicked?.addListener((tab) => {
  // Attempt to open the side panel for the current tab (manifest declares side_panel.default_path -> index.html)
  if (chrome.sidePanel && chrome.sidePanel.open && tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
