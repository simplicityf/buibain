import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@emotion/react";
import theme from "./Components/theme";
import { ContextProvider } from "./Components/ContextProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ContextProvider>
        <ThemeProvider theme={theme}>
          <App />
          <Toaster />
        </ThemeProvider>
      </ContextProvider>
    </BrowserRouter>
  </StrictMode>
);
