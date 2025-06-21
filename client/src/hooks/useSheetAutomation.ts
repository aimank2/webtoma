import { useState } from "react";
import { useSheetMetadata } from "./useSheetMetadata";
import { sheetsService } from "../lib/services/sheets";
import { IntentClassification } from "../types/sheets";
import api from "@/lib/api";

export const useSheetAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { metadata, extractMetadata } = useSheetMetadata();

  const classifyIntent = async (
    prompt: string
  ): Promise<IntentClassification | null> => {
    setLoading(true);
    try {
      const response = await api.post("/sheets/classify", { prompt });
      return response.data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to classify intent"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const executeAutomation = async (
    intent: string,
    prompt: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const sheetMetadata = await extractMetadata();
      if (!sheetMetadata) throw new Error("Failed to extract sheet metadata");

      const response = await api.post("/sheets/automate", {
        intent,
        prompt,
        sheetMetadata,
      });

      const result = response.data;

      // Execute the appropriate action based on intent
      switch (intent) {
        case "data_entry":
          await sheetsService.insertData(sheetMetadata, result.data);
          break;
        case "chart_generation":
          await sheetsService.insertChart(sheetMetadata, result.chartConfig);
          break;
        case "sheet_modification": {
          const requests = result.modifications.map((mod: any) => ({
            updateCells: {
              range: {
                sheetId: sheetMetadata.sheetId,
                startRowIndex: mod.range.startRow - 1,
                endRowIndex: mod.range.endRow,
                startColumnIndex: mod.range.startColumn.charCodeAt(0) - 65,
                endColumnIndex: mod.range.endColumn.charCodeAt(0) - 64,
              },
              rows: mod.values.map((row: any[]) => ({
                values: row.map((cell: any) => ({
                  userEnteredValue: { stringValue: cell.toString() },
                })),
              })),
              fields: "userEnteredValue",
            },
          }));

          await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetMetadata.spreadsheetId,
            resource: { requests },
          });
          break;
        }
      }

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to execute automation"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { classifyIntent, executeAutomation, loading, error, metadata };
};
