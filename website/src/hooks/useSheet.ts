import { useMutation, useQuery } from "@tanstack/react-query";
import * as sheetService from "@/services/sheetsService";

export const useCreateSheet = (token: string | null) =>
  useMutation({
    mutationFn: (title: string) => {
      if (!token) throw new Error("No Google token");
      return sheetService.createSheet(token, title);
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

export const useGetValues = (token: string | null, spreadsheetId: string, range: string) => {
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
      return sheetService.deleteValues(token, params.spreadsheetId, params.range);
    },
  });