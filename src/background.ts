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

// Track pending messages and sidebar readiness
let sidebarReady = false;
let pendingMessages: Array<{ action: string; data?: unknown }> = [];

// Listen for ready signal from sidebar
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'sidebarReady') {
    console.log('[Background] Sidebar is ready');
    sidebarReady = true;

    // Send any pending messages
    if (pendingMessages.length > 0) {
      console.log(`[Background] Sending ${pendingMessages.length} pending messages`);
      pendingMessages.forEach((msg) => {
        chrome.runtime.sendMessage(msg);
      });
      pendingMessages = [];
    }

    sendResponse({ received: true });
  }
});

// Helper function to send message when sidebar is ready
function sendMessageWhenReady(message: { action: string; data?: unknown }): void {
  if (sidebarReady) {
    console.log(`[Background] Sidebar ready, sending message immediately: ${message.action}`);
    chrome.runtime.sendMessage(message);
  } else {
    console.log(`[Background] Sidebar not ready yet, queuing message: ${message.action}`);
    pendingMessages.push(message);
  }
}

// Define rewrite tone options
const REWRITE_TONES = [
  { id: 'concise', label: 'Concise' },
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'engaging', label: 'Engaging' },
  { id: 'simplified', label: 'Simplified' },
  { id: 'technical', label: 'Technical' },
  { id: 'creative', label: 'Creative' },
];

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  // Summarize page menu
  chrome.contextMenus.create({
    id: 'summarize-page',
    title: 'Summarize this page',
    contexts: ['page', 'selection'],
  });

  // Rewrite text parent menu
  chrome.contextMenus.create({
    id: 'rewrite-text',
    title: 'Rewrite text',
    contexts: ['selection'],
  });

  // Rewrite text submenu items for each tone
  REWRITE_TONES.forEach((tone) => {
    chrome.contextMenus.create({
      id: `rewrite-text-${tone.id}`,
      title: tone.label,
      parentId: 'rewrite-text',
      contexts: ['selection'],
    });
  });

  console.log('[Background] Context menus created');
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
        
        // Send the extracted content to the sidebar (will be queued if not ready)
        sendMessageWhenReady({
          action: 'summarizePage',
          data: response.data,
        });

        console.log('[Background] Summarize message queued/sent');
      } else {
        console.error('[Background] Failed to extract content:', response.error);
      }
    } catch (error) {
      console.error('[Background] Error handling context menu click:', error);
    }
  } else if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('rewrite-text-') && tab?.id) {
    const tone = info.menuItemId.replace('rewrite-text-', '');
    const selectedText = info.selectionText;

    console.log(`[Background] Rewrite text clicked with tone: ${tone}`);

    try {
      // Open the side panel first
      if (chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }

      // Send the selected text and tone to the sidebar (will be queued if not ready)
      sendMessageWhenReady({
        action: 'rewriteText',
        data: {
          originalText: selectedText,
          tone: tone,
        },
      });

      console.log(`[Background] Rewrite message queued/sent for tone: ${tone}`);
    } catch (error) {
      console.error('[Background] Error handling rewrite text click:', error);
    }
  }
});
