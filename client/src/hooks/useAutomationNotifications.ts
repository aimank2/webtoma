import { useState, useRef } from "react";
// Assuming NotificationItem will be created at: @/components/page/home/NotificationItem
// If the path is different, please adjust the import.
import { Item as NotificationItemProps } from "@/components/page/home/NotificationItem";
import {
  FORM_FILLING_NOTIFICATIONS,
  AI_RESPONSE_RECEIVED_NOTIFICATION,
  INJECTING_FORM_VALUES_NOTIFICATION,
  FORM_AUTOMATION_SUCCESS_NOTIFICATION,
  AUTOMATION_ERROR_NOTIFICATION,
} from "@/constants/constants";

export const useAutomationNotifications = () => {
  const [displayedNotifications, setDisplayedNotifications] = useState<
    NotificationItemProps[]
  >([]);
  const notificationTimeouts = useRef<NodeJS.Timeout[]>([]);

  const clearAllNotificationTimeouts = () => {
    notificationTimeouts.current.forEach(clearTimeout);
    notificationTimeouts.current = [];
  };

  const scheduleInitialNotifications = () => {
    clearAllNotificationTimeouts();
    setDisplayedNotifications([]); // Start with a clean slate

    let currentDelay = 0;
    const initialNotifications = FORM_FILLING_NOTIFICATIONS;

    initialNotifications.forEach((notification, index) => {
      // Calculate delay relative to the previous notification's time
      const previousTime =
        index > 0
          ? parseInt(
              initialNotifications[index - 1].time
                .replace("+", "")
                .replace("ms", ""),
              10
            )
          : 0;
      const currentTime = parseInt(
        notification.time.replace("+", "").replace("ms", ""),
        10
      );
      const delay = currentTime - previousTime;

      currentDelay += delay;

      const timeoutId = setTimeout(() => {
        setDisplayedNotifications((prev) => [...prev, notification]);
      }, currentDelay);
      notificationTimeouts.current.push(timeoutId);
    });
  };

  const showSuccessNotifications = () => {
    // Clear any pending timeouts from the initial schedule
    clearAllNotificationTimeouts();

    // Remove "WAITING FOR AI" if present, then add success notifications sequentially
    setDisplayedNotifications((prev) => {
      const filtered = prev.filter(
        (n) =>
          n.name !== "WAITING FOR AI" &&
          n.name !==
            FORM_FILLING_NOTIFICATIONS[FORM_FILLING_NOTIFICATIONS.length - 1]
              .name
      );
      return [...filtered, AI_RESPONSE_RECEIVED_NOTIFICATION];
    });

    const injectTimeoutId = setTimeout(() => {
      setDisplayedNotifications((prev) => [
        ...prev,
        INJECTING_FORM_VALUES_NOTIFICATION,
      ]);
    }, 300); // 300ms delay after AI_RESPONSE_RECEIVED
    notificationTimeouts.current.push(injectTimeoutId);

    const successTimeoutId = setTimeout(() => {
      setDisplayedNotifications((prev) => [
        ...prev,
        FORM_AUTOMATION_SUCCESS_NOTIFICATION,
      ]);
    }, 600); // 300ms after INJECTING_FORM_VALUES, so 600ms total from AI_RESPONSE_RECEIVED
    notificationTimeouts.current.push(successTimeoutId);
  };

  const showErrorNotification = (errorMessage?: string) => {
    clearAllNotificationTimeouts();
    setDisplayedNotifications((prev) => [
      ...prev.filter(
        (n) =>
          n.name !== "WAITING FOR AI" &&
          n.name !==
            FORM_FILLING_NOTIFICATIONS[FORM_FILLING_NOTIFICATIONS.length - 1]
              .name
      ),
      {
        ...AUTOMATION_ERROR_NOTIFICATION,
        message: errorMessage || AUTOMATION_ERROR_NOTIFICATION.message,
      },
    ]);
  };

  const clearAll = () => {
    clearAllNotificationTimeouts();
    setDisplayedNotifications([]);
  };

  return {
    displayedNotifications,
    scheduleInitialNotifications,
    showSuccessNotifications,
    showErrorNotification,
    clearAll,
  };
};
