/**
 * Content script for extracting page content
 * Uses @mozilla/readability to extract main content from web pages
 */

import { Readability } from '@mozilla/readability';

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'extractPageContent') {
    try {
      // Clone the document for Readability (it modifies the DOM)
      const documentClone = document.cloneNode(true) as Document;
      
      // Create a Readability instance
      const reader = new Readability(documentClone);
      
      // Parse the article
      const article = reader.parse();
      
      if (article) {
        sendResponse({
          success: true,
          data: {
            title: article.title || document.title,
            content: article.textContent || '',
            excerpt: article.excerpt || '',
            byline: article.byline || '',
            siteName: article.siteName || new URL(window.location.href).hostname,
            url: window.location.href,
          },
        });
      } else {
        // Fallback: extract basic content if Readability fails
        const fallbackContent = extractFallbackContent();
        sendResponse({
          success: true,
          data: fallbackContent,
        });
      }
    } catch (error) {
      console.error('[Content Script] Error extracting content:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract content',
      });
    }
  }
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

/**
 * Fallback content extraction when Readability fails
 * Extracts basic text from the page
 */
function extractFallbackContent() {
  const title = document.title;
  const url = window.location.href;
  
  // Remove script and style elements
  const clone = document.body.cloneNode(true) as HTMLElement;
  const scripts = clone.getElementsByTagName('script');
  const styles = clone.getElementsByTagName('style');
  
  Array.from(scripts).forEach(script => script.remove());
  Array.from(styles).forEach(style => style.remove());
  
  // Extract text content
  const content = clone.textContent || '';
  
  // Clean up whitespace
  const cleanContent = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  return {
    title,
    content: cleanContent,
    excerpt: cleanContent.slice(0, 200) + '...',
    byline: '',
    siteName: new URL(url).hostname,
    url,
  };
}

console.log('[Content Script] Loaded and ready');
