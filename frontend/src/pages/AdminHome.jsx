import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Shared.css";
import "../styles/Admin.css";
import profileImg from "../images/profile.jpg"; 

export default function AdminHome() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const adminName = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="music-home-container" style={{background: "#f0f2f5"}}>
      <nav className="music-nav" style={{borderTop: "none"}}>
        <div className="music-logo">Moodify</div>
        
        <div className="profile-container">
          <img 
            src={profileImg} 
            alt="profile" 
            className="profile-icon-img"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="profile-dropdown">
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      <div className="music-home-content">
        <div className="admin-status-label">ADMIN PANEL</div>
        
        <header className="music-welcome-header">
          <h1>System Overview</h1>
          <p>Welcome back, Admin <strong>{adminName}</strong>.</p>
        </header>

        <div className="music-hub-grid">
           <div className="music-card" onClick={() => navigate("/manage-users")}>
            <h3>User Management</h3>
            <p>View registered users.</p>
            <button className="music-card-btn">Manage Users</button>
          </div>
        </div>
      </div>
    </div>
  );
}