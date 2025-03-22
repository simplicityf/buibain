import React from "react";
import { NavLink } from "react-router-dom";
import {
  MdAccountBalanceWallet,
  MdSettings,
} from "react-icons/md";
import {
  DashboardOutlined,
  MessageOutlined,
  PaymentOutlined,
  PeopleOutlined,
  RateReview,
  Support,
} from "@mui/icons-material";
import { User } from "../lib/interface";
import { Coins, Landmark, LogsIcon, MessageCircleCodeIcon } from "lucide-react";

interface LinkItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  allowedUserTypes: string[];
}

const Dashboard: React.FC<{ user: User | null }> = ({ user }) => {
  const links: LinkItem[] = [
    {
      to: "/",
      label: "Dashboard",
      icon: (
        <DashboardOutlined className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin", "rater", "payer", "cc"],
    },
    {
      to: "/admin/message-templates",
      label: "Message Templates",
      icon: (
        <MessageCircleCodeIcon className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin"],
    },

    {
      to: "/admin/account/all",
      label: "Forex Accounts",
      icon: (
        <MdAccountBalanceWallet className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin"],
    },
    {
      to: "/admin/users",
      label: "Users",
      icon: (
        <PeopleOutlined className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin", "ceo"],
    },

    {
      to: "/exchange",
      label: "Coin Exchange",
      icon: (
        <Coins className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin", "ceo", "rater"],
    },

    {
      to: "/rater",
      label: "Rater",
      icon: (
        <RateReview className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin"],
    },
    {
      to: "/payer",
      label: "Payer",
      icon: (
        <PaymentOutlined className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin"],
    },
    {
      to: "/cc",
      label: "Cusomter Care",
      icon: (
        <Coins className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin"],
    },
    {
      to: "/transaction/history",
      label: "Transaction History",
      icon: (
        <Coins className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["payer"],
    },
    {
      to: "/customer-support",
      label: "Customer Support",
      icon: (
        <Support className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["customer-support", "payer "],
    },
    {
      to: "/banks",
      label: "Bank Management",
      icon: (
        <Landmark className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin", "rater"],
    },
    {
      to: "/inbox",
      label: "Inbox",
      icon: (
        <MessageOutlined className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin", "payer", "rater", "ceo", "customer-support"],
    },

    {
      to: "/admin/activity-logs",
      label: "Activity Logs",
      icon: (
        <LogsIcon className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin"],
    },
    {
      to: "/settings",
      label: "Settings",
      icon: (
        <MdSettings className="text-[22px] sm:text-[26px] md:text-[28px] w-[22px] sm:w-[26px] md:w-[28px] mr-[10px]" />
      ),
      allowedUserTypes: ["admin", "payer", "rater", "ceo", "customer-support"],
    },
  ];

  const filteredLinks = links.filter((link) =>
    link.allowedUserTypes.includes(user?.userType || "rater")
  );

  return (
    <nav className="w-full h-screen bg-gradient-to-b from-[#FFC107] to-[#C6980C] flex flex-col justify-start items-center overflow-hidden ">
      <div className="py-[20px] sm:py-[25px] md:py-[30px]">
        <NavLink to="/" className="flex justify-center items-center flex-col">
          <img
            src="/logo.png"
            className="w-[50px] sm:w-[70px] md:w-[90px] h-auto"
            alt="Bibuain Logo"
          />
          <h1 className="hidden font-primary uppercase sm:block font-bold text-black text-[16px] sm:text-[20px] md:text-[24px]">
            Bibuain
          </h1>
        </NavLink>
      </div>

      <ul
        className="w-full h-[80vh] overflow-x-hidden scroll-bar overflow-auto"
        id="d-list"
      >
        {filteredLinks.map((link) => (
          <li
            key={link.to}
            className="text-black font-secondary font-bold hover:bg-black/5 transition-all duration-200"
          >
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `flex justify-center sm:justify-start items-center py-[10px] px-[10px] sm:py-[15px] sm:px-[20px] md:py-[18px] md:px-[25px] ${
                  isActive ? "bg-white rounded-lg shadow-md" : ""
                }`
              }
            >
              {link.icon}
              <span className="hidden sm:block text-[14px] sm:text-[16px] md:text-[18px] font-medium">
                {link.label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Dashboard;
