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
      <div className="hero-panel">
        <div className="hero-diagonal-overlay"></div>
        <div className="hero-scan-lines">
          <div className="scan-corner scan-tl"></div>
          <div className="scan-corner scan-tr"></div>
          <div className="scan-corner scan-bl"></div>
          <div className="scan-corner scan-br"></div>
          {/* Lucide headphones icon with scan line animation */}
          <div className="hero-scan-face-inner">
            <svg viewBox="0 0 200 220" width="200" height="220" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff4e00" stopOpacity="0" />
                  <stop offset="50%" stopColor="#ec008c" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ff4e00" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="hpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4e00" />
                  <stop offset="100%" stopColor="#ec008c" />
                </linearGradient>
                <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4e00" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#ec008c" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* Soft background circle */}
              <circle cx="100" cy="100" r="72" fill="url(#bgGlow)" stroke="#ec008c" strokeWidth="1" strokeDasharray="3 4" opacity="0.5">
                <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" dur="18s" repeatCount="indefinite" />
              </circle>
              {/* Lucide headphones icon */}
              <path d="M52 105 C52 76.8 73.5 54 100 54 C126.5 54 148 76.8 148 105" fill="none" stroke="url(#hpGrad)" strokeWidth="7" strokeLinecap="round" />
              {/* Left ear cup */}
              <rect x="44" y="103" width="18" height="28" rx="7" fill="none" stroke="url(#hpGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              {/* Right ear cup */}
              <rect x="138" y="103" width="18" height="28" rx="7" fill="none" stroke="url(#hpGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              {/* Pulsing dot left */}
              <circle cx="53" cy="117" r="3.5" fill="#ff4e00" opacity="0.9">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="r" values="3;4.5;3" dur="1.8s" begin="0s" repeatCount="indefinite" />
              </circle>
              {/* Pulsing dot right */}
              <circle cx="147" cy="117" r="3.5" fill="#ec008c" opacity="0.9">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
                <animate attributeName="r" values="3;4.5;3" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
              </circle>
              {/* Sound wave lines — left */}
              <line x1="30" y1="108" x2="38" y2="108" stroke="#ff4e00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0s" repeatCount="indefinite" />
              </line>
              <line x1="26" y1="117" x2="36" y2="117" stroke="#ff4e00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.15s" repeatCount="indefinite" />
              </line>
              <line x1="30" y1="126" x2="38" y2="126" stroke="#ff4e00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              </line>
              {/* Sound wave lines — right */}
              <line x1="162" y1="108" x2="170" y2="108" stroke="#ec008c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
              </line>
              <line x1="164" y1="117" x2="174" y2="117" stroke="#ec008c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.75s" repeatCount="indefinite" />
              </line>
              <line x1="162" y1="126" x2="170" y2="126" stroke="#ec008c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.9s" repeatCount="indefinite" />
              </line>
              {/* Scanning sweep line */}
              <line x1="28" y1="0" x2="172" y2="0" stroke="url(#scanGrad)" strokeWidth="1.5" opacity="0.75">
                <animateTransform attributeName="transform" type="translate" values="0,40;0,175;0,40" dur="2.6s" repeatCount="indefinite" />
              </line>
              {/* Label */}
              <text x="100" y="198" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ec008c" letterSpacing="2.5" opacity="0.75" fontFamily="inherit">MOODIFY</text>
            </svg>
          </div>
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
            <div className="feat-card feat-card--clickable" onClick={() => navigate("/about")} style={{cursor: "pointer"}}>
              <div className="feat-icon"></div>
              <h3>Facial Analysis</h3>
              <p>We use advanced Computer Vision to analyze facial landmarks in real-time.</p>
              <span className="feat-learn-more">Learn more </span>
            </div>
            <div className="feat-card feat-card--clickable" onClick={() => navigate("/about")} style={{cursor: "pointer"}}>
              <div className="feat-icon"></div>
              <h3>AI Detection</h3>
              <p>Our trained neural network identifies emotions like Happy, Sad, Angry, Neutral and Surprised.</p>
              <span className="feat-learn-more">Learn more </span>
            </div>
            <div className="feat-card feat-card--clickable" onClick={() => navigate("/about")} style={{cursor: "pointer"}}>
              <div className="feat-icon"></div>
              <h3>Smart Playlists</h3>
              <p>Instantly receive music recommendations that match or enhance your current mood.</p>
              <span className="feat-learn-more">Learn more </span>
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
