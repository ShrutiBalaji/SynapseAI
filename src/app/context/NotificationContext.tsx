"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import NotificationToast from "../components/NotificationToast";

interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: "info" | "success" | "warning" | "error", duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: "info" | "success" | "warning" | "error" = "info", duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
  };

  // Listen for custom notification events
  React.useEffect(() => {
    const handleCustomNotification = (event: CustomEvent) => {
      const { message, type = "info", duration = 5000 } = event.detail;
      showNotification(message, type, duration);
    };

    window.addEventListener('showNotification', handleCustomNotification as EventListener);
    
    return () => {
      window.removeEventListener('showNotification', handleCustomNotification as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
