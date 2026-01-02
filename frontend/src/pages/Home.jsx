import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [isCamOpen, setIsCamOpen] = useState(false);
   const [userName, setUserName] = useState("User");

   useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) setUserName(storedName);
  }, []);

  return (
    <div className="music-home-container">
      {/* Navbar */}
      <nav className="music-nav">
        <div className="music-logo">Moodify</div>
        <button className="music-logout-btn" onClick={() => navigate('/login')}>Logout</button>
      </nav>
      
      <div className="music-home-content">
        <header className="music-welcome-header">
          <h1>Welcome back, User!</h1>
          <p>What's the vibe today? Choose your destination.</p>
          
          {/* Button to toggle Camera */}
          <div style={{ marginTop: "20px" }}>
            {!isCamOpen ? (
              <button 
                className="music-main-btn" 
                style={{ width: "250px" }} 
                onClick={() => setIsCamOpen(true)}
              >
                📸 Detect My Mood
              </button>
            ) : (
              <button 
                className="music-logout-btn" 
                onClick={() => setIsCamOpen(false)}
              >
                ❌ Close Camera
              </button>
            )}
          </div>
        </header>

        {/* CAMERA DISPLAY AREA */}
        {isCamOpen && (
          <div className="camera-section">
            <div 
              className="camera-box" 
              style={{ 
                minHeight: "350px", 
                backgroundColor: "#000", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                borderRadius: "20px",
                overflow: "hidden",
                border: "4px solid #fff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
              }}
            >
              <img 
                // The key and timestamp force a fresh connection to the Flask server
                key={Date.now()}
                src={`http://127.0.0.1:5000/video_feed?t=${Date.now()}`} 
                alt="Live Emotion Feed" 
                style={{ 
                  width: "100%", 
                  height: "auto", 
                  display: "block" 
                }}
                onError={(e) => {
                  console.error("Camera failed to load");
                  e.target.src = "https://via.placeholder.com/500x350?text=Camera+Connection+Error";
                }}
              />
            </div>
            <p className="camera-hint">Scanning your face for emotions...</p>
          </div>
        )}

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