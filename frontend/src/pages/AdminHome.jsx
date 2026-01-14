import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
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
      <nav className="music-nav" style={{borderTop: "5px solid #8e44ad"}}>
        <div className="music-logo">Moodify <span style={{fontSize: "0.8rem", color: "#8e44ad"}}>ADMIN PANEL</span></div>
        
        {/* Profile Icon Dropdown */}
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