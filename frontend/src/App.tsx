import { ThemeProvider } from "next-themes";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppRoutes />
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
