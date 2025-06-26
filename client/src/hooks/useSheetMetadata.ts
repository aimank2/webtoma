import { useState, useEffect } from "react";
import { SheetMetadata, SheetRange } from "../types/sheets";

export const useSheetMetadata = () => {
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    const initializeGoogleSheetsAPI = async () => {
      try {
        console.log("Initializing Google Sheets API...");
        await new Promise<void>((resolve, reject) => {
          if ((window as any).gapi?.client?.sheets) {
            console.log("Google Sheets API already loaded");
            resolve();
            return;
          }

          (window as any).gapi.load("client", async () => {
            try {
              await (window as any).gapi.client.init({
                apiKey: process.env.VITE_GOOGLE_API_KEY,
                discoveryDocs: [
                  "https://sheets.googleapis.com/$discovery/rest?version=v4",
                ],
                clientId: process.env.VITE_GOOGLE_CLIENT_ID,
                scope: "https://www.googleapis.com/auth/spreadsheets",
              });

              console.log("Google Sheets API initialized successfully");
              resolve();
            } catch (error) {
              console.error("Failed to initialize Google Sheets API:", error);
              reject(error);
            }
          });
        });
        setIsApiReady(true);
      } catch (error) {
        console.error("Error initializing Google Sheets API:", error);
        setError("Failed to initialize Google Sheets API");
      }
    };

    initializeGoogleSheetsAPI();
  }, []);

  const extractMetadata = async (): Promise<SheetMetadata | null> => {
    if (!isApiReady) {
      console.error("Google Sheets API not ready");
      throw new Error("Google Sheets API not initialized");
    }

    setLoading(true);
    try {
      console.log("Starting metadata extraction...");

      // Check if GAPI is loaded
      if (!(window as any).gapi?.client?.sheets) {
        console.error("Google Sheets API not loaded");
        throw new Error("Google Sheets API not initialized");
      }

      const spreadsheetId = getSpreadsheetIdFromUrl();
      console.log("Extracted spreadsheet ID:", spreadsheetId);

      // Use Google Sheets API to get metadata
      console.log("Fetching spreadsheet data...");
      const response = await (
        window as any
      ).gapi.client.sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [],
        includeGridData: true,
      });
      console.log("Spreadsheet response:", response);

      const activeSheet = response.result.sheets[0];
      console.log("Active sheet:", activeSheet);

      const gridProperties = activeSheet.properties.gridProperties;
      console.log("Grid properties:", gridProperties);

      console.log("Getting active range...");
      const activeRange = getActiveRange();
      console.log("Active range:", activeRange);

      console.log("Extracting headers...");
      const headers = await extractHeaders();
      console.log("Extracted headers:", headers);

      const metadata: SheetMetadata = {
        spreadsheetId: response.result.spreadsheetId,
        sheetId: activeSheet.properties.sheetId.toString(),
        sheetTitle: activeSheet.properties.title,
        activeRange,
        headers,
        totalRows: gridProperties.rowCount,
        totalColumns: gridProperties.columnCount,
      };

      console.log("Final metadata:", metadata);
      setMetadata(metadata);
      return metadata;
    } catch (err) {
      console.error("Metadata extraction error:", err);
      console.error("Error stack:", (err as Error).stack);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to extract sheet metadata";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSpreadsheetIdFromUrl = (): string => {
    const url = window.location.href;
    console.log("Current URL:", url);
    const matches = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!matches) {
      console.error("Failed to extract spreadsheet ID from URL");
      throw new Error("Invalid Google Sheets URL");
    }
    return matches[1];
  };

  const getActiveRange = (): SheetRange => {
    try {
      const selection = (
        window as any
      ).gapi.client.sheets.spreadsheets.getSelection();
      if (!selection) {
        return {
          startRow: 1,
          endRow: 10, // Default to first 10 rows if no selection
          startColumn: "A",
          endColumn: "Z", // Default to first 26 columns if no selection
        };
      }
      return {
        startRow: selection.startRowIndex + 1,
        endRow: selection.endRowIndex + 1,
        startColumn: columnIndexToLetter(selection.startColumnIndex),
        endColumn: columnIndexToLetter(selection.endColumnIndex),
      };
    } catch (error) {
      console.error("Failed to get active range:", error);
      return {
        startRow: 1,
        endRow: 10,
        startColumn: "A",
        endColumn: "Z",
      };
    }
  };

  const extractHeaders = async (): Promise<string[]> => {
    try {
      const spreadsheetId = getSpreadsheetIdFromUrl();
      const range = "A1:Z1"; // First row, columns A-Z

      const response = await (
        window as any
      ).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const headerRow = response.result.values[0];
      if (!headerRow || !headerRow.length) {
        throw new Error("No headers found in the first row");
      }

      return headerRow.map((header: string) => header.trim());
    } catch (error) {
      console.error("Failed to extract headers:", error);
      throw new Error("Failed to extract sheet headers");
    }
  };

  // Helper function to convert column index to letter
  const columnIndexToLetter = (index: number): string => {
    let letter = "";
    while (index >= 0) {
      letter = String.fromCharCode(65 + (index % 26)) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  return { metadata, loading, error, extractMetadata, isApiReady };
};
