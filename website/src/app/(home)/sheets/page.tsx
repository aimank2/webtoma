"use client";

import { useState } from "react";
import {
  useCreateSheet,
  useAppendRows,
  useGetValues,
  useUpdateValues,
  useDeleteValues,
} from "@/hooks/useSheet";
import { useGoogleToken } from "@/context/GoogleTokenContext";
import GoogleInit from "@/components/GoogleInit";
import SheetActions from "@/components/sheet-action-card";
import { useCreateChart } from "@/hooks/useSheet";
import { Button } from "@/components/ui/button";

export default function SheetsPage() {
  const { googleToken, clearGoogleToken } = useGoogleToken();

  const [sheetId, setSheetId] = useState<string>("");
  const { mutateAsync: createSheet, isPending: creating } =
    useCreateSheet(googleToken);
  const { mutateAsync: appendRows, isPending: appending } =
    useAppendRows(googleToken);
  const { data: values, isLoading: loadingValues } = useGetValues(
    googleToken,
    sheetId,
    "Sheet1!A1:B10"
  );
  const { mutateAsync: updateValues, isPending: updating } =
    useUpdateValues(googleToken);
  const { mutateAsync: deleteValues, isPending: clearing } =
    useDeleteValues(googleToken);
  const [status, setStatus] = useState<string>("Waiting...");
  const { mutateAsync: createChart, isPending: charting } =
    useCreateChart(googleToken);

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

  const handleCreateChart = async () => {
    if (!sheetId) return setStatus("No sheet ID");
    setStatus("Creating chart...");
    try {
      await createChart({
        spreadsheetId: sheetId,
        chartType: "BAR", // or "COLUMN", "LINE", etc.
        title: "Static Demo Chart",
        range: "Sheet1!A1:B10", // adjust as needed
        position: "E1", // optional, can be omitted
      });
      setStatus("✅ Chart created");
    } catch (e) {
      console.error(e);
      setStatus("❌ Failed to create chart");
    }
  };

  return (
    <div>
      <GoogleInit />
      <h1>Google Sheets Page (Hooks CRUD Demo)</h1>
      <div style={{ marginBottom: 16 }}>
        <strong>Access Token:</strong>{" "}
        {googleToken ? googleToken : "Not logged in"}
        {googleToken && (
          <button style={{ marginLeft: 16 }} onClick={clearGoogleToken}>
            Logout
          </button>
        )}
      </div>
      <div className="w-[400px]">
        <SheetActions
          handleCreate={handleCreate}
          handleAppend={handleAppend}
          handleUpdate={handleUpdate}
          handleClear={handleClear}
          loadingCreate={creating}
          loadingAppend={appending}
          loadingUpdate={updating}
          loadingClear={clearing}
        />
      </div>
      <Button onClick={handleCreateChart}>createChart</Button>
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
      <button
        onClick={handleCreateChart}
        disabled={charting || !sheetId}
        style={{ marginTop: 8 }}
      >
        {charting ? "Creating Chart..." : "Create Static Chart"}
      </button>
    </div>
  );
}
