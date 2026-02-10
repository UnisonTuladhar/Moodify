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

  return (
    <div className="music-home-container">
      {/* Navbar */}
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate("/home")} style={{cursor:'pointer'}}>Moodify</div>
        
        <div className="profile-container">
          <img 
            src={profileImg} 
            alt="profile" 
            className="profile-icon-img"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="profile-dropdown">
              <p onClick={() => navigate("/dashboard")}>Dashboard</p>
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>
      
      <div className="music-home-content">
        <header className="music-welcome-header">
          <div className="hero-badge">AI Powered Emotion Recognition</div>
          <h1>Welcome back, <span className="highlight-text">{userName}</span>!</h1>
          <p className="hero-subtitle">
            Experience music that resonates with your soul. Our AI detects your facial 
            expressions to curate the perfect playlist for your current mood.
          </p>
          
          <div style={{ marginTop: "30px" }}>
            <button 
              className="music-main-btn large-btn" 
              onClick={() => navigate("/detect-mood")}
            >
              ✨ Detect My Mood
            </button>
          </div>
        </header>

        <div className="section-divider"></div>

        {/* FEATURES SECTION */}
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

        <div className="section-divider"></div>


        {/* MOOD PREVIEW GALLERY */}
        <section className="mood-gallery">
          <h2 className="section-title">Explore Your Emotions</h2>
          <div className="mood-grid">
            <div className="mood-tile happy">😊 Happy</div>
            <div className="mood-tile sad">😢 Sad</div>
            <div className="mood-tile angry">😠 Angry</div>
            <div className="mood-tile neutral">😐 Neutral</div>
            <div className="mood-tile surprise">😲 Surprise</div>
            <div className="mood-tile fear">😨 Fear</div>
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