import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import "../styles/Shared.css";
import "../styles/Home.css";
import profileImg from "../images/profile.jpg"; 
import Footer from "./Footer";
export default function Home() {
  const navigate = useNavigate();
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [showDropdown, setShowDropdown] = useState(false);
  const [liveMood, setLiveMood] = useState("Detecting...");
  const [confirmedMood, setConfirmedMood] = useState(null);
  const [stabilityScore, setStabilityScore] = useState(0); 
  const lastMoodRef = useRef("");
  const stabilityCountRef = useRef(0);
  useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) setUserName(storedName);
  }, []);
  useEffect(() => {
  }, []);
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  // Navigate to dashboard
  const handleMoodTileClick = (mood) => {
    navigate("/dashboard", { state: { moodFilter: mood } });
  };
  return (
    <div className="music-home-container">
      <div className="hero-panel">
        <nav className="music-nav hero-nav">
          <div className="music-logo hero-logo" onClick={() => navigate("/home")} style={{cursor:'pointer'}}>Moodify</div>
          <div className="profile-container">
            <img 
              src={profileImg} 
              alt="profile" 
              className="profile-icon-img hero-profile-img"
              onClick={() => setShowDropdown(!showDropdown)}
            />
            {showDropdown && (
              <div className="profile-dropdown">
                <p onClick={() => navigate("/dashboard")}>Dashboard</p>
                <p onClick={() => navigate("/detect-mood")}>Mood Detection</p>
                <p onClick={() => navigate("/playlists")}>Playlists</p>
                <p onClick={() => navigate("/settings")}>Settings</p>
                <p onClick={handleLogout} className="dropdown-logout">Logout</p>
              </div>
            )}
          </div>
        </nav>
        <div className="hero-diagonal-overlay"></div>
        <div className="hero-scan-lines">
          <div className="scan-corner scan-tl"></div>
          <div className="scan-corner scan-tr"></div>
          <div className="scan-corner scan-bl"></div>
          <div className="scan-corner scan-br"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">AI Powered Emotion Recognition</div>
          <h1 className="hero-title">
            Welcome back, <span className="highlight-text">{userName}</span>!
          </h1>
          <p className="hero-subtitle">
            Experience music that resonates with your soul. Our AI detects your facial 
            expressions to curate the perfect playlist for your current mood.
          </p>
          <div style={{ marginTop: "38px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <button 
              className="hero-cta-btn" 
              onClick={() => navigate("/detect-mood")}>Detect My Mood
            </button>
            <button
              className="hero-manual-btn"
              onClick={() => navigate("/user-manual")}>
              Learn How to Use Moodify
            </button>
          </div>
        </div>
      </div>
      <div className="music-home-content">
        <div className="section-divider"></div>
        {/* FEATURES SECTION */}
        <section className="features-section">
          <h2 className="section-title">How Moodify Works</h2>
          <div className="features-grid">
            {/* Clicking any of the 3 cards navigates to the About Us page */}
            <div className="feat-card feat-card--clickable" onClick={() => navigate("/about")} style={{cursor: "pointer"}}>
              <div className="feat-icon">
</div>
              <h3>Facial Analysis</h3>
              <p>We use advanced Computer Vision to analyze facial landmarks in real-time.</p>
              <span className="feat-learn-more">Learn more 
</span>
            </div>
            <div className="feat-card feat-card--clickable" onClick={() => navigate("/about")} style={{cursor: "pointer"}}>
              <div className="feat-icon">
</div>
              <h3>AI Detection</h3>
              <p>Our trained neural network identifies emotions like Happy, Sad, Angry, Neutral and Surprised.</p>
              <span className="feat-learn-more">Learn more 
</span>
            </div>
            <div className="feat-card feat-card--clickable" onClick={() => navigate("/about")} style={{cursor: "pointer"}}>
              <div className="feat-icon">
</div>
              <h3>Smart Playlists</h3>
              <p>Instantly receive music recommendations that match or enhance your current mood.</p>
              <span className="feat-learn-more">Learn more 
</span>
            </div>
          </div>
        </section>
        <div className="section-divider"></div>
        {/* MOOD PREVIEW GALLERY */}
        <section className="mood-gallery">
          <h2 className="section-title">Explore Your Emotions</h2>
          <p className="mood-gallery-subtitle">Click on a mood to view your history for that emotion</p>
          <div className="mood-grid">
            <div className="mood-tile happy" onClick={() => handleMoodTileClick("Happy")}> Happy</div>
            <div className="mood-tile sad" onClick={() => handleMoodTileClick("Sad")}> Sad</div>
            <div className="mood-tile angry" onClick={() => handleMoodTileClick("Angry")}> Angry</div>
            <div className="mood-tile neutral" onClick={() => handleMoodTileClick("Neutral")}> Neutral</div>
            <div className="mood-tile surprise" onClick={() => handleMoodTileClick("Surprise")}> Surprise</div>
          </div>
        </section>
        {/* ACTION BANNER */}
        <section className="cta-banner">
          <div className="cta-content">
            <h2>Track Your Emotional Journey</h2>
            <p>Visualize your mood patterns over time and gain deeper insights into your well-being.</p>
            <button className="cta-btn" onClick={() => navigate("/dashboard")}>View Mood Analytics</button>
          </div>
        </section>
      </div>
       <Footer /> 
    </div>
  );
}
