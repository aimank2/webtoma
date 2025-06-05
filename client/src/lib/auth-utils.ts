// Helper for chrome.storage.local or localStorage fallback for easier testing if needed
const storage = {
  get: async (key: string): Promise<string | null> => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    }
    // Fallback for non-extension environments (e.g., testing, storybook)
    // console.warn("chrome.storage.local not available, using localStorage as fallback.");
    return localStorage.getItem(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      // console.warn("chrome.storage.local not available, using localStorage as fallback.");
      localStorage.setItem(key, value);
    }
  },
  remove: async (key: string): Promise<void> => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      await chrome.storage.local.remove(key);
    } else {
      // console.warn("chrome.storage.local not available, using localStorage as fallback.");
      localStorage.removeItem(key);
    }
  },
};

export const getToken = async (): Promise<string | null> => {
  return storage.get("jwtToken");
};

export const storeToken = async (token: string): Promise<void> => {
  return storage.set("jwtToken", token);
};

export const clearToken = async (): Promise<void> => {
  await storage.remove("jwtToken");
  await storage.remove("refreshToken"); // Also clear refresh token
};

export const getRefreshToken = async (): Promise<string | null> => {
  return storage.get("refreshToken");
};

export const storeRefreshToken = async (token: string): Promise<void> => {
  return storage.set("refreshToken", token);
};