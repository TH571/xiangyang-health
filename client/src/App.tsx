import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { HealthFrontiers, HealthLectures, HealthScience } from "./pages/CategoryList";
import { ArticleDetailPage } from "./pages/ArticleDetail";
import { HealthWorkersPage } from "./pages/HealthWorkers";
import { SelectionPage } from "./pages/Selection";
import { AboutPage } from "./pages/About";

// Admin Imports
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { CategoryList } from "./pages/admin/Categories/CategoryList";
import { NewsList, NewsEdit } from "./pages/admin/News/NewsList";
import { ExpertList, ExpertEdit } from "./pages/admin/Experts/ExpertList";
import { SelectionList, SelectionEdit } from "./pages/admin/Selection/SelectionList";
import { Settings } from "./pages/admin/Settings/Settings";
import { useEffect } from "react";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, params }: { component: React.ComponentType<any>, params?: any }) {
  const { user, token } = useAuth()!;
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || !user) {
      setLocation("/admin/login");
    }
  }, [token, user, setLocation]);

  if (!token || !user) return null;
  return <Component params={params} />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/frontiers" component={HealthFrontiers} />
      <Route path="/lectures" component={HealthLectures} />
      <Route path="/science" component={HealthScience} />
      <Route path="/article/:id" component={({ params }) => <ArticleDetailPage id={params.id} />} />
      <Route path="/workers" component={HealthWorkersPage} />
      <Route path="/selection" component={SelectionPage} />
      <Route path="/about" component={AboutPage} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} />} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} />} />

      <Route path="/admin/categories" component={() => <ProtectedRoute component={CategoryList} />} />

      <Route path="/admin/news" component={() => <ProtectedRoute component={NewsList} />} />
      <Route path="/admin/news/new" component={() => <ProtectedRoute component={NewsEdit} />} />
      <Route path="/admin/news/:id" component={({ params }) => <ProtectedRoute component={NewsEdit} params={params} />} />

      <Route path="/admin/experts" component={() => <ProtectedRoute component={ExpertList} />} />
      <Route path="/admin/experts/new" component={() => <ProtectedRoute component={ExpertEdit} />} />
      <Route path="/admin/experts/:id" component={({ params }) => <ProtectedRoute component={ExpertEdit} params={params} />} />

      <Route path="/admin/selection" component={() => <ProtectedRoute component={SelectionList} />} />
      <Route path="/admin/selection/new" component={() => <ProtectedRoute component={SelectionEdit} />} />
      <Route path="/admin/selection/:id" component={({ params }) => <ProtectedRoute component={SelectionEdit} params={params} />} />

      <Route path="/admin/settings" component={() => <ProtectedRoute component={Settings} />} />

      <Route path="/404" component={NotFound} />
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
      <AuthProvider>
        <ThemeProvider
          defaultTheme="light"
        // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
