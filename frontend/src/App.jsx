import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home"; 
import ForgotPassword from "./pages/ForgotPassword"; 
import Dashboard from "./pages/Dashboard"; 
import Settings from "./pages/Settings"; 
import AdminHome from "./pages/AdminHome";
import UserManagement from "./pages/UserManagement";
import MoodDetection from "./pages/MoodDetection"; 
import AboutUs from "./pages/AboutUs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> 
        <Route path="/home" element={<Home />} /> 
         <Route path="/detect-mood" element={<MoodDetection />} />
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/settings" element={<Settings />} />  
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/manage-users" element={<UserManagement />} />
        <Route path="/about" element={<AboutUs />} />
      </Routes>
    </BrowserRouter>
  );
}