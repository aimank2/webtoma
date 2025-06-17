// ... existing code ...
import { AuthContext } from "@/contexts/AuthContext";
import { useContext, useState } from "react";
import { useAiFormFiller } from "./useAiFormFiller";
// import { useAutomationNotifications } from "./useAutomationNotifications"; // Removed
import { useFormInjector } from "./useFormInjector";
import { useFormStructurer } from "./useFormStructurer";
import { useHtmlExtractor } from "./useHtmlExtractor";
import { Item as NotificationItemProps } from "@/components/page/home/NotificationItem"; // Added for type safety

// Define the props for notification handlers
interface AutomationRunnerProps {
  onScheduleInitialNotifications: (
    notifications: NotificationItemProps[]
  ) => void;
  onAuthError: () => void;
  onSuccess: () => void;
  onError: (message?: string) => void;
  onAddNotification: (message: string, type: 'add' | 'replace') => void; // Updated signature
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

  // Removed internal useAutomationNotifications call

  const { extractHtml } = useHtmlExtractor();
  const { structureForm } = useFormStructurer();
  const { sendToAI } = useAiFormFiller();
  const { injectFields } = useFormInjector();

  const runAutomation = async (userInput: string) => {
    // Input validation is now handled in Home.tsx before calling runAutomation
    // Auth check
    if (!auth || !auth.token) {
      console.log("Authentication Error: User not logged in or token expired.");
      onAuthError(); // Call the handler from Home.tsx
      return;
    }

    setIsRunning(true);
    // Clear any previous notifications and schedule initial ones via Home.tsx callbacks
    // onClearNotifications(); // Home.tsx's handleAutomationClick already clears.
    // The FORM_FILLING_NOTIFICATIONS constant is defined in Home.tsx and passed to onScheduleInitialNotifications there.
    // This call is now made from Home.tsx before runAutomation, or as the first step here if preferred.
    // For now, assuming Home.tsx calls its `scheduleNotifications(INITIAL_AUTOMATION_NOTIFICATIONS)`
    // which in turn calls the `onScheduleInitialNotifications` passed to this hook.
    // To be very explicit as per user request:
    // onScheduleInitialNotifications should be called by Home.tsx, which then calls the function passed here.
    // If Home.tsx passes its own `scheduleNotifications` as `onScheduleInitialNotifications`, that's fine.
    // The key is that the initial sequence starts immediately.
    // Let's assume Home.tsx's `useAutomationRunner` call looks like:
    // useAutomationRunner({ onScheduleInitialNotifications: () => scheduleNotifications(INITIAL_AUTOMATION_NOTIFICATIONS), ... })
    // So, when runAutomation is called, Home.tsx has already (or will immediately) call its local scheduleNotifications.
    // To ensure it's the *very first* thing as per user request, Home.tsx should call its local `scheduleNotifications`
    // *before* calling `runAutomation(formDataInput)`.
    // The `onScheduleInitialNotifications` prop is more for the hook to trigger it if it were managing the constants.
    // Given Home.tsx now owns the constants, it's more direct for Home.tsx to initiate this.

    // However, to strictly follow the user's checklist for the hook:
    // If `FORM_FILLING_NOTIFICATIONS` were defined here or passed in:
    // onScheduleInitialNotifications(FORM_FILLING_NOTIFICATIONS_FROM_SOMEWHERE);
    // Since Home.tsx defines them, it's cleaner for Home.tsx to call its own `scheduleNotifications`
    // and pass that function as `onScheduleInitialNotifications`.
    // The current setup in the previous Home.tsx diff already does this effectively.

    try {
      console.log("Starting automation...");

      // 1. HTML Extraction
      console.log("Step 1: Extracting HTML...");
      // Notification for this step is part of the initial scheduled sequence from Home.tsx
      const htmlContent = await extractHtml();
      console.log("HTML extracted successfully.");

      // 2. Structuring Form
      console.log("Step 2: Structuring form data...");
      // Notification for this step is part of the initial scheduled sequence from Home.tsx
      const structuredForm = await structureForm(htmlContent);
      console.log("Form data structured successfully.");

      // 3. Sending to AI
      console.log("Step 3: Sending data to AI...");
      // Notification for this step is part of the initial scheduled sequence from Home.tsx
      const aiData = await sendToAI(userInput, structuredForm);
      console.log("AI response received.");
      onClearNotifications(); 
      // Pass description as message, and type as 'replace' or 'add'
      // Assuming AI_RESPONSE_RECEIVED_NOTIFICATION should replace the last one (e.g., "Waiting for AI")
      onAddNotification(AI_RESPONSE_RECEIVED_NOTIFICATION.description, 'replace');

      console.log("Step 4: Injecting form values...");
      // Assuming INJECTING_FORM_VALUES_NOTIFICATION should be added as a new one
      onAddNotification(INJECTING_FORM_VALUES_NOTIFICATION.description, 'add'); 
      await injectFields(aiData);
      console.log("Form values injected successfully.");

      onSuccess(); 
    } catch (error: any) {
      console.error("Automation error:", error);
      const errorMessage =
        error.message || "An unexpected error occurred during automation.";
      onError(errorMessage); // Call error handler from Home.tsx
    } finally {
      setIsRunning(false);
    }
  };

  return {
    runAutomation,
    isRunning,
  };
};
