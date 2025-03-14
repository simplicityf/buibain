import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { INotification, ResInterface, User } from "../lib/interface";
import axios from "axios";
import io from "socket.io-client";

import { BASE_URL, SOCKET_BASE_URL } from "../lib/constants";
import { handleApiError } from "../api/user";

// Define the shape of the context
interface UserContextType {
  user: User | null;
  setUser: (user: User) => void;
  loading: boolean;
  error: string | null;
  onlineUsers: any;
  setOnlineUsers: any;
  refresh: () => Promise<void>;
  notifications: INotification[];
  setNotifications: any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface ContextProviderProps {
  children: ReactNode;
}

// The ContextProvider component
export const ContextProvider: React.FC<ContextProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/notification/all`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      const data = res.data;
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: ResInterface = await axios.get(`${BASE_URL}/user/me`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      setUser(response.data.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUser();
  }, []);

  console.log(user);
  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser,
        error,
        refresh: fetchUser,
        onlineUsers,
        setOnlineUsers,
        notifications,
        setNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a ContextProvider");
  }
  return context;
};
