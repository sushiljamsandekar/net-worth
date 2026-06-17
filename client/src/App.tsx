import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Liabilities from "./pages/Liabilities";
import Goals from "./pages/Goals";
import Transactions from "./pages/Transactions";
import ImportExport from "./pages/ImportExport";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/ "} component={Home} />
      <Route path={"/dashboard"} component={() => <DashboardLayout><Dashboard /></DashboardLayout>} />
      <Route path={"/assets"} component={() => <DashboardLayout><Assets /></DashboardLayout>} />
      <Route path={"/liabilities"} component={() => <DashboardLayout><Liabilities /></DashboardLayout>} />
      <Route path={"/goals"} component={() => <DashboardLayout><Goals /></DashboardLayout>} />
      <Route path={"/transactions"} component={() => <DashboardLayout><Transactions /></DashboardLayout>} />
      <Route path={"/import-export"} component={() => <DashboardLayout><ImportExport /></DashboardLayout>} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
