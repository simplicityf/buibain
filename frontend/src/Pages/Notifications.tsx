import React, { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Clock,
  Info,
  AlertTriangle,
  Trash2,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";
import { useUserContext } from "../Components/ContextProvider";
import {
  deleteNotificationById,
  markAllNotificationsAsCompleted,
} from "../api/user";
import Loading from "../Components/Loading";

// Align with TypeORM model
interface User {
  id: string;
  name: string;
  email: string;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  type: "system" | "individual";
  priority: "high" | "medium" | "low";
  read: boolean;
  user: User;
  relatedAccount?: User;
  createdAt: Date;
  updatedAt: Date;
}

const Notifications: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notifications, setNotifications, loading } = useUserContext();
  const getIcon = (
    type: Notification["type"],
    priority: Notification["priority"]
  ) => {
    const baseClass = priority === "high" ? "animate-pulse" : "";

    switch (type) {
      case "system":
        return <Info className={`h-5 w-5 text-button ${baseClass}`} />;
      case "individual":
        return <UserIcon className={`h-5 w-5 text-purple-500 ${baseClass}`} />;
      default:
        return <Bell className={`h-5 w-5 text-button ${baseClass}`} />;
    }
  };

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "from-red-500 to-red-600";
      case "medium":
        return "from-button to-primary2";
      case "low":
        return "from-gray-400 to-gray-500";
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const markAllAsRead = async () => {
    try {
      // Update backend
      await markAllNotificationsAsCompleted();

      setNotifications(
        notifications?.map((notif) => ({ ...notif, read: true }))
      );
    } catch (err) {
      setError("Failed to mark notifications as read");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Update backend

      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      setError("Failed to mark notification as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setIsDeleting(id);
      // Delete from backend
      await deleteNotificationById(id);

      setTimeout(() => {
        setNotifications(notifications.filter((notif) => notif.id !== id));
        setIsDeleting(null);
      }, 300);
    } catch (err) {
      setError("Failed to delete notification");
      setIsDeleting(null);
    }
  };
  const unreadCount = notifications?.filter((n) => !n.read).length;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-primary">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="relative bg-button p-2 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Notifications
            </h1>
          </div>
          {notifications?.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-button hover:text-primary2 transition-colors duration-200 flex items-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications?.map((notification) => (
            <div
              key={notification.id}
              className={`transform transition-all duration-300 hover:translate-x-1 ${
                notification.read ? "opacity-75" : ""
              } ${
                isDeleting === notification.id
                  ? "scale-0 opacity-0"
                  : "scale-100"
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden group">
                <div
                  className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${
                    notification.read
                      ? "from-gray-300 to-gray-400"
                      : getPriorityColor(notification.priority)
                  }`}
                />
                <div className="flex items-start p-4">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-button/10 to-primary2/10 flex items-center justify-center">
                      {getIcon(notification.type, notification.priority)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-button transition-colors duration-200">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-button rounded-full"></span>
                          )}
                        </h2>
                        {notification.relatedAccount && (
                          <div className="text-xs text-text2 flex items-center mt-1">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Related: {notification.relatedAccount.fullName}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="ml-4 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group-hover:opacity-100 opacity-0"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-text2">
                      {notification.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-text2" />
                        <span className="text-xs text-text2">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          notification.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : notification.priority === "medium"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {notification.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {notifications?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gradient-to-br from-button/20 to-primary2/20 p-4 rounded-full mb-4">
              <Bell className="h-12 w-12 text-button" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              All caught up!
            </h3>
            <p className="mt-1 text-sm text-text2 text-center">
              You have no new notifications at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
