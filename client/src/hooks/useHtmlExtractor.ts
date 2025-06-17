export const useHtmlExtractor = () => {
  const extractHtml = async (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      if (chrome && chrome.tabs && chrome.scripting) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.id) {
            chrome.scripting.executeScript(
              {
                target: { tabId: activeTab.id },
                func: () => document.documentElement.outerHTML,
              },
              (injectionResults) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Error injecting script for HTML extraction:",
                    chrome.runtime.lastError.message
                  );
                  reject(
                    new Error(
                      `Failed to extract HTML: ${chrome.runtime.lastError.message}`
                    )
                  );
                  return;
                }
                if (
                  injectionResults &&
                  injectionResults[0] &&
                  injectionResults[0].result
                ) {
                  resolve(injectionResults[0].result as string);
                } else {
                  reject(new Error("Could not extract HTML from the page."));
                }
              }
            );
          } else {
            reject(new Error("No active tab found."));
          }
        });
      } else {
        // Fallback for development (optional, or reject)
        console.warn(
          "Chrome tabs API not available. HTML extraction skipped in dev."
        );
        // Simulating an error or empty HTML string for dev if not handled by caller
        // reject(new Error("Chrome API not available for HTML extraction.")); 
        // Or resolve with mock HTML for testing other hooks:
        resolve('<html><body><input name="dev_field" type="text" value="dev value"/><input name="dev_field2" type="text" value="dev value2" required/></body></html>');
      }
    });
  };

  return { extractHtml };
};