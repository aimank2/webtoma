"use client";

import { useState } from "react";
import {
  useCreateSheet,
  useAppendRows,
  useGetValues,
  useUpdateValues,
  useDeleteValues,
} from "@/hooks/useSheet";

export default function SheetsPage() {
  const [sheetId, setSheetId] = useState<string>("");
  const { mutateAsync: createSheet, isPending: creating } = useCreateSheet();
  const { mutateAsync: appendRows, isPending: appending } = useAppendRows();
  const { data: values, isLoading: loadingValues } = useGetValues(
    sheetId,
    "Sheet1!A1:B10"
  );
  const { mutateAsync: updateValues, isPending: updating } = useUpdateValues();
  const { mutateAsync: deleteValues, isPending: clearing } = useDeleteValues();
  const [status, setStatus] = useState<string>("Waiting...");

  const handleCreate = async () => {
    setStatus("Creating sheet...");
    try {
      const id = await createSheet("New Sheet from Hooks");
      setSheetId(id);
      setStatus(`✅ Sheet created: ${id}`);
    } catch (e) {
      console.error(e);
      setStatus("❌ Failed to create sheet");
    }
  };

  const handleAppend = async () => {
    if (!sheetId) return setStatus("No sheet ID");
    setStatus("Appending rows...");
    try {
      await appendRows({
        spreadsheetId: sheetId,
        range: "Sheet1!A1",
        values: [
          ["Name", "Email"],
          ["Alice", "alice@example.com"],
          ["Bob", "bob@example.com"],
        ],
      });
      setStatus("✅ Rows appended");
    } catch (e) {
      console.error(e);

      setStatus("❌ Failed to append rows");
    }
  };

  const handleUpdate = async () => {
    if (!sheetId) return setStatus("No sheet ID");
    setStatus("Updating values...");
    try {
      await updateValues({
        spreadsheetId: sheetId,
        range: "Sheet1!A2",
        values: [["Charlie", "charlie@example.com"]],
      });
      setStatus("✅ Values updated");
    } catch (e) {
      console.error(e);

      setStatus("❌ Failed to update values");
    }
  };

  const handleClear = async () => {
    if (!sheetId) return setStatus("No sheet ID");
    setStatus("Clearing values...");
    try {
      await deleteValues({ spreadsheetId: sheetId, range: "Sheet1!A1:B10" });
      setStatus("✅ Values cleared");
    } catch (e) {
      console.error(e);

      setStatus("❌ Failed to clear values");
    }
  };

  return (
    <div>
      <h1>Google Sheets Page (Hooks CRUD Demo)</h1>
      <button onClick={handleCreate} disabled={creating}>
        Create Sheet
      </button>
      <button onClick={handleAppend} disabled={appending || !sheetId}>
        Append Rows
      </button>
      <button onClick={handleUpdate} disabled={updating || !sheetId}>
        Update Values
      </button>
      <button onClick={handleClear} disabled={clearing || !sheetId}>
        Clear Values
      </button>
      <div style={{ marginTop: 16 }}>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ marginTop: 16 }}>
        <strong>Sheet Values:</strong>
        {loadingValues ? (
          <div>Loading...</div>
        ) : (
          <pre>{JSON.stringify(values, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
