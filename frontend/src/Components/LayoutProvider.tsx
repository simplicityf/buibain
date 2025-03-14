import React, { useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboards";
import Header from "./Header";
import { useUserContext } from "./ContextProvider";
import AuthProvider from "./AuthProvider";
import Loader from "./Loader";
import Loading from "./Loading";

interface LayoutProviderProps {
  children: React.ReactNode;
}

const LayoutProvider: React.FC<LayoutProviderProps> = React.memo(
  ({ children }) => {
    const location = useLocation();
    const { loading, user } = useUserContext();
    const navigate = useNavigate();
    const excludeDashboard = useMemo(
      () =>
        [
          "/login",
          "/2fa",
          "/verify-account",
          "/forget-password",
          "/reset-password",
        ].includes(location.pathname),
      [location.pathname]
    );

    if (loading) {
      return <Loading />;
    }

    if (excludeDashboard) return <main>{children}</main>;

    return (
      <AuthProvider>
        <div className="flex w-full min-h-screen">
          <div className="sticky top-0 h-screen w-[17%] md:w-1/5">
            <Dashboard user={user} />
          </div>

          <div className="w-[83%] md:w-[80%] py-[15px] pt-0 flex flex-col gap-[20px] h-screen overflow-y-scroll overflow-x-hidden">
            <Header />
            <main className="flex-grow p-[20px] md:px-[30px] md:py-[20px]">
              {children}
            </main>
          </div>
        </div>
      </AuthProvider>
    );
  }
);

export default LayoutProvider;
