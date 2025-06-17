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
