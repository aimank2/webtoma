import axios from "axios";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const createSheet = async (token: string, title: string) => {
  const res = await axios.post(
    BASE,
    { properties: { title } },
    { headers: getHeaders(token) }
  );
  return res.data.spreadsheetId;
};

export const appendRows = async (
  token: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
) => {
  await axios.post(
    `${BASE}/${spreadsheetId}/values/${range}:append`,
    { values },
    {
      headers: getHeaders(token),
      params: { valueInputOption: "RAW" },
    }
  );
};

export const getValues = async (
  token: string,
  spreadsheetId: string,
  range: string
) => {
  const res = await axios.get(`${BASE}/${spreadsheetId}/values/${range}`, {
    headers: getHeaders(token),
  });
  return res.data.values ?? [];
};

export const updateValues = async (
  token: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
) => {
  await axios.put(
    `${BASE}/${spreadsheetId}/values/${range}`,
    { values },
    {
      headers: getHeaders(token),
      params: { valueInputOption: "RAW" },
    }
  );
};

export const deleteValues = async (
  token: string,
  spreadsheetId: string,
  range: string
) => {
  await axios.post(
    `${BASE}/${spreadsheetId}/values/${range}:clear`,
    {},
    { headers: getHeaders(token) }
  );
};
