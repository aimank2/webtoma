import { ChartConfig, SheetMetadata, SheetRange } from "../../types/sheets";

export class GoogleSheetsService {
  private async initializeApi(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      (window as any).gapi.load("client", async () => {
        try {
          await (window as any).gapi.client.init({
            apiKey: process.env.VITE_GOOGLE_API_KEY,
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
            scope: "https://www.googleapis.com/auth/spreadsheets",
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async insertData(metadata: SheetMetadata, data: any[][]): Promise<void> {
    await this.initializeApi();
    const request = {
      spreadsheetId: metadata.spreadsheetId,
      range: `${metadata.sheetTitle}!A1`, // Adjust based on actual range
      valueInputOption: "USER_ENTERED",
      resource: {
        values: data,
      },
    };

    await (window as any).gapi.client.sheets.spreadsheets.values.update(
      request
    );
  }

  async insertChart(
    metadata: SheetMetadata,
    chartConfig: ChartConfig
  ): Promise<void> {
    await this.initializeApi();
    const request = {
      spreadsheetId: metadata.spreadsheetId,
      resource: {
        requests: [
          {
            addChart: {
              chart: {
                spec: {
                  title: chartConfig.title,
                  basicChart: {
                    chartType: chartConfig.type.toUpperCase(),
                    domains: [{ range: this.convertRange(chartConfig.range) }],
                    series: [{ range: this.convertRange(chartConfig.range) }],
                    headerCount: 1,
                  },
                },
                position: {
                  overlayPosition: {
                    anchorCell: {
                      sheetId: metadata.sheetId,
                      rowIndex: 0,
                      columnIndex: 0,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    };

    await (window as any).gapi.client.sheets.spreadsheets.batchUpdate(request);
  }

  private convertRange(range: SheetRange): string {
    return `${range.startColumn}${range.startRow}:${range.endColumn}${range.endRow}`;
  }
}

export const sheetsService = new GoogleSheetsService();
