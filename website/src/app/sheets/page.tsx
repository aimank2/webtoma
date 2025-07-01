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
  // const handleGAPIInit = () => {
  //   const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

  //   const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
  //     client_id: clientId,
  //     scope: "https://www.googleapis.com/auth/spreadsheets",
  //     callback: (tokenResponse: any) => {
  //       const accessToken = tokenResponse.access_token;
  //       console.log("✅ Real access token:", accessToken);
  //       if (accessToken) {
  //         localStorage.setItem("google_access_token", accessToken);
  //       }
  //     },
  //   });

  //   tokenClient.requestAccessToken();
  // };
  // useEffect(() => {
  //   handleGAPIInit();
  // }, []);

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
