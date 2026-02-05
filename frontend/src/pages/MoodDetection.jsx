import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import "../styles/Home.css";
import profileImg from "../images/profile.jpg"; 
import Footer from "./Footer";

export default function MoodDetection() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [isDetecting, setIsDetecting] = useState(false);

  const [liveMood, setLiveMood] = useState("Detecting...");
  const [confirmedMood, setConfirmedMood] = useState(null);
  const [stabilityScore, setStabilityScore] = useState(0); // 0 to 5
  const lastMoodRef = useRef("");
  const stabilityCountRef = useRef(0);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    let interval;
    
    if (isDetecting && !confirmedMood) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get("http://127.0.0.1:5000/get_mood");
          const mood = res.data.mood;
          setLiveMood(mood);

          // if mood remains same for 5 seconds
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
    }

    return () => clearInterval(interval);
  }, [isDetecting, confirmedMood]); 

  // Reset logic to allow detecting again
  const handleDetectAgain = () => {
      setConfirmedMood(null);
      setStabilityScore(0);
      setLiveMood("Detecting...");
      stabilityCountRef.current = 0;
      lastMoodRef.current = "";
  };

  return (
    <div className="music-home-container">
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
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      <div className="music-home-content">
        <header className="music-welcome-header">
            <button className="music-logout-btn" onClick={() => navigate("/home")} style={{marginBottom: '20px'}}>
                ← Back to Dashboard
            </button>
            <h1>Mood Detection</h1>
            <p>Please hold still while we analyze your mood.</p>
        </header>

        {/* Show Start Button if not detecting */}
        {!isDetecting ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <div className="music-card" style={{ maxWidth: "500px", margin: "0 auto" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "20px" }}>📸</div>
                    <h3>Start Facial Analysis</h3>
                    <p>Click the button below to open your camera and start the detection process.</p>
                    <button 
                        className="music-main-btn large-btn" 
                        onClick={() => setIsDetecting(true)}
                    >
                        ✨ Start Detection
                    </button>
                </div>
            </div>
        ) : (
            /* CAMERA DISPLAY AREA */
            <div className="detection-layout">
                {/* LEFT SIDE: CAMERA */}
                <div className="camera-side">
                <div 
                    className="camera-box" 
                    style={{ 
                    backgroundColor: "#000", 
                    borderRadius: "24px",
                    overflow: "hidden",
                    border: "6px solid #fff",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
                    }}
                >
                    {/* The camera feed stays open even after detection is finished */}
                    <img 
                    src={`http://127.0.0.1:5000/video_feed?t=${Date.now()}`} 
                    alt="Live Emotion Feed" 
                    style={{ width: "100%", height: "auto", display: "block" }}
                    />
                </div>
                
                {/* STABILITY PROGRESS BAR */}
                <div className="stability-container">
                    {confirmedMood ? (
                        <p style={{color: '#27ae60', fontWeight: 'bold'}}>Detection Complete!</p>
                    ) : (
                        <p>Analyzing expression stability...</p>
                    )}
                    <div className="stability-bar-bg">
                    <div className="stability-bar-fill" style={{ width: `${(stabilityScore / 5) * 100}%` }}></div>
                    </div>
                </div>
                </div>

                {/* RIGHT SIDE: RESULTS */}
                <div className="results-side">
                <div className="mood-result-card">
                    <h3>Analysis Results</h3>
                    <p className="live-indicator">
                        {confirmedMood ? "● Detection Paused" : `● Live: ${liveMood}`}
                    </p>
                    
                    <div className="final-mood-box">
                    {confirmedMood ? (
                        <>
                        <p>Detected Mood:</p>
                        <h2 className="detected-mood-text">{confirmedMood}</h2>
                        <button className="recommendation-btn" onClick={() => alert(`Finding ${confirmedMood} music...`)}>
                            🎵 Get Playlist
                        </button>
                        <button 
                            className="music-card-btn" 
                            style={{marginTop: '15px', width: '100%', border: '1px solid #ddd'}} 
                            onClick={handleDetectAgain}
                        >
                            🔄 Detect Mood Again
                        </button>
                        </>
                    ) : (
                        <p className="waiting-text">Hold still for 5 seconds to confirm mood...</p>
                    )}
                    </div>
                </div>
                </div>
            </div>
        )}
      </div>
      <Footer />
    </div>
  );
}