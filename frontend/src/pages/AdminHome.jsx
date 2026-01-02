import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function AdminHome() {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="music-home-container" style={{background: "#f0f2f5"}}>
      <nav className="music-nav" style={{borderTop: "5px solid #8e44ad"}}>
        <div className="music-logo">Moodify <span style={{fontSize: "0.8rem", color: "#8e44ad"}}>ADMIN PANEL</span></div>
        <button className="music-logout-btn" onClick={handleLogout}>Logout</button>
      </nav>

      <div className="music-home-content">
        <header className="music-welcome-header">
          <h1>System Overview</h1>
          <p>Welcome back, Admin <strong>{adminName}</strong>. Manage the application below.</p>
        </header>

        <div className="music-hub-grid">
          {/* Admin Tool 1 */}
          <div className="music-card" style={{borderColor: "#8e44ad"}}>
            <div className="music-card-icon">👥</div>
            <h3>User Management</h3>
            <p>View, edit, or delete registered users from the system.</p>
            <button className="music-card-btn">Manage Users</button>
          </div>

          {/* Admin Tool 2 */}
          <div className="music-card" style={{borderColor: "#8e44ad"}}>
            <div className="music-card-icon">📈</div>
            <h3>System Logs</h3>
            <p>Check emotion detection accuracy and server uptime.</p>
            <button className="music-card-btn">View Logs</button>
          </div>
          
          {/* Admin Tool 3 */}
          <div className="music-card" style={{borderColor: "#8e44ad"}}>
            <div className="music-card-icon">🎵</div>
            <h3>Library Control</h3>
            <p>Update music playlists and emotion-genre mapping.</p>
            <button className="music-card-btn">Edit Music</button>
          </div>
        </div>
      </div>
    </div>
  );
}