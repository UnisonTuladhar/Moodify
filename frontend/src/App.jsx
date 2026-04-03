import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home"; 
import ForgotPassword from "./pages/ForgotPassword"; 
import Dashboard from "./pages/Dashboard"; 
import Settings from "./pages/Settings"; 
import AdminHome from "./pages/AdminHome";
import AdminDashboard from "./pages/AdminDashboard"; 
import AdminSettings from "./pages/AdminSettings"; 
import UserManagement from "./pages/UserManagement";
import MoodDetection from "./pages/MoodDetection"; 
import AboutUs from "./pages/AboutUs";
import UserManual from "./pages/UserManual"; 
import Playlists from "./pages/Playlists";

function PublicRoute({ children }) {
  const email = localStorage.getItem("email");
  const isAdmin = localStorage.getItem("is_admin") === "1";

  if (email) {
    return <Navigate to={isAdmin ? "/admin-home" : "/home"} replace />;
  }

  return children;
}

//protected pages that require authentication
function PrivateRoute({ children, adminOnly = false, userOnly = false }) {
  const email = localStorage.getItem("email");
  const isAdmin = localStorage.getItem("is_admin") === "1";

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  if (userOnly && isAdmin) {
    return <Navigate to="/admin-home" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect — goes to login if not authenticated, or home if already logged in */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Public routes — accessible only when NOT logged in */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} /> 

        {/* User-only routes — accessible only by logged-in regular users (not admins) */}
        <Route path="/home" element={<PrivateRoute userOnly><Home /></PrivateRoute>} /> 
        <Route path="/about" element={<PrivateRoute userOnly><AboutUs /></PrivateRoute>} />
        <Route path="/detect-mood" element={<PrivateRoute userOnly><MoodDetection /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute userOnly><Dashboard /></PrivateRoute>} /> 
        <Route path="/settings" element={<PrivateRoute userOnly><Settings /></PrivateRoute>} />  
        <Route path="/user-manual" element={<PrivateRoute userOnly><UserManual /></PrivateRoute>} /> 
        <Route path="/playlists" element={<PrivateRoute userOnly><Playlists /></PrivateRoute>} />

        {/* Admin-only routes — accessible only by logged-in admins (not regular users) */}
        <Route path="/admin-home" element={<PrivateRoute adminOnly><AdminHome /></PrivateRoute>} />
        <Route path="/admin-dashboard" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin-settings" element={<PrivateRoute adminOnly><AdminSettings /></PrivateRoute>} />
        <Route path="/manage-users" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
