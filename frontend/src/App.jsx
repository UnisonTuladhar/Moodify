import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home"; 
import ForgotPassword from "./pages/ForgotPassword"; 
import Dashboard from "./pages/Dashboard"; 
import Settings from "./pages/Settings"; 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> 
        <Route path="/home" element={<Home />} /> 
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/settings" element={<Settings />} />  
      </Routes>
    </BrowserRouter>
  );
}