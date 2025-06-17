import { useState, useRef, useCallback } from 'react';
import { Item as NotificationItemProps } from '@/components/page/home/NotificationItem'; // Adjusted import for Item props

export const useAutomationNotifications = () => {
  const [displayedNotifications, setDisplayedNotifications] = useState<NotificationItemProps[]>([]);
  const notificationTimeouts = useRef<NodeJS.Timeout[]>([]);

  const clearAllNotificationTimeouts = useCallback(() => {
    notificationTimeouts.current.forEach(clearTimeout);
    notificationTimeouts.current = [];
  }, []);

  const scheduleNotifications = useCallback((notificationsToSchedule: NotificationItemProps[]) => {
    let currentDelay = 0;
    notificationsToSchedule.forEach((notification, index) => {
      const delay = notification.time === "0ms"
        ? 0
        : parseInt(notification.time.replace("+", "").replace("ms", ""), 10) -
          (index > 0
            ? parseInt(
                notificationsToSchedule[index - 1].time
                  .replace("+", "")
                  .replace("ms", ""),
                10
              )
            : 0);
      currentDelay += delay;

      const timeoutId = setTimeout(() => {
        setDisplayedNotifications((prev) => [...prev, notification]);
      }, currentDelay);
      notificationTimeouts.current.push(timeoutId);
    });
  }, []);

  const addNotification = useCallback((notification: NotificationItemProps) => {
    setDisplayedNotifications((prev) => [...prev, notification]);
  }, []);

  const replaceLastNotification = useCallback((notification: NotificationItemProps) => {
    setDisplayedNotifications((prev) => [...prev.slice(0, -1), notification]);
  }, []);

  const clearAll = useCallback(() => {
    setDisplayedNotifications([]);
    clearAllNotificationTimeouts();
  }, [clearAllNotificationTimeouts]);

  return {
    displayedNotifications,
    scheduleNotifications,
    addNotification,
    replaceLastNotification,
    clearAll,
    // This internal function is also returned because useAutomationRunner will need it.
    // Alternatively, clearAllNotificationTimeouts could be managed within useAutomationRunner
    // if it's the only other hook needing direct timeout control.
    clearAllNotificationTimeoutsInternal: clearAllNotificationTimeouts 
  };
};