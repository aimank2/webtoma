import { AuthContext } from "@/contexts/AuthContext";
import { useContext, useState } from "react";
import { useAiFormFiller } from "./useAiFormFiller";
import { useFormInjector } from "./useFormInjector";
import { useFormStructurer } from "./useFormStructurer";
import { useHtmlExtractor } from "./useHtmlExtractor";
import { Item as NotificationItemProps } from "@/components/page/home/NotificationItem";
import { useSheetDetector } from "./useSheetDetector";
import { useSheetAutomation } from "./useSheetAutomation";
import { useSheetMetadata } from "./useSheetMetadata";
import { useGoogleAuth } from "./useGoogleAuth";

// Define the props for notification handlers
interface AutomationRunnerProps {
  onScheduleInitialNotifications: (
    notifications: NotificationItemProps[]
  ) => void;
  onAuthError: () => void;
  onSuccess: () => void;
  onError: (message?: string) => void;
  onAddNotification: (message: string, type: "add" | "replace") => void; // Updated signature
  onReplaceNotification: (notification: NotificationItemProps) => void;
  onClearNotifications: () => void;
}

// Constants for specific notifications, can be moved to a constants file if preferred
// These are examples; ensure they match what Home.tsx expects or provides
const AI_RESPONSE_RECEIVED_NOTIFICATION: NotificationItemProps = {
  name: "AI Response Received",
  description: "Processing AI data...",
  icon: "💡",
  color: "#22C55E",
  time: "0ms",
};

const INJECTING_FORM_VALUES_NOTIFICATION: NotificationItemProps = {
  name: "Injecting Form Values",
  description: "Populating the form...",
  icon: "💉",
  color: "#3B82F6",
  time: "+500ms", // Example delay
};

export const useAutomationRunner = (props: AutomationRunnerProps) => {
  const {
    onAuthError,
    onSuccess,
    onError,
    onAddNotification,
    onClearNotifications,
  } = props;

  const auth = useContext(AuthContext);
  const [isRunning, setIsRunning] = useState(false);
  const { extractHtml } = useHtmlExtractor();
  const { structureForm } = useFormStructurer();
  const { sendToAI } = useAiFormFiller();
  const { injectFields } = useFormInjector();
  const { isGoogleSheet } = useSheetDetector();
  const { classifyIntent, executeAutomation } = useSheetAutomation();
  const { extractMetadata } = useSheetMetadata();
  const { authenticateWithGoogle } = useGoogleAuth();

  const runAutomation = async (userInput: string) => {
    if (!auth || !auth.token) {
      console.log("Authentication Error: User not logged in or token expired.");
      onAuthError();
      return;
    }

    setIsRunning(true);
    try {
      if (isGoogleSheet) {
        // Google Sheets authentication
        try {
          const googleToken = await authenticateWithGoogle();
          console.log("Successfully authenticated with Google", googleToken);

          // Google Sheets flow
          const intentResult = await classifyIntent(userInput);
          if (intentResult?.intent === "unknown") {
            throw new Error("Unable to determine automation intent");
          }

          const sheetMetadata = await extractMetadata();
          if (!sheetMetadata) {
            throw new Error("Failed to extract sheet metadata");
          }

          await executeAutomation(intentResult?.intent || "unknown", userInput);
          onSuccess();
        } catch (googleError) {
          console.error("Google authentication error:", googleError);
          onError("Failed to authenticate with Google Sheets");
          return;
        }
      } else {
        // Existing form automation flow
        console.log("Starting form automation...");
        const htmlContent = await extractHtml();
        const structuredForm = await structureForm(htmlContent);
        const aiData = await sendToAI(userInput, structuredForm);

        onClearNotifications();
        onAddNotification(
          AI_RESPONSE_RECEIVED_NOTIFICATION.description,
          "replace"
        );
        onAddNotification(
          INJECTING_FORM_VALUES_NOTIFICATION.description,
          "add"
        );

        await injectFields(aiData);
        onSuccess();
      }
    } catch (error: any) {
      console.error("Automation error:", error);
      const errorMessage =
        error.message || "An unexpected error occurred during automation.";
      onError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  return { runAutomation, isRunning };
};
