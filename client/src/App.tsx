import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense, useEffect } from "react";

// 预加载首页关键组件，确保首屏快速显示
import Home from "./pages/Home";

// 懒加载其他页面，减少首屏 JS 体积
const HealthFrontiers = lazy(() => import("./pages/CategoryList").then(m => ({ default: m.HealthFrontiers })));
const HealthLectures = lazy(() => import("./pages/CategoryList").then(m => ({ default: m.HealthLectures })));
const HealthScience = lazy(() => import("./pages/CategoryList").then(m => ({ default: m.HealthScience })));
const ArticleDetailPage = lazy(() => import("./pages/ArticleDetail").then(m => ({ default: m.ArticleDetailPage })));
const HealthWorkersPage = lazy(() => import("./pages/HealthWorkers").then(m => ({ default: m.HealthWorkersPage })));
const SelectionPage = lazy(() => import("./pages/Selection").then(m => ({ default: m.SelectionPage })));
const AboutPage = lazy(() => import("./pages/About").then(m => ({ default: m.AboutPage })));

// Admin Imports - 懒加载后台页面
import { AuthProvider, useAuth } from "./contexts/AuthContext";
const AdminLogin = lazy(() => import("./pages/admin/Login").then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard").then(m => ({ default: m.AdminDashboard })));
const CategoryList = lazy(() => import("./pages/admin/Categories/CategoryList").then(m => ({ default: m.CategoryList })));
const NewsList = lazy(() => import("./pages/admin/News/NewsList").then(m => ({ default: m.NewsList })));
const NewsEdit = lazy(() => import("./pages/admin/News/NewsList").then(m => ({ default: m.NewsEdit })));
const ExpertList = lazy(() => import("./pages/admin/Experts/ExpertList").then(m => ({ default: m.ExpertList })));
const ExpertEdit = lazy(() => import("./pages/admin/Experts/ExpertList").then(m => ({ default: m.ExpertEdit })));
const SelectionList = lazy(() => import("./pages/admin/Selection/SelectionList").then(m => ({ default: m.SelectionList })));
const SelectionEdit = lazy(() => import("./pages/admin/Selection/SelectionList").then(m => ({ default: m.SelectionEdit })));
const Settings = lazy(() => import("./pages/admin/Settings/Settings").then(m => ({ default: m.Settings })));

// 页面加载占位符
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-orange-200" />
        <div className="h-4 w-24 bg-orange-200 rounded" />
      </div>
    </div>
  );
}

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
      {/* Public Routes - 首页不使用懒加载，确保首屏快速显示 */}
      <Route path="/" component={Home} />

      {/* Public Routes - 懒加载 */}
      <Route path="/frontiers" component={() => (
        <Suspense fallback={<PageLoader />}>
          <HealthFrontiers />
        </Suspense>
      )} />
      <Route path="/lectures" component={() => (
        <Suspense fallback={<PageLoader />}>
          <HealthLectures />
        </Suspense>
      )} />
      <Route path="/science" component={() => (
        <Suspense fallback={<PageLoader />}>
          <HealthScience />
        </Suspense>
      )} />
      <Route path="/article/:id" component={({ params }) => (
        <Suspense fallback={<PageLoader />}>
          <ArticleDetailPage id={params.id} />
        </Suspense>
      )} />
      <Route path="/workers" component={() => (
        <Suspense fallback={<PageLoader />}>
          <HealthWorkersPage />
        </Suspense>
      )} />
      <Route path="/selection" component={() => (
        <Suspense fallback={<PageLoader />}>
          <SelectionPage />
        </Suspense>
      )} />
      <Route path="/about" component={() => (
        <Suspense fallback={<PageLoader />}>
          <AboutPage />
        </Suspense>
      )} />

      {/* Admin Routes - 懒加载 */}
      <Route path="/admin/login" component={() => (
        <Suspense fallback={<PageLoader />}>
          <AdminLogin />
        </Suspense>
      )} />
      <Route path="/admin" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={AdminDashboard} /></Suspense>} />
      <Route path="/admin/dashboard" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={AdminDashboard} /></Suspense>} />

      <Route path="/admin/categories" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={CategoryList} /></Suspense>} />

      <Route path="/admin/news" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={NewsList} /></Suspense>} />
      <Route path="/admin/news/new" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={NewsEdit} /></Suspense>} />
      <Route path="/admin/news/:id" component={({ params }) => <Suspense fallback={<PageLoader />}><ProtectedRoute component={NewsEdit} params={params} /></Suspense>} />

      <Route path="/admin/experts" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={ExpertList} /></Suspense>} />
      <Route path="/admin/experts/new" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={ExpertEdit} /></Suspense>} />
      <Route path="/admin/experts/:id" component={({ params }) => <Suspense fallback={<PageLoader />}><ProtectedRoute component={ExpertEdit} params={params} /></Suspense>} />

      <Route path="/admin/selection" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={SelectionList} /></Suspense>} />
      <Route path="/admin/selection/new" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={SelectionEdit} /></Suspense>} />
      <Route path="/admin/selection/:id" component={({ params }) => <Suspense fallback={<PageLoader />}><ProtectedRoute component={SelectionEdit} params={params} /></Suspense>} />

      <Route path="/admin/settings" component={() => <Suspense fallback={<PageLoader />}><ProtectedRoute component={Settings} /></Suspense>} />

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
