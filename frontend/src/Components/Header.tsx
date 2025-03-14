import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Timer,
  Play,
  Square,
  Coffee,
} from "lucide-react";
import { useUserContext } from "./ContextProvider";
import { logout } from "../api/user";
import { Avatar } from "@mui/material";
import { Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { INotification } from "../lib/interface";
import { clockIn, clockOut, endBreak, startBreak } from "../api/shift";
import axios from "axios";
import { BASE_URL } from "../lib/constants";

export function countUnreadNotifications(
  notifications: INotification[]
): number {
  return notifications?.filter((notification) => !notification.read).length;
}

const Header = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentShift, setCurrentShift] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { user, notifications, setUser } = useUserContext();

  const fetchCurrentShift = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/shift/current-shift`, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (res.data.success && res.data.data) {
        const { shift, clockedIn, workDuration, breaks } = res.data.data;
        setCurrentShift(shift);
        setIsClockedIn(clockedIn);
        setElapsedTime(workDuration * 60 || 0);

        if (breaks?.length > 0) {
          const lastBreak = breaks[breaks.length - 1];
          setIsOnBreak(!lastBreak.endTime);
        }
      } else {
        setError("Active Shift Not found");
      }
    } catch (error) {
      setError("Current Shift Not Found");
      console.error("Shift fetch error:", error);
    }
  };

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  useEffect(() => {
    let timer;
    if (isClockedIn && !isOnBreak && currentShift) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isClockedIn, isOnBreak, currentShift]);

  const handleClockInOut = async () => {
    try {
      if (!isClockedIn) {
        const shiftData = await clockIn();
        if (shiftData) {
          await fetchCurrentShift();
          setUser({ ...user, clockedIn: true });
        }
      } else {
        const data = await clockOut();
        await fetchCurrentShift();
        setUser({ ...user, clockedIn: false });
        if (data.success) {
          setIsClockedIn(false);
          setIsOnBreak(false);
        }
      }
    } catch (error) {
      console.error("Clock in/out error:", error);
      setError("Failed to clock in/out");
    }
  };

  const handleBreak = async () => {
    try {
      if (!isOnBreak) {
        await startBreak();
        setIsOnBreak(true);
      } else {
        await endBreak();
        setIsOnBreak(false);
        await fetchCurrentShift(); // Fetch updated duration after break
      }
    } catch (error) {
      console.error("Break handling error:", error);
      setError("Failed to handle break");
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const handleLogout = async () => {
    if (isClockedIn) {
      if (confirm("You are still clocked in. Clock out before logging out?")) {
        await clockOut();
        setIsClockedIn(false);
        setIsOnBreak(false);
      } else {
        return;
      }
    }
    const data = await logout();
    if (data.success) {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex-1 max-w-md mx-auto">
          <div
            className={`relative transition-all duration-200 ${
              searchFocused ? "scale-105" : ""
            }`}
          >
            <Search className="absolute left-low top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 mx-2" />
            <input
              type="search"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {user?.userType !== "admin" && (
          <div className="flex items-center gap-4 mr-4">
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : currentShift ? (
              <>
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-gray-600" />
                  <span className="font-mono text-lg">
                    {formatTime(elapsedTime)}
                  </span>
                </div>

                <button
                  onClick={handleClockInOut}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isClockedIn
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-green-100 text-green-600 hover:bg-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isClockedIn ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isClockedIn ? "Clock Out" : "Clock In"}
                  </div>
                </button>

                <button
                  onClick={handleBreak}
                  disabled={!isClockedIn}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isOnBreak
                      ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } ${!isClockedIn && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    {isOnBreak ? "End Break" : "Break"}
                  </div>
                </button>
              </>
            ) : null}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/notifications")}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {notifications?.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {countUnreadNotifications(notifications)}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-low py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden flex justify-center items-center bg-gray-200">
                <Avatar
                  className="object-cover object-center"
                  src={user?.avatar}
                >
                  {!user?.avatar && <Person sx={{ fontSize: 40 }} />}
                </Avatar>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {user?.fullName}
                </span>
                <span className="text-xs text-gray-500">{user?.userType}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-2">
                  <div className="px-low py-2">
                    <p className="text-sm font-medium">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="h-px bg-gray-200 my-1"></div>
                  <button
                    onClick={() => navigate("/settings")}
                    className="w-full flex items-center px-low py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => navigate("/settings")}
                    className="w-full flex items-center px-low py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </button>
                  <div className="h-px bg-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-low py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
