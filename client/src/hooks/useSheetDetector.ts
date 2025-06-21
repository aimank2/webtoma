import { useEffect, useState } from "react";

export const useSheetDetector = () => {
  const [isGoogleSheet, setIsGoogleSheet] = useState(false);

  useEffect(() => {
    const checkIfGoogleSheet = () => {
      if (chrome && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];
          const title = currentTab?.title || "";
          setIsGoogleSheet(title.includes("Google Sheets"));
        });
      }
    };

    checkIfGoogleSheet();

    // Listen for tab updates
    const handleTabUpdate = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (tab.active && changeInfo.title) {
        setIsGoogleSheet(changeInfo.title.includes("Google Sheets"));
      }
    };

    if (chrome && chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener(handleTabUpdate);
    }

    // Cleanup listener
    return () => {
      if (chrome && chrome.tabs && chrome.tabs.onUpdated) {
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      }
    };
  }, []);

  return { isGoogleSheet };
};
