import { useMutation, useQuery } from "@tanstack/react-query";
import * as sheetService from "@/services/sheetsService";

const getToken = () => localStorage.getItem("google_access_token") ?? "";

export const useCreateSheet = () =>
  useMutation({
    mutationFn: (title: string) => {
      const token = getToken();
      return sheetService.createSheet(token, title);
    },
  });

export const useAppendRows = () =>
  useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      range: string;
      values: any[][];
    }) => {
      const token = getToken();
      return sheetService.appendRows(
        token,
        params.spreadsheetId,
        params.range,
        params.values
      );
    },
  });

export const useGetValues = (spreadsheetId: string, range: string) => {
  return useQuery({
    queryKey: ["sheet-values", spreadsheetId, range],
    queryFn: () => {
      const token = getToken();
      return sheetService.getValues(token, spreadsheetId, range);
    },
    enabled: !!spreadsheetId && !!range,
  });
};

export const useUpdateValues = () =>
  useMutation({
    mutationFn: (params: {
      spreadsheetId: string;
      range: string;
      values: any[][];
    }) => {
      const token = getToken();
      return sheetService.updateValues(
        token,
        params.spreadsheetId,
        params.range,
        params.values
      );
    },
  });

export const useDeleteValues = () =>
  useMutation({
    mutationFn: (params: { spreadsheetId: string; range: string }) => {
      const token = getToken();
      return sheetService.deleteValues(token, params.spreadsheetId, params.range);
    },
  });