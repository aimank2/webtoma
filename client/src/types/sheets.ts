export interface SheetRange {
  startRow: number;
  endRow: number;
  startColumn: string;
  endColumn: string;
}

export interface SheetMetadata {
  spreadsheetId: string;
  sheetId: string;
  sheetTitle: string;
  activeRange: SheetRange;
  headers: string[];
  totalRows: number;
  totalColumns: number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  range: SheetRange;
  options: Record<string, any>;
}

export type SheetIntent = 'data_entry' | 'chart_generation' | 'sheet_modification' | 'unknown';

export interface IntentClassification {
  intent: SheetIntent;
  confidence: number;
  justification: string;
}