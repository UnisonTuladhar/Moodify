import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import profileImg from "../images/profile.jpg"; 
import Footer from "./Footer";

export default function Home() {
  const navigate = useNavigate();
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) setUserName(storedName);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="music-home-container">
      {/* Navbar */}
      <nav className="music-nav">
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
        {/* HERO SECTION */}
        <header className="music-welcome-header">
          <div className="hero-badge">AI Powered Emotion Recognition</div>
          <h1>Welcome back, <span className="highlight-text">{userName}</span>!</h1>
          <p className="hero-subtitle">
            Experience music that resonates with your soul. Our AI detects your facial 
            expressions to curate the perfect playlist for your current mood.
          </p>
          
          <div style={{ marginTop: "30px" }}>
            {!isCamOpen ? (
              <button 
                className="music-main-btn large-btn" 
                onClick={() => setIsCamOpen(true)}
              >
                ✨ Detect My Mood
              </button>
            ) : (
              <button 
                className="music-logout-btn" 
                onClick={() => setIsCamOpen(false)}
              >
                Close Camera
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
                minHeight: "500px", 
                maxWidth: "800px",
                width: "100%",
                backgroundColor: "#000", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                borderRadius: "24px",
                overflow: "hidden",
                border: "6px solid #fff",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
              }}
            >
              <img 
                key={Date.now()}
                src={`http://127.0.0.1:5000/video_feed?t=${Date.now()}`} 
                alt="Live Emotion Feed" 
                style={{ width: "100%", height: "auto", display: "block" }}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x500?text=Camera+Connection+Error";
                }}
              />
            </div>
            <p className="camera-hint">Scanning your face... Stay still for accurate detection.</p>
          </div>
        )}

        {/* NEW CONTENT AREA: FEATURE CARDS */}
        {!isCamOpen && (
          <section className="features-section">
            <h2 className="section-title">How Moodify Works</h2>
            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon">📸</div>
                <h3>Facial Analysis</h3>
                <p>We use advanced Computer Vision to analyze facial landmarks in real-time.</p>
              </div>
              <div className="feat-card">
                <div className="feat-icon">🧠</div>
                <h3>AI Detection</h3>
                <p>Our trained neural network identifies emotions like Happy, Sad, Angry, Neutral, Surprised, Fearful and Disgusted.</p>
              </div>
              <div className="feat-card">
                <div className="feat-icon">🎵</div>
                <h3>Smart Playlists</h3>
                <p>Instantly receive music recommendations that match or enhance your current mood.</p>
              </div>
            </div>
          </section>
        )}
        
      </div>

       <Footer /> 
    </div>
  );
}