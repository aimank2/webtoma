import { Route, Routes, Navigate } from "react-router-dom";
import SignIn from "./pages/auth/SignIn"; // Renamed to AuthPage to avoid conflict if you have an Auth component
import { ROUTES } from "./routes/routes";
import HomePage from "./pages/Home"; // Renamed to HomePage
import SignUpPage from "./pages/auth/SignUp"; // Renamed to SignUpPage
import Layout from "./layouts/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import UserProfilePage from "./pages/UserProfilePage"; // Import the new UserProfilePage
import RootLayout from "./layouts/RootLayout"; // Import RootLayout
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
  return (
    <Routes>
      {/* Wrap all routes with RootLayout */}
      <Route element={<RootLayout />}>
        {/* Public routes */}
        <Route path={ROUTES.AUTH} element={<SignIn />} />
        <Route path={ROUTES.SIGNUP} element={<SignUpPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

        {/* Protected routes: all wrapped by Layout and ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.PROFILE} element={<UserProfilePage />} />
            {/* Add other protected routes here, e.g., /settings */}
            {/* <Route path="/settings" element={<SettingsPage />} /> */}
          </Route>
        </Route>

        {/* Optional: Redirect root to home if authenticated, or auth if not */}
        {/* This depends on your desired behavior for the "/" path */}
        <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />
        {/* Or, more complex logic: 
        <Route path="/" element={ <AuthCheckAndRedirect/> } /> 
        where AuthCheckAndRedirect uses useAuth to decide where to go. 
        For simplicity, a direct redirect to HOME is often fine if HOME is protected.*/}
      </Route>
    </Routes>
  );
}

export default App;
