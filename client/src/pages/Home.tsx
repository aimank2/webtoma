import LoaderIcon from "@/assets/icons/LoaderIcon";
import { AnimatedList } from "@/components/magicui/animated-list";
import NotificationItem from "@/components/page/home/NotificationItem"; // Assuming any is exported here
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext } from "@/contexts/AuthContext";
import { useAutomationRunner } from "@/hooks/useAutomationRunner";
import React, { useCallback, useContext, useRef, useState } from "react"; // Added useRef, useCallback

// --- Helper function to get current time ---
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    // second: "2-digit",
  });
};
// --- End of Helper function ---
const baseDelay = 2500;
const randomOffset = Math.floor(Math.random() * 1000); // 0–999 ms

// --- Re-introduced Notification Constants and Types ---
const INITIAL_NOTIFICATION_MESSAGE = "Waking up the bots...";
const WAITING_FOR_AI_MESSAGE = "AI is deep in thought...";
const AUTOMATION_SUCCESS_MESSAGE = "Bots did the thing! 🎉";
const AUTH_ERROR_MESSAGE = "Oops! Who goes there? Please log in.";
const GENERIC_ERROR_MESSAGE = "Something broke. Blame the robots.";

const INITIAL_NOTIFICATIONS: Omit<any, "time">[] = [
  {
    name: "Power On",
    description: INITIAL_NOTIFICATION_MESSAGE,
    icon: "⏳",
    // time will be set dynamically
  },
  {
    name: "Link Up",
    description: "Connecting to secure channel...",
    icon: "🔗",
    // time will be set dynamically
  },
  {
    name: "Gear Up",
    description: "Setting up the environment...",
    icon: "🛠️",
    // time will be set dynamically
  },
  {
    name: "Thinking",
    description: WAITING_FOR_AI_MESSAGE,
    icon: "🤖",
    // time will be set dynamically
  },
];

const SUCCESS_NOTIFICATION_BASE: Omit<any, "time" | "description"> = {
  name: "SUCCESS",
  icon: "✅",
  color: "#10B981",
};

const ERROR_NOTIFICATION_BASE: Omit<any, "time" | "description"> = {
  name: "ERROR",
  icon: "❌",
  color: "#EF4444",
};
// --- End of Notification Constants and Types ---

const Home: React.FC = () => {
  const [formDataInput, setFormDataInput] = useState<string>("");
  const auth = useContext(AuthContext);

  // --- Re-introduced Notification State and Refs ---
  const [displayedNotifications, setDisplayedNotifications] = useState<any[]>(
    []
  );
  const notificationTimeouts = useRef<NodeJS.Timeout[]>([]);
  // --- End of Notification State and Refs ---

  // --- Re-introduced Notification Helper Functions ---
  const clearAllNotificationTimeouts = useCallback(() => {
    notificationTimeouts.current.forEach(clearTimeout);
    notificationTimeouts.current = [];
  }, []);

  const addNotificationToList = useCallback(
    (notification: Omit<any, "time">) => {
      setDisplayedNotifications((prev) => [
        ...prev,
        { ...notification, time: getCurrentTime() },
      ]);
    },
    []
  );

  const replaceLastNotificationInList = useCallback(
    (notification: Omit<any, "time">) => {
      setDisplayedNotifications((prev) => [
        ...prev.slice(0, -1),
        { ...notification, time: getCurrentTime() },
      ]);
    },
    []
  );

  const scheduleInitialNotifications = useCallback(() => {
    clearAllNotificationTimeouts();
    setDisplayedNotifications([]); // Clear previous notifications

    let cumulativeDelay = 0;

    INITIAL_NOTIFICATIONS.forEach((notificationBase, index) => {
      const delay = index === 0 ? 0 : baseDelay + randomOffset;
      cumulativeDelay += delay;
      const timeoutId = setTimeout(() => {
        addNotificationToList(notificationBase); // time will be added by addNotificationToList
      }, cumulativeDelay);
      notificationTimeouts.current.push(timeoutId);
    });
  }, [clearAllNotificationTimeouts, addNotificationToList]);
  // --- End of Notification Helper Functions ---

  const { runAutomation, isRunning } = useAutomationRunner({
    onAuthError: () => {
      clearAllNotificationTimeouts();
      addNotificationToList({
        ...ERROR_NOTIFICATION_BASE,
        description: AUTH_ERROR_MESSAGE,
      });
    },
    onClearNotifications: () => {
      clearAllNotificationTimeouts();
      setDisplayedNotifications([]);
    },
    onAddNotification: (message: string, type: "add" | "replace") => {
      const newNotificationBase = {
        name: type === "replace" ? "AI_RESPONSE" : "INFO",
        description: message,
        icon: type === "replace" ? "💬" : "ℹ️",
      };
      if (type === "replace") {
        replaceLastNotificationInList(newNotificationBase);
      } else {
        addNotificationToList(newNotificationBase);
      }
    },
    onSuccess: () => {
      const timeoutId = setTimeout(() => {
        replaceLastNotificationInList({
          ...SUCCESS_NOTIFICATION_BASE,
          description: AUTOMATION_SUCCESS_MESSAGE,
        });
      }, 1000);
      notificationTimeouts.current.push(timeoutId);
    },
    onError: (errorMessage) => {
      replaceLastNotificationInList({
        ...ERROR_NOTIFICATION_BASE,
        description: errorMessage || GENERIC_ERROR_MESSAGE,
      });
    },
    onScheduleInitialNotifications: scheduleInitialNotifications,
    onReplaceNotification: replaceLastNotificationInList,
  });

  const handleAutomationClick = async () => {
    if (!formDataInput.trim()) {
      console.warn("Input Required: Please describe what the form should do.");
      // Optionally, display a specific notification for empty input
      addNotificationToList({
        name: "INPUT_ERROR",
        description: "Please provide instructions for the automation.",
        icon: "⚠️",
        color: "#F59E0B", // Amber
      });
      return;
    }

    // Start the notification sequence immediately
    scheduleInitialNotifications();

    runAutomation(formDataInput);
  };

  return (
    <div className="size-full flex flex-center relative">
      <AnimatedList className="mt-14 overflow-y-auto overflow-x-hidden h-[55vh] hide-scrollbar">
        {/* displayedNotifications now comes from local state */}
        {displayedNotifications.map((notification, index) => (
          <NotificationItem
            key={`${notification.name}-${index}`}
            {...notification}
          />
        ))}
      </AnimatedList>

      <div className="fixed bottom-24 w-full px-4 flex flex-col  ">
        <div className="flex flex-row justify-between items-center">
          <Label htmlFor="formDataInput" className=" font-semibold">
            Your Instructions:
          </Label>
          <div className="flex flex-row gap-2">
            <Button
              onClick={handleAutomationClick}
              disabled={isRunning || !auth?.token}
              className="flex flex-center px-3 border border-input text-sm hover:bg-black  text-white  bg-black min-w-32"
            >
              {isRunning ? (
                <>
                  <LoaderIcon className="h-5 w-5 animate-spin" />
                </>
              ) : (
                "Automate ⚡"
              )}
            </Button>
          </div>
        </div>
        <div className="relative p-2 border mt-1 rounded-2xl ">
          <Textarea
            id="formDataInput"
            value={formDataInput}
            onChange={(e) => setFormDataInput(e.target.value)}
            placeholder="e.g., 'Fill my name as John Doe, email as john.doe@example.com, and select 'Option 2' for preferences.'"
            rows={6}
            className="text-sm border-none overflow-hidden"
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
