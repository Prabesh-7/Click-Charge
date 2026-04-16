import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppRoutes />
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
