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

export const createChart = async (
  token: string,
  spreadsheetId: string,
  chartConfig: {
    chartType: string;
    title: string;
    range: string;
    position?: string;
  }
) => {
  const { chartType, title, range, position } = chartConfig;

  // Extract sheet title and A1 notation
  const [sheetTitle, a1Range] = range.split("!");
  if (!sheetTitle || !a1Range) {
    throw new Error(`Invalid range format: "${range}"`);
  }

  // 1. Get the sheetId (number) from the sheet title
  const sheetMeta = await axios.get(
    `${BASE}/${spreadsheetId}?fields=sheets.properties`,
    { headers: getHeaders(token) }
  );

  const sheet = sheetMeta.data.sheets.find(
    (s: any) => s.properties.title === sheetTitle
  );

  if (!sheet) {
    throw new Error(`Sheet titled "${sheetTitle}" not found.`);
  }

  const sheetId = sheet.properties.sheetId;

  // 2. Parse A1 range (e.g., A1:B4)
  const match = a1Range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
  if (!match) throw new Error(`Invalid A1 range: ${a1Range}`);

  const colToIndex = (col: string) =>
    col
      .split("")
      .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;

  const [, startCol, startRow, endCol, endRow] = match;

  const startRowIndex = parseInt(startRow, 10) - 1;
  const endRowIndex = parseInt(endRow, 10);
  const startColumnIndex = colToIndex(startCol);
  const endColumnIndex = colToIndex(endCol) + 1;

  // 3. Build the chart request
  const requests = [
    {
      addChart: {
        chart: {
          spec: {
            title,
            basicChart: {
              chartType: chartType.toUpperCase(),
              legendPosition: "BOTTOM_LEGEND",
              axis: [
                { position: "BOTTOM_AXIS", title: "Category" },
                { position: "LEFT_AXIS", title: "Value" },
              ],
              domains: [
                {
                  domain: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId,
                          startRowIndex,
                          endRowIndex,
                          startColumnIndex,
                          endColumnIndex: startColumnIndex + 1,
                        },
                      ],
                    },
                  },
                },
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId,
                          startRowIndex,
                          endRowIndex,
                          startColumnIndex: startColumnIndex + 1,
                          endColumnIndex,
                        },
                      ],
                    },
                  },
                  targetAxis: "LEFT_AXIS",
                },
              ],
            },
          },
          position: position
            ? {
                overlayPosition: {
                  anchorCell: {
                    sheetId,
                    rowIndex: 0,
                    columnIndex: 5,
                  },
                },
              }
            : undefined,
        },
      },
    },
  ];

  // 4. Send the request
  await axios.post(
    `${BASE}/${spreadsheetId}:batchUpdate`,
    { requests },
    {
      headers: getHeaders(token),
    }
  );
};
export const createTable = async (
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  range: string
) => {
  const [sheet, a1Range] = range.split("!");
  if (!sheet || !a1Range) throw new Error("Invalid A1 range");

  const sheetMeta = await axios.get(
    `${BASE}/${spreadsheetId}?fields=sheets.properties`,
    { headers: getHeaders(token) }
  );

  const sheetInfo = sheetMeta.data.sheets.find(
    (s: any) => s.properties.title === sheetTitle
  );
  if (!sheetInfo) throw new Error(`Sheet titled "${sheetTitle}" not found.`);

  const sheetId = sheetInfo.properties.sheetId;

  const match = a1Range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
  if (!match) throw new Error("Invalid A1 notation");

  const colToIndex = (col: string) =>
    col
      .split("")
      .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;

  const [, startCol, startRow, endCol, endRow] = match;
  const startRowIndex = parseInt(startRow, 10) - 1;
  const endRowIndex = parseInt(endRow, 10);
  const startColIndex = colToIndex(startCol);
  const endColIndex = colToIndex(endCol) + 1;

  const requests = [
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      setBasicFilter: {
        filter: {
          range: {
            sheetId,
            startRowIndex,
            endRowIndex,
            startColumnIndex: startColIndex,
            endColumnIndex: endColIndex,
          },
        },
      },
    },
  ];

  await axios.post(
    `${BASE}/${spreadsheetId}:batchUpdate`,
    { requests },
    { headers: getHeaders(token) }
  );
};

export const addTable = async (
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  range: string,
  tableName: string,
  columnTypes: { index: number; name: string; type: string }[]
) => {
  // Get sheetId from sheetTitle
  const meta = await axios.get(
    `${BASE}/${spreadsheetId}?fields=sheets.properties`,
    { headers: getHeaders(token) }
  );
  const sheet = meta.data.sheets.find(
    (s: any) => s.properties.title === sheetTitle
  );
  if (!sheet) throw new Error(`Sheet titled "${sheetTitle}" not found.`);
  const sheetId = sheet.properties.sheetId;

  // Parse A1 range
  const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
  if (!match) throw new Error("Invalid range format");
  const [, startCol, startRow, endCol, endRow] = match;
  const colToIndex = (col: string) =>
    col.split("").reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0) - 1;
  const startRowIndex = parseInt(startRow, 10) - 1;
  const endRowIndex = parseInt(endRow, 10);
  const startColIndex = colToIndex(startCol);
  const endColIndex = colToIndex(endCol) + 1;

  // Build addTable request
  const requests = [
    {
      addTable: {
        table: {
          name: tableName,
          range: {
            sheetId,
            startRowIndex,
            endRowIndex,
            startColumnIndex: startColIndex,
            endColumnIndex: endColIndex,
          },
          columnProperties: columnTypes.map((col) => ({
            columnIndex: col.index,
            name: col.name,
            type: col.type,
          })),
        },
      },
    },
  ];
  await axios.post(
    `${BASE}/${spreadsheetId}:batchUpdate`,
    { requests },
    { headers: getHeaders(token) }
  );
};
