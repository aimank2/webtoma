import { useCallback, useState } from 'react';

export const useGoogleAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authenticateWithGoogle = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
          const error = chrome.runtime.lastError?.message || 'Authentication failed';
          console.error('OAuth error:', error);
          setError(error);
          reject(error);
        } else {
          console.log('Google OAuth token received');
          setToken(token);
          resolve(token);
        }
      });
    });
  }, []);

  const clearToken = useCallback(() => {
    if (token) {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        setToken(null);
        setError(null);
      });
    }
  }, [token]);

  return {
    token,
    error,
    authenticateWithGoogle,
    clearToken,
    isAuthenticated: !!token
  };
};
