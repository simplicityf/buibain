import React from "react";
import { ThreeDots, CirclesWithBar } from "react-loader-spinner";

const Loading: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center font-primary">
      <div className="relative">
        {/* Main Loader */}
        <div className="relative z-10">
          <CirclesWithBar
            height="120"
            width="120"
            color="#F8BC08"
            barColor="#C6980C"
            wrapperClass="justify-center"
            visible={true}
            outerCircleColor="#F8BC08"
            innerCircleColor="#C6980C"
          />
        </div>

        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-button/20 blur-3xl rounded-full scale-150 animate-pulse" />
      </div>

      {/* Loading Text */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Loading</h2>
        <div className="flex items-center justify-center gap-1">
          <ThreeDots
            height="30"
            width="45"
            color="#F8BC08"
            visible={true}
            wrapperClass="justify-center"
          />
        </div>
        <p className="text-text2 mt-4 text-sm animate-pulse">
          Please wait while the resource is being loaded
        </p>
      </div>

      {/* Progress Bar using only Tailwind */}
      <div className="w-48 h-1 bg-gray-200 rounded-full mt-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-button to-primary2 rounded-full animate-pulse"
          style={{
            width: "98%",
            transition: "width 2s ease-in-out",
          }}
        />
      </div>
    </div>
  );
};

export default Loading;
