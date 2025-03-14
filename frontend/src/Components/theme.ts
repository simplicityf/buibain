import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#F8BC08",
    },
    secondary: {
      main: "#C6980C",
    },
    background: {
      default: "hsl(var(--background))",
      paper: "hsl(var(--card))",
    },
    text: {
      primary: "hsl(var(--foreground))",
      secondary: "#7E7E7E",
    },
  },
  typography: {
    fontFamily: "Montserrat, sans-serif",
  },
  shape: {
    borderRadius: 4,
  },
});

export default theme;
