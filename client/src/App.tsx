import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppSelector, useAppDispatch } from "./store";
import { selectAuth, selectUser, selectAuthLoading, logout } from "./store/slices/authSlice";
import { getCurrentUser } from "./store/slices/authSlice";
import { selectIsCheckedIn, selectCurrentRecord } from "./store/slices/attendanceSlice";
import { selectAdminStats, selectGeofenceSettings } from "./store/slices/adminSlice";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { MobileTabBar } from "./components/MobileTabBar";
import NotFound from "./pages/not-found";

// Import new pages
import { EmployeeDashboard } from "./pages/employee/Dashboard";
import { AttendanceHistory } from "./pages/employee/AttendanceHistory";
import { EmployeeProfile } from "./pages/employee/Profile";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { Reports } from "./pages/admin/Reports";
import { Settings } from "./pages/admin/Settings";

import { useEffect } from "react";

function AttendanceApp() {
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectAuthLoading);
  const isCheckedIn = useAppSelector(selectIsCheckedIn);
  const currentRecord = useAppSelector(selectCurrentRecord);
  const adminStats = useAppSelector(selectAdminStats);
  const geofenceSettings = useAppSelector(selectGeofenceSettings);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getCurrentTab = () => {
    if (location.pathname === "/" || location.pathname === "") return "home";
    if (location.pathname === "/admin" || location.pathname.startsWith("/admin")) return "dashboard";
    if (location.pathname === "/history") return "history";
    if (location.pathname === "/profile") return "profile";
    if (location.pathname === "/settings") return "settings";
    return "home";
  };

  // Initialize auth on app startup
  useEffect(() => {
    // Check if user has stored auth token
    const token = localStorage.getItem('token');
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  // Auto-redirect logic
  useEffect(() => {
    if (!isLoading && !user && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [user, location.pathname, navigate, isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user} 
        onLogout={handleLogout}
        onSettings={() => navigate('/profile')}
      />
      
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <Routes>
          {/* Home route - redirects based on role */}
          <Route path="/" element={
            user.role === "admin" ? <AdminDashboard /> : <EmployeeDashboard />
          } />

          {/* Employee Routes */}
          <Route path="/history" element={
            user.role === "staff" ? <AttendanceHistory /> : 
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
              <p className="text-muted-foreground mt-2">Staff only page.</p>
            </div>
          } />
          
          {/* Profile route available to all */}
          <Route path="/profile" element={<EmployeeProfile />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            user.role === "admin" ? <AdminDashboard /> : 
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
              <p className="text-muted-foreground mt-2">Admin access required.</p>
            </div>
          } />
          
          <Route path="/admin/dashboard" element={
            user.role === "admin" ? <AdminDashboard /> : 
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
              <p className="text-muted-foreground mt-2">Admin access required.</p>
            </div>
          } />
          
          <Route path="/admin/users" element={
            user.role === "admin" ? <UserManagement /> : 
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
              <p className="text-muted-foreground mt-2">Admin access required.</p>
            </div>
          } />
          
          <Route path="/admin/reports" element={
            user.role === "admin" ? <Reports /> : 
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
              <p className="text-muted-foreground mt-2">Admin access required.</p>
            </div>
          } />
          
          <Route path="/admin/settings" element={
            user.role === "admin" ? <Settings /> : 
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
              <p className="text-muted-foreground mt-2">Admin access required.</p>
            </div>
          } />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <MobileTabBar activeTab={getCurrentTab()} userRole={user.role} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <TooltipProvider>
            <Router>
              <AttendanceApp />
            </Router>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
