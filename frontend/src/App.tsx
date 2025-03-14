import { Route, Routes } from "react-router-dom";
import Login from "./Pages/Login";
import TwoFactorAuth from "./Pages/TwoFactorAuth";
import LayoutProvider from "./Components/LayoutProvider";
import Users from "./Pages/Users/UsersPage";
import UserDetails from "./Pages/Users/UserDetails";
import CreateUser from "./Pages/Users/CreateUser";
import Inbox from "./Pages/Inbox/Inbox";
import Settings from "./Pages/Settings/Settings";
import Dashboard from "./Pages/Dashboard/Dashboard";
import { useUserContext } from "./Components/ContextProvider";
import RaterDashboard from "./Pages/Dashboard/RaterDashboard";
import PayerDashboard from "./Pages/Dashboard/PayerDashboard";
import CoinExchange from "./Pages/CoinExchange/CoinExchange";
import VerifyAccount from "./Pages/VerifyAccount";
import CustomerCare from "./Pages/CC/CustomerCare";
import EscalatedDetails from "./Pages/CC/EscalatedDetails";
import Banks from "./Pages/Bank/Banks";
import CreateBank from "./Pages/Bank/CreateBank";
import Notifications from "./Pages/Notifications";
import NotFound from "./Pages/NotFound";
import TransactionReports from "./Pages/CC/TransactionReports";
import TransactionHistory from "./Pages/Payer/TransactionHistory";
import ForgetPassword from "./Pages/ForgetPasswrod";
import ResetPassword from "./Pages/ResetPassword";
import ActivityLogs from "./Pages/ActivityLogs/ActivityLogs";
import MessageTemplateForm from "./Pages/AutoTemplate/AutoTemplate";
import AllTemplates from "./Pages/AutoTemplate/AllTemplates";
import CreateAccounts from "./Pages/Accounts/CreateAccounts.tsx";
import AllAccounts from "./Pages/Accounts/AllAccounts";

function App() {
  const { user } = useUserContext();

  return (
    <LayoutProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/2fa" element={<TwoFactorAuth />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />

        {/* Protected Routes*/}
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/login" element={<Login />} />
        {user?.userType === "admin" && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/payer" element={<PayerDashboard />} />
            <Route path="/rater" element={<RaterDashboard />} />
            <Route path="/cc" element={<CustomerCare />} />
          </>
        )}

        {user?.userType === "rater" && (
          <Route path="/" element={<RaterDashboard />} />
        )}

        {user?.userType === "payer" && (
          <>
            <Route path="/" element={<PayerDashboard />} />
            <Route
              path="/transaction/history"
              element={<TransactionHistory />}
            />
          </>
        )}

        {user?.userType === "customer-support" && (
          <>
            <Route path="/" element={<TransactionReports />} />
            <Route
              path="/transaction/reports"
              element={<TransactionReports />}
            />
            <Route path="/customer-support" element={<CustomerCare />} />
            <Route
              path="/escalated-trade/:tradeId"
              element={<EscalatedDetails />}
            />
          </>
        )}

        {user?.userType === "admin" && (
          <>
            <Route path="/admin/users" element={<Users />} />
            <Route
              path="/admin/message-templates/create"
              element={<MessageTemplateForm />}
            />{" "}
            <Route path="/admin/message-templates" element={<AllTemplates />} />
            <Route path="/admin/users/:id" element={<UserDetails />} />
            <Route path="/admin/activity-logs" element={<ActivityLogs />} />
            <Route path="/admin/users/create" element={<CreateUser />} />
            <Route
              path="/transaction/reports"
              element={<TransactionReports />}
            />
            <Route path="/customer-support" element={<CustomerCare />} />
            <Route
              path="/escalated-trade/:tradeId"
              element={<EscalatedDetails />}
            />
            {/* Forex Accounts */}
            <Route path="/admin/account/create" element={<CreateAccounts />} />
            <Route path="/admin/account/all" element={<AllAccounts />} />
          </>
        )}

        {/* Inbox Routes - Can be accessed by all types of users */}
        <Route path="/inbox" element={<Inbox />} />

        {/* Coin Exchange */}

        <Route path="/exchange" element={<CoinExchange />} />

        {/* Bank Management Pages */}
        <Route path="/banks" element={<Banks />} />
        <Route path="/banks/create" element={<CreateBank />} />

        {/* Settings Page for Users */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </LayoutProvider>
  );
}

export default App;
