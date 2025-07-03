import { useGoogleToken } from "@/context/GoogleTokenContext";
import * as sheetService from "@/services/sheetsService";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCreateSheet = (token: string | null) => {
  const { clearGoogleToken } = useGoogleToken();
  return useMutation({
    mutationFn: (title: string) => {
      if (!token) throw new Error("No Google token");
      return sheetService.createSheet(token, title);
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        clearGoogleToken();
      }
    },
  });
};
export const useCreateTable = (token: string | null) =>
  useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      sheetTitle: string;
      range: string; // A1 notation: "Sheet1!A1:G10"
    }) => {
      if (!token) throw new Error("No Google token");
      return sheetService.createTable(
        token,
        params.spreadsheetId,
        params.sheetTitle,
        params.range
      );
    },
  });

export const useAppendRows = (token: string | null) =>
  useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      range: string;
      values: any[][];
    }) => {
      if (!token) throw new Error("No Google token");
      return sheetService.appendRows(
        token,
        params.spreadsheetId,
        params.range,
        params.values
      );
    },
  });

export const useGetValues = (
  token: string | null,
  spreadsheetId: string,
  range: string
) => {
  return useQuery({
    queryKey: ["sheet-values", spreadsheetId, range],
    queryFn: () => {
      if (!token) throw new Error("No Google token");
      return sheetService.getValues(token, spreadsheetId, range);
    },
    enabled: !!spreadsheetId && !!range && !!token,
  });
};

export const useUpdateValues = (token: string | null) =>
  useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      range: string;
      values: any[][];
    }) => {
      if (!token) throw new Error("No Google token");
      return sheetService.updateValues(
        token,
        params.spreadsheetId,
        params.range,
        params.values
      );
    },
  });

export const useDeleteValues = (token: string | null) =>
  useMutation({
    mutationFn: (params: { spreadsheetId: string; range: string }) => {
      if (!token) throw new Error("No Google token");
      return sheetService.deleteValues(
        token,
        params.spreadsheetId,
        params.range
      );
    },
  });

interface CreateChartParams {
  spreadsheetId: string;
  chartType: string;
  title: string;
  range: string; // e.g. "Sheet1!A1:B10"
  position?: string; // e.g. "E1"
}

export const useCreateChart = (token: string | null) =>
  useMutation({
    mutationFn: async (params: CreateChartParams) => {
      if (!token) throw new Error("No Google token");
      const { spreadsheetId, range, chartType, title, position } = params;

      // Optional: Validate A1 range format before hitting the API
      const isValidRange = /^[^!]+![A-Z]+\d+:[A-Z]+\d+$/.test(range);
      if (!isValidRange) {
        console.error("Invalid range format:", range);

        throw new Error(
          `Invalid range format: "${range}". Expected A1 notation like "Sheet1!A1:B10"`
        );
      }
      console.log("CHART", params);

      return await sheetService.createChart(token, spreadsheetId, {
        chartType,
        title,
        range,
        position,
      });
    },
  });

export const useAddTable = (token: string | null) =>
  useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      sheetTitle: string;
      range: string;
      tableName: string;
      columnTypes: { index: number; name: string; type: string }[];
    }) => {
      if (!token) throw new Error("No Google token");
      return sheetService.addTable(
        token,
        params.spreadsheetId,
        params.sheetTitle,
        params.range,
        params.tableName,
        params.columnTypes
      );
    },
  });
