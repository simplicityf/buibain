import React from "react";
import {
  FileQuestion,
  Home,
  ArrowRight,
  AlertCircle,
  Search,
} from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen  flex items-center justify-center p-4 font-primary">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 bg-button/10 rounded-full animate-pulse" />

          <div className="absolute inset-0 flex items-center justify-center">
            <FileQuestion className="w-24 h-24 text-button animate-bounce" />
          </div>
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
              <AlertCircle className="w-8 h-8 text-primary2 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="text-8xl font-bold text-button">404</div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-text2 text-lg max-w-md mx-auto">
            Oops! Looks like you've ventured into uncharted territory. The page
            you're looking for doesn't exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center px-6 py-3 bg-button hover:bg-primary2 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={() => (window.location.href = "/support")}
            className="inline-flex items-center px-6 py-3 border-2 border-button text-button hover:bg-button hover:text-white rounded-lg transition-all duration-300 group"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <p className="text-sm text-text2 pt-8">
          Lost? Don't worry, we've got your back.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
