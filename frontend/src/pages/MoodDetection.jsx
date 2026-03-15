import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import "../styles/Shared.css";
import "../styles/MoodDetection.css";
import profileImg from "../images/profile.jpg"; 
import Footer from "./Footer";

export default function MoodDetection() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [liveMood, setLiveMood] = useState("Detecting...");
  const [confirmedMood, setConfirmedMood] = useState(null);
  const [stabilityScore, setStabilityScore] = useState(0); 
  const lastMoodRef = useRef("");
  const stabilityCountRef = useRef(0);

  // Playlist State
  const [playlist, setPlaylist] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  // Get user email for saving history
  const userEmail = localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Save mood to database
  const saveMoodToDB = async (mood) => {
      if (!userEmail) return;
      try {
          await axios.post("http://127.0.0.1:5000/save-mood", {
              email: userEmail,
              emotion: mood
          });
          console.log("Mood saved to history:", mood);
      } catch (err) {
          console.error("Failed to save mood history", err);
      }
  };

  // Fetch playlist based on mood 
  const handleGetPlaylist = async () => {
      if(!confirmedMood) return;
      setPlaylistLoading(true);
      try {
        console.log("Requesting tracks for mood:", confirmedMood);
        const res = await axios.post("http://127.0.0.1:5000/user/get-playlist", { mood: confirmedMood });
        console.log("Data received from server:", res.data);
        setPlaylist(res.data);
      } catch (err) {
          console.error("Error fetching playlist", err);
          alert("Failed to fetch songs.");
      } finally {
          setPlaylistLoading(false);
      }
  };

  useEffect(() => {
    let interval;
    
    if (isDetecting && !confirmedMood) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get("http://127.0.0.1:5000/get_mood");
          const mood = res.data.mood;
          setLiveMood(mood);

          // Mood check for 3 seconds
          if (mood !== "None" && mood !== "No Face Found" && mood === lastMoodRef.current) {
            stabilityCountRef.current += 1;
          } else {
            stabilityCountRef.current = 0;
            lastMoodRef.current = mood;
          }

          setStabilityScore(stabilityCountRef.current);

          if (stabilityCountRef.current >= 3) {
            setConfirmedMood(mood);
            saveMoodToDB(mood); 
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
      setPlaylist([]);
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
               <p onClick={() => navigate("/home")}>Home</p>
               <p onClick={() => navigate("/dashboard")}>Dashboard</p>
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      <div className="back-button-container">
         <button className="back-link-btn" onClick={() => navigate("/home")}>
            ← Back to Home
         </button>
      </div>

      <div className="music-home-content detection-wrapper">
        <header className="music-welcome-header">
            <h1>Mood Detection</h1>
            <p>Please stay still while we analyze your mood.</p>
        </header>

        {/* Show Start Button if not detecting */}
        {!isDetecting ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
                <div className="music-card" style={{ maxWidth: "500px", margin: "0 auto", padding: "60px 40px" }}>
                    <div style={{ fontSize: "5rem", marginBottom: "20px" }}>📷</div>
                    <h3>Start Facial Analysis</h3>
                    <p style={{marginBottom: "30px", color: "#666"}}>Click the button below to open your camera and start the detection process.</p>
                    <button 
                        className="music-main-btn large-btn" 
                        onClick={() => setIsDetecting(true)}
                        style={{background: 'linear-gradient(90deg, #ff4e00, #ec008c)'}}
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
                    <div className="camera-box">
                        <img 
                            src={`http://127.0.0.1:5000/video_feed?t=${Date.now()}`} 
                            alt="Live Emotion Feed" 
                            className="camera-feed"
                        />
                    </div>
                    
                    {/* STABILITY PROGRESS BAR */}
                    <div className="stability-container">
                        {confirmedMood ? (
                            <p style={{color: '#27ae60', fontWeight: 'bold', fontSize: '1.1rem'}}>Detection Complete!</p>
                        ) : (
                            <p style={{color: '#555'}}>Analyzing expression stability...</p>
                        )}
                        <div className="stability-bar-bg">
                            <div className="stability-bar-fill" style={{ width: `${Math.min((stabilityScore / 3) * 100, 100)}%` }}></div>
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
                                <p style={{fontSize: '1rem', color: '#666'}}>Detected Mood:</p>
                                <h2 className="detected-mood-text">{confirmedMood}</h2>
                                
                                <button className="recommendation-btn" onClick={handleGetPlaylist} disabled={playlistLoading}>
                                    {playlistLoading ? "Loading Tracks..." : "🎵 Get Playlist"}
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
                            <p className="waiting-text">Hold still for 3 seconds to confirm mood...</p>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* PLAYLIST SECTION - Shows Songs from API + Local */}
        {playlist.length > 0 && (
            <div className="music-card full-width-card" style={{marginTop: '40px', textAlign: 'left', animation: 'fadeIn 1s ease'}}>
                <h3>Recommended {confirmedMood} Songs</h3>
                <p style={{color: '#666', marginBottom: '20px'}}>Based on your detected emotion, here are some tracks to listen.</p>
                
                <div className="playlist-grid">
                    {playlist.map((song, index) => (
                        <div key={index} className="song-item" style={{display: 'flex', justifyContent:'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                {song.image ? (
                                    <img src={song.image} alt="album" style={{width: '55px', height: '55px', borderRadius: '8px', objectFit: 'cover'}} />
                                ) : (
                                    <div style={{width: '55px', height: '55px', background: '#eee', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem'}}>🎵</div>
                                )}
                                <div>
                                    <h4 style={{margin: 0, color: '#333'}}>{song.title}</h4>
                                    <p style={{margin: 0, color: '#888', fontSize: '0.85rem'}}>
                                        {song.artist} • {song.is_api ? 'Free Jamendo Library' : 'Local Admin Song'}
                                    </p>
                                </div>
                            </div>
                            <audio 
                                controls 
                                src={song.is_api ? song.file_path : `http://127.0.0.1:5000/songs/${song.file_path}`} 
                                style={{height: '35px'}}
                            ></audio>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
      <Footer />
    </div>
  );
}