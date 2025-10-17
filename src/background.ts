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

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarize-page',
    title: 'Summarize this page',
    contexts: ['page', 'selection'],
  });
  console.log('[Background] Context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'summarize-page' && tab?.id) {
    console.log('[Background] Summarize page clicked');
    
    try {
      // Open the side panel first
      if (chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
      
      // Send message to content script to extract page content
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractPageContent',
      });
      
      if (response.success) {
        console.log('[Background] Content extracted successfully');
        
        // Send the extracted content to the sidebar
        // We'll broadcast to all extension pages (the sidebar will handle it)
        chrome.runtime.sendMessage({
          action: 'summarizePage',
          data: response.data,
        });
      } else {
        console.error('[Background] Failed to extract content:', response.error);
      }
    } catch (error) {
      console.error('[Background] Error handling context menu click:', error);
    }
  }
});
