import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

// Define the shape of the user profile
interface UserProfile {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  // Add other user properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (jwtToken: string, userData: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Helper for chrome.storage.local or localStorage fallback
const storage = {
  get: async (key: string): Promise<string | null> => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } else {
      return localStorage.getItem(key);
    }
  },
  set: async (key: string, value: string): Promise<void> => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      await chrome.storage.local.set({ [key]: value });
    } else {
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
      localStorage.removeItem(key);
    }
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (jwtToken: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/user/me", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // If profile fetch fails, treat as logout
      await storage.remove("jwtToken");
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = await storage.get("jwtToken");
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchUserProfile]);

  // Listen for storage changes to sync auth state across extension parts
  useEffect(() => {
    const handleStorageChange = async (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.jwtToken) {
        setIsLoading(true);
        const newToken = changes.jwtToken.newValue;
        if (newToken) {
          setToken(newToken);
          await fetchUserProfile(newToken);
        } else {
          setToken(null);
          setUser(null);
        }
        setIsLoading(false);
      }
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged
    ) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }
    return () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.onChanged
      ) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [fetchUserProfile]);

  const login = async (jwtToken: string, userData: UserProfile) => {
    setIsLoading(true);
    await storage.set("jwtToken", jwtToken);
    setToken(jwtToken);
    setUser(userData); // Or fetch profile again if userData is not complete
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await storage.remove("jwtToken");
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
