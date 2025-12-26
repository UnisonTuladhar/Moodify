import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="music-home-container">
      {/* Nav Bar */}
      <nav className="music-nav">
        <div className="music-logo">Moodify</div>
        <button className="music-logout-btn" onClick={() => navigate('/login')}>Logout</button>
      </nav>
      
      <div className="music-home-content">
        <header className="music-welcome-header">
          <h1>Welcome back, User!</h1>
          <p>What's the vibe today? Choose your destination.</p>
        </header>

        <div className="music-hub-grid">
          {/* Dashboard Card */}
          <div className="music-card" onClick={() => navigate('/dashboard')}>
            <div className="music-card-icon">📊</div>
            <h3>Music Dashboard</h3>
            <p>View your top tracks, analysis, and mood trends.</p>
            <button className="music-card-btn">Open Dashboard</button>
          </div>

          {/* Settings Card */}
          <div className="music-card" onClick={() => navigate('/settings')}>
            <div className="music-card-icon">⚙️</div>
            <h3>Account Settings</h3>
            <p>Manage your profile, preferences, and privacy.</p>
            <button className="music-card-btn">Go to Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}