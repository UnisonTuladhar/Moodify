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
  const [playlist, setPlaylist] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  const [likeToast, setLikeToast] = useState(null);
  const userEmail = localStorage.getItem("email");
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  
  const showToast = (msg, isError = false) => {
    setLikeToast({ msg, isError });
    setTimeout(() => setLikeToast(null), 2500);
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
        // Reset tab to "all" whenever a new playlist is loaded
        setActiveTab("all");
        // Fetch the user's liked song IDs so hearts render correctly
        fetchLikedSongIds();
      } catch (err) {
          console.error("Error fetching playlist", err);
          alert("Failed to fetch songs.");
      } finally {
          setPlaylistLoading(false);
      }
  };

  const fetchLikedSongIds = async () => {
      if (!userEmail) return;
      try {
          const res = await axios.post("http://127.0.0.1:5000/user/liked-song-ids", {
              email: userEmail
          });
          console.log("Liked song IDs loaded:", res.data);
          setLikedSongIds(new Set(res.data.map(String)));
      } catch (err) {
          console.error("Failed to fetch liked song IDs:", err);
      }
  };
  // Toggle like / unlike for a song
  const handleLikeSong = async (song) => {
      if (!userEmail) {
          showToast("Please log in to like songs.", true);
          return;
      }
      // Safely build song_id 
      const songIdStr = String(song.id);

      // Safely extract all fields with fallbacks for missing data
      const payload = {
          email:       userEmail,
          song_id:     songIdStr,
          song_title:  song.title  || "Unknown Title",
          song_artist: song.artist || "Unknown Artist",
          song_mood:   song.mood   || confirmedMood || "Unknown",
          song_image:  song.image  || null,
          song_source: song.is_api ? "jamendo" : "local",
          file_path:   song.file_path || ""
      };

      console.log("Like payload:", payload);

      try {
          const res = await axios.post("http://127.0.0.1:5000/user/like-song", payload);
          console.log("Like response:", res.data);

          // Update the local liked set 
          setLikedSongIds(prev => {
              const updated = new Set(prev);
              if (res.data.liked) {
                  updated.add(songIdStr);
                  showToast("♥ Added to Liked Songs!");
              } else {
                  updated.delete(songIdStr);
                  showToast("Removed from Liked Songs");
              }
              return updated;
          });
      } catch (err) {
          const errMsg = err.response?.data?.error || err.message || "Unknown error";
          console.error("Failed to toggle like:", errMsg, err.response);
          showToast("Error: " + errMsg, true);
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
      setActiveTab("all");
  };
  // Filter playlist based on active tab
  const filteredPlaylist = playlist.filter((song) => {
    if (activeTab === "all") return true;
    if (activeTab === "ai") return song.is_api === true;
    if (activeTab === "admin") return song.is_api === false;
    return true;
  });

  // SVG heart icons — avoids emoji rendering issues across browsers/OS
  const HeartFilled = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
  const HeartOutline = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );

  return (
    <div className="music-home-container detect-page-bg">

      {/* TOAST NOTIFICATION — shows like/unlike feedback */}
      {likeToast && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          background: likeToast.isError ? "#e74c3c" : "#1a1614",
          color: "#fff",
          padding: "12px 28px",
          borderRadius: "30px",
          fontSize: "0.9rem",
          fontWeight: "600",
          zIndex: 9999,
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          animation: "fadeIn 0.3s ease",
          whiteSpace: "nowrap"
        }}>
          {likeToast.msg}
        </div>
      )}

      <div className={`detect-hero-panel ${isDetecting ? "detect-hero-compact" : ""}`}>

        <nav className="music-nav detect-hero-nav">
          <div className="music-logo" onClick={() => navigate("/home")} style={{cursor:"pointer"}}>Moodify</div>
          <div className="profile-container" style={{position:"relative"}}>
            <img src={profileImg} alt="profile" className="profile-icon-img"
              onClick={() => setShowDropdown(!showDropdown)} />
            {showDropdown && (
              <div className="profile-dropdown" style={{right:0, left:"auto"}}>
                <p onClick={() => navigate("/home")}>Home</p>
                <p onClick={() => navigate("/dashboard")}>Dashboard</p>
                <p onClick={() => navigate("/settings")}>Settings</p>
                <p onClick={handleLogout} className="dropdown-logout">Logout</p>
              </div>
            )}
          </div>
        </nav>

        {/* Diagonal right accent */}
        <div className="detect-diagonal-overlay"></div>

        {/* Animated scan box on right */}
        <div className="detect-scan-box">
          <div className="detect-scan-corner detect-tl"></div>
          <div className="detect-scan-corner detect-tr"></div>
          <div className="detect-scan-corner detect-bl"></div>
          <div className="detect-scan-corner detect-br"></div>
          {/* <div className="detect-scan-face">😐</div> */}
        </div>

        {!isDetecting && (
          <div className="detect-hero-content">
            <div className="detect-hero-badge">AI Powered Emotion Recognition</div>
            <h1 className="detect-hero-title">Mood Detection</h1>
            <p className="detect-hero-subtitle">
              Please stay still while we analyze your facial expressions.
              Our AI will detect your emotion in just 3 seconds.
            </p>
            <div className="detect-steps">
              <div className="detect-step">
                <div className="detect-step-num">1</div>
                <span>Start Detection</span>
              </div>
              <div className="detect-step-arrow">→</div>
              <div className="detect-step">
                <div className="detect-step-num">2</div>
                <span>Detect Emotion</span>
              </div>
              <div className="detect-step-arrow">→</div>
              <div className="detect-step">
                <div className="detect-step-num">3</div>
                <span>Get playlist</span>
              </div>
            </div>
            <div style={{display:"flex", gap:"14px", flexWrap:"wrap"}}>
              <button className="detect-start-btn" onClick={() => setIsDetecting(true)}>
                ✦ Start Detection
              </button>
              <button className="detect-back-btn" onClick={() => navigate("/home")}>
                ← Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Compact bar when camera active */}
        {isDetecting && (
          <div className="detect-hero-compact-bar">
            <button className="back-link-btn" onClick={() => navigate("/home")}>← Back to Home</button>
            <div className="detect-compact-title">
              <span className="detect-live-dot"></span>
              Mood Detection — Live
            </div>
          </div>
        )}
      </div>

      {/* CAMERA + RESULTS */}
      {isDetecting && (
        <div className="music-home-content detection-wrapper">
          <div className="detection-layout">
            {/* LEFT SIDE: CAMERA */}
            <div className="camera-side">
                <div className="camera-box">
                    <img src={`http://127.0.0.1:5000/video_feed?t=${Date.now()}`}
                        alt="Live Emotion Feed" className="camera-feed" />
                </div>
                {/* STABILITY PROGRESS BAR */}
                <div className="stability-container">
                    {confirmedMood ? (
                        <p style={{color:"#27ae60", fontWeight:"bold", fontSize:"1.1rem"}}>Detection Complete!</p>
                    ) : (
                        <p style={{color:"#555"}}>Analyzing expression stability...</p>
                    )}
                    <div className="stability-bar-bg">
                        <div className="stability-bar-fill" style={{width:`${Math.min((stabilityScore/3)*100,100)}%`}}></div>
                    </div>
                </div>
            </div>
            {/* RIGHT SIDE: RESULTS */}
            <div className="results-side">
                <div className="mood-result-card">
                    <h3>Analysis Results</h3>
                    <p className="live-indicator">
                        {confirmedMood ? "⏸ Detection Paused" : `🔴 Live: ${liveMood}`}
                    </p>
                    <div className="final-mood-box">
                    {confirmedMood ? (
                        <>
                            <p style={{fontSize:"1rem", color:"#666"}}>Detected Mood:</p>
                            <h2 className="detected-mood-text">{confirmedMood}</h2>
                            <button className="recommendation-btn" onClick={handleGetPlaylist} disabled={playlistLoading}>
                                {playlistLoading ? "Loading Tracks..." : "🎵 Get Playlist"}
                            </button>
                            <button className="music-card-btn"
                                style={{marginTop:"15px", width:"100%", border:"1px solid #ddd"}}
                                onClick={handleDetectAgain}>
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

          {/* PLAYLIST SECTION */}
          {playlist.length > 0 && (
              <div className="music-card full-width-card" style={{marginTop:"40px", textAlign:"left", animation:"fadeIn 1s ease"}}>
                  <h3>Recommended {confirmedMood} Songs</h3>
                  <p style={{color:"#666", marginBottom:"20px"}}>Based on your detected emotion, here are some tracks to listen.</p>
                  {/* PLAYLIST TAB FILTER */}
                  <div className="playlist-tabs">
                      <button className={`playlist-tab-btn ${activeTab==="all"?"active":""}`} onClick={() => setActiveTab("all")}>🎵 All Tracks</button>
                      <button className={`playlist-tab-btn ${activeTab==="ai"?"active":""}`} onClick={() => setActiveTab("ai")}>✨ Smart Picks</button>
                      <button className={`playlist-tab-btn ${activeTab==="admin"?"active":""}`} onClick={() => setActiveTab("admin")}>🎧 Curator's Choice</button>
                  </div>
                  {/* FILTERED SONG LIST */}
                  <div className="playlist-grid">
                      {filteredPlaylist.length > 0 ? (
                          filteredPlaylist.map((song, index) => (
                              <div key={index} className="song-item" style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"15px", borderBottom:"1px solid #eee"}}>
                                  <div style={{display:"flex", alignItems:"center", gap:"15px"}}>
                                      {song.image ? (
                                          <img src={song.image} alt="album" style={{width:"55px", height:"55px", borderRadius:"8px", objectFit:"cover"}} />
                                      ) : (
                                          <div style={{width:"55px", height:"55px", background:"#eee", borderRadius:"8px", display:"flex", justifyContent:"center", alignItems:"center", fontSize:"1.5rem"}}>🎵</div>
                                      )}
                                      <div>
                                          <h4 style={{margin:0, color:"#333"}}>{song.title || "Unknown Title"}</h4>
                                          <p style={{margin:0, color:"#888", fontSize:"0.85rem"}}>
                                              {song.artist || "Unknown Artist"} • {song.is_api ? "Free Jamendo Library" : "Local Admin Song"}
                                          </p>
                                      </div>
                                  </div>
                                  {/* AUDIO + LIKE BUTTON */}
                                  <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                                      <audio controls src={song.is_api ? song.file_path : `http://127.0.0.1:5000/songs/${song.file_path}`} style={{height:"35px"}}></audio>
                                      <button
                                          className={`like-btn ${likedSongIds.has(String(song.id)) ? "liked" : ""}`}
                                          onClick={() => handleLikeSong(song)}
                                          title={likedSongIds.has(String(song.id)) ? "Unlike this song" : "Like this song"}
                                      >
                                          {likedSongIds.has(String(song.id)) ? <HeartFilled /> : <HeartOutline />}
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div style={{textAlign:"center", padding:"40px", color:"#aaa"}}>
                              <div style={{fontSize:"2.5rem", marginBottom:"10px"}}>🎶</div>
                              <p style={{fontWeight:"600", color:"#888"}}>No tracks in this category yet.</p>
                              <p style={{fontSize:"0.85rem"}}>Try switching to another tab or refresh the playlist.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}
