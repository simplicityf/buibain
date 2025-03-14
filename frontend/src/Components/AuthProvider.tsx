import React, { ReactNode, useEffect, useRef } from "react";
import { useUserContext } from "./ContextProvider";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import io, { Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "../lib/constants";

interface AuthProviderProps {
  children: ReactNode;
}

const notificationSound = new Audio("/n.mp3");
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    loading,
    onlineUsers,
    setOnlineUsers,
    notifications,
    setNotifications,
  } = useUserContext();

  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const isInitialMount = useRef(true);

  const handleUserOnline = () => {
    if (socketRef.current && user) {
      socketRef.current.emit("userStatusUpdate", {
        userId: user.id,
        status: "online",
      });
      setOnlineUsers((prev) =>
        prev.includes(user.id) ? prev : [...prev, user.id]
      );
    }
  };

  const handleUserOffline = () => {
    if (socketRef.current && user) {
      socketRef.current.emit("userStatusUpdate", {
        userId: user.id,
        status: "offline",
      });
      setOnlineUsers((prev) => prev.filter((id) => id !== user.id));
    }
  };

  const initializeSocket = () => {
    if (user && !socketRef.current) {
      socketRef.current = io(SOCKET_BASE_URL, {
        query: { userId: user.id },
        auth: { userId: user.id },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected");
        socketRef.current?.emit("join", user.id);
        handleUserOnline();
      });

      socketRef.current.on("reconnect", () => {
        console.log("Socket reconnected");
        handleUserOnline();
      });

      socketRef.current.on("onlineUsers", (users: string[]) => {
        if (user) {
          setOnlineUsers([...new Set([...users, user.id])]);
        } else {
          setOnlineUsers(users);
        }
      });

      socketRef.current.on("userStatusUpdate", ({ userId, status }) => {
        setOnlineUsers((prev) => {
          if (status === "online") {
            return [...new Set([...prev, userId])];
          }
          if (userId === user.id && document.visibilityState === "visible") {
            return prev;
          }
          return prev.filter((id) => id !== userId);
        });
      });

      // Listen for new notifications
      socketRef.current.on("newNotification", (notification) => {
        setNotifications((prev) => [notification.notification, ...prev]);
        notificationSound.play().catch((error) => {
          console.error("Audio play error:", error);
        });
      });

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }
  };

  useEffect(() => {
    if (!loading && user && isInitialMount.current) {
      console.log("Initial load complete, setting up user connection");
      isInitialMount.current = false;
      setOnlineUsers((prev) => [...new Set([...prev, user.id])]);
      initializeSocket();
      handleUserOnline();
    }
  }, [loading, user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleUserOnline();
      } else {
        handleUserOffline();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      handleUserOffline();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  useEffect(() => {
    if (user === null && !loading) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (user === null && loading === false) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default AuthProvider;
