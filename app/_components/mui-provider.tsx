"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { ReactNode } from "react";

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#0b6e4f", contrastText: "#ffffff" },
        background: { default: "#ffffff", paper: "#ffffff" },
        text: { primary: "#171717", secondary: "#6b7280" },
        divider: "#e5e7eb",
      },
    },
    dark: {
      palette: {
        primary: { main: "#34d399", contrastText: "#171717" },
        background: { default: "#0a0a0a", paper: "#111113" },
        text: { primary: "#ededed", secondary: "#9ca3af" },
        divider: "#26262a",
      },
    },
  },
});

export default function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
