import { Item } from "@/components/page/home/NotificationItem";

export const FORM_FILLING_NOTIFICATIONS: Item[] = [
  {
    name: "EXTRACTING HTML",
    description: "Extracting page HTML...",
    time: "0ms",
    icon: "🧠",
    color: "#eab308", // yellow-500
  },
  {
    name: "STRUCTURING FORM",
    description: "Structuring form data...",
    time: "+500ms",
    icon: "🧩",
    color: "#f10bf5", // amber-500
  },
  {
    name: "SENDING TO AI",
    description: "Sending prompt to AI...",
    time: "+1000ms",
    icon: "📡",
    color: "#6366f1", // indigo-500
  },
  {
    name: "WAITING FOR AI",
    description: "Awaiting AI response...",
    time: "+1500ms",
    icon: "⏳",
    color: "#6b7280", // gray-500
  },
  // AI_RESPONSE_RECEIVED and INJECTING_FORM_VALUES will be handled dynamically
];

export const AI_RESPONSE_RECEIVED_NOTIFICATION: Item = {
  name: "AI RESPONSE RECEIVED",
  description: "AI response received!",
  time: "now",
  icon: "✅",
  color: "#22c55e", // green-500
};

export const INJECTING_FORM_VALUES_NOTIFICATION: Item = {
  name: "INJECTING FORM VALUES",
  description: "Injecting values into page...",
  time: "now", // This will be handled by a short delay in Home.tsx
  icon: "⚙️",
  color: "#3b82f6", // blue-500
};

export const FORM_AUTOMATION_SUCCESS_NOTIFICATION: Item = {
  name: "SUCCESS",
  description: "Form filled successfully! 🎉",
  time: "now", // This will be handled by a short delay in Home.tsx
  icon: "🎉",
  color: "#22c55e", // emerald-500
};

export const AUTOMATION_ERROR_NOTIFICATION: Item = {
  name: "AUTOMATION ERROR",
  description: "Something went wrong during automation.",
  time: "now",
  icon: "⚠️",
  color: "#ef4444", // red-500
};
export const INITIAL_NOTIFICATION_MESSAGE = "Waking up the bots...";
export const WAITING_FOR_AI_MESSAGE = "AI is deep in thought...";
export const AUTOMATION_SUCCESS_MESSAGE = "Bots did the thing! 🎉";
export const AUTH_ERROR_MESSAGE = "Oops! Who goes there? Please log in.";
export const GENERIC_ERROR_MESSAGE = "Something broke. Blame the robots.";

export const INITIAL_NOTIFICATIONS: Omit<any, "time">[] = [
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

export const SUCCESS_NOTIFICATION_BASE: Omit<any, "time" | "description"> = {
  name: "SUCCESS",
  icon: "✅",
  color: "#10B981",
};

export const ERROR_NOTIFICATION_BASE: Omit<any, "time" | "description"> = {
  name: "ERROR",
  icon: "❌",
  color: "#EF4444",
};

export const BASE_DELAY = 2500;
