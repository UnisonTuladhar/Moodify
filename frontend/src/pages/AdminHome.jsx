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
      {/* Admin Navbar */}
      <nav className="music-nav" style={{borderTop: "5px solid #8e44ad"}}>
        <div className="music-logo" onClick={() => navigate("/admin-home")} style={{cursor:'pointer'}}>
          Moodify 
        </div>
        
        <div className="profile-container">
          <img 
            src={profileImg} 
            alt="profile" 
            className="profile-icon-img"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="profile-dropdown">
              <p onClick={() => navigate("/admin-dashboard")}>Dashboard</p>
              <p onClick={() => navigate("/admin-settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      {/* Admin Home Content */}
      <div className="music-home-content">
        <div className="admin-status-label">ADMIN PANEL</div>
        
        <header className="music-welcome-header">
          <h1>Welcome Back, <span className="highlight-text">{adminName}</span></h1>
          <p className="hero-subtitle">
            Manage users, monitor system analytics, and configure application settings from here.
          </p>
        </header>

        <div className="music-hub-grid" style={{marginTop: '50px'}}>
           {/* Dashboard */}
           <div className="music-card" onClick={() => navigate("/admin-dashboard")}>
            <div style={{fontSize: '3rem', marginBottom: '15px'}}></div>
            <h3>System Dashboard</h3>
            <button className="music-card-btn">Go to Dashboard</button>
          </div>

          {/* Settings */}
          <div className="music-card" onClick={() => navigate("/admin-settings")}>
            <div style={{fontSize: '3rem', marginBottom: '15px'}}></div>
            <h3>Admin Settings</h3>
            <button className="music-card-btn">Open Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}