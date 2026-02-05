import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
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
  const [stabilityScore, setStabilityScore] = useState(0); // 0 to 5
  const lastMoodRef = useRef("");
  const stabilityCountRef = useRef(0);

  useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) setUserName(storedName);
  }, []);

  useEffect(() => {
    let interval;
    if (isCamOpen) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get("http://127.0.0.1:5000/get_mood");
          const mood = res.data.mood;
          setLiveMood(mood);

          // Logic to check if mood remains same for 5 seconds
          if (mood !== "None" && mood !== "No Face Found" && mood === lastMoodRef.current) {
            stabilityCountRef.current += 1;
          } else {
            stabilityCountRef.current = 0;
            lastMoodRef.current = mood;
          }

          setStabilityScore(stabilityCountRef.current);

          if (stabilityCountRef.current >= 5) {
            setConfirmedMood(mood);
          }
        } catch (err) {
          console.error("Error fetching mood from backend");
        }
      }, 1000);
    } else {
      // Reset when camera closes
      setStabilityScore(0);
      setConfirmedMood(null);
      stabilityCountRef.current = 0;
    }
    return () => clearInterval(interval);
  }, [isCamOpen]);

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
            {/* Action changed to navigate to separate page */}
            <button 
              className="music-main-btn large-btn" 
              onClick={() => navigate("/detect-mood")}
            >
              ✨ Detect My Mood
            </button>
          </div>
        </header>

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
      </div>

       <Footer /> 
    </div>
  );
}