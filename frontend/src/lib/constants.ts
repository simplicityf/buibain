// export const BASE_URL = "https://r845fh.bibuain.ng/api/v1";
// export const SOCKET_BASE_URL = "https://r845fh.bibuain.ng";

export const BASE_URL = "http://localhost:7001/api/v1";
export const SOCKET_BASE_URL = "http://localhost:7001";
export const successStyles = {
  style: {
    maxWidth: "50rem",
    backgroundColor: "#22C55E", // A pleasant, professional green
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: "12px 16px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "1rem",
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  iconTheme: {
    primary: "#FFFFFF",
    secondary: "#22C55E",
  },
  duration: 3000,
};

export const errorStyles = {
  style: {
    maxWidth: "50rem",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: "12px 16px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "1rem",
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  iconTheme: {
    primary: "#FFFFFF",
    secondary: "#DC2626",
  },
  duration: 4000,
};

export const loadingStyles = {
  style: {
    maxWidth: "50rem",
    minWidth: "15rem",
    backgroundColor: "#006FBA",
    color: "#FFFFFF",
    borderRadius: "12px",
    padding: "12px 16px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "1rem",
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(0, 111, 186, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  iconTheme: {
    primary: "#FFFFFF",
    secondary: "#006FBA",
  },
  duration: Infinity,
};
export const formatDate = (date: Date) => {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
