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
  const [languageFilter, setLanguageFilter] = useState("All");
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  const [likeToast, setLikeToast] = useState(null);
  const cameraImgRef = useRef(null);
  const pollingActiveRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const userEmail = localStorage.getItem("email");
  // ── PLAYLIST MODAL STATE ──
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [modalSong, setModalSong] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [addingToPlaylistId, setAddingToPlaylistId] = useState(null);
  // ── Shuffle loading state ──
  const [shuffling, setShuffling] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.removeItem("moodify_confirmed_mood");
    sessionStorage.removeItem("moodify_playlist");
    navigate("/login");
  };
  const showToast = (msg, isError = false) => {
    setLikeToast({ msg, isError });
    setTimeout(() => setLikeToast(null), 2500);
  };
  const startFramePolling = () => {
    // Stop any existing loop first
    pollingActiveRef.current = false;
    setCameraReady(false);
    // Small delay to let previous loop exit, then start fresh
    setTimeout(() => {
      pollingActiveRef.current = true;
      const fetchNextFrame = async () => {
        if (!pollingActiveRef.current) return;
        const frameStart = Date.now();
        try {
          const res = await fetch("http://127.0.0.1:5000/get_frame");
          if (res.status !== 204) {
            const blob = await res.blob();
            if (cameraImgRef.current && pollingActiveRef.current) {
              const newUrl = URL.createObjectURL(blob);
              const oldUrl = cameraImgRef.current.src;
              cameraImgRef.current.src = newUrl;
              setCameraReady(true);  
              if (oldUrl && oldUrl.startsWith("blob:")) {
                URL.revokeObjectURL(oldUrl);
              }
            } else {
              URL.revokeObjectURL(URL.createObjectURL(blob));
            }
          }
        } catch (err) {
        }
        if (pollingActiveRef.current) {
          const elapsed = Date.now() - frameStart;
          const wait = Math.max(0, 50 - elapsed);
          setTimeout(fetchNextFrame, wait);
        }
      };
      fetchNextFrame();
    }, 50);
  };
  const stopFramePolling = () => {
    pollingActiveRef.current = false;
    setCameraReady(false);
    if (cameraImgRef.current) {
      const oldUrl = cameraImgRef.current.src;
      cameraImgRef.current.src = "";
      if (oldUrl && oldUrl.startsWith("blob:")) {
        URL.revokeObjectURL(oldUrl);
      }
    }
  };
  useEffect(() => {
    const savedMood = sessionStorage.getItem("moodify_confirmed_mood");
    const savedPlaylist = sessionStorage.getItem("moodify_playlist");
    if (savedMood) {
      setConfirmedMood(savedMood);
      setIsDetecting(true);
      setStabilityScore(3);
      if (savedPlaylist) {
        try {
          setPlaylist(JSON.parse(savedPlaylist));
          fetchLikedSongIds();
        } catch (e) {
          console.error("Failed to restore playlist from session", e);
        }
      }
    }
    return () => {
      stopFramePolling();
    };
  }, []);
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
    if (!confirmedMood) return;
    setPlaylistLoading(true);
    try {
      console.log("Requesting tracks for mood:", confirmedMood);
      const res = await axios.post("http://127.0.0.1:5000/user/get-playlist", {
        mood: confirmedMood
      });
      console.log("Data received from server:", res.data);
      setPlaylist(res.data);
      sessionStorage.setItem("moodify_playlist", JSON.stringify(res.data));
      setActiveTab("all");
      fetchLikedSongIds();
    } catch (err) {
      console.error("Error fetching playlist", err);
      alert("Failed to fetch songs.");
    } finally {
      setPlaylistLoading(false);
    }
  };

  // Shuffle / refresh songs for the current mood
  const handleShuffleSongs = async () => {
    if (!confirmedMood) return;
    setShuffling(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/user/get-playlist", {
        mood: confirmedMood
      });
      setPlaylist(res.data);
      sessionStorage.setItem("moodify_playlist", JSON.stringify(res.data));
      setActiveTab("all");
      fetchLikedSongIds();
      showToast("🔀 New songs loaded!");
    } catch (err) {
      console.error("Error shuffling playlist", err);
      showToast("Failed to load new songs.", true);
    } finally {
      setShuffling(false);
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
    const songIdStr = String(song.id);
    const payload = {
      email: userEmail,
      song_id: songIdStr,
      song_title: song.title || "Unknown Title",
      song_artist: song.artist || "Unknown Artist",
      song_mood: song.mood || confirmedMood || "Unknown",
      song_image: song.image || null,
      song_source: song.is_api ? "jamendo" : "local",
      file_path: song.file_path || ""
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
  //OPEN PLAYLIST 
  const handleOpenPlaylistModal = async (song) => {
    if (showPlaylistModal && modalSong && String(modalSong.id) === String(song.id)) {
      handleClosePlaylistModal();
      return;
    }
    setModalSong(song);
    setShowPlaylistModal(true);
    setNewPlaylistName("");
    setCreatingPlaylist(false);
    setPlaylistsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/user/get-playlists", {
        email: userEmail
      });
      setUserPlaylists(res.data);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setPlaylistsLoading(false);
    }
  };
  // Close playlist model 
  const handleClosePlaylistModal = () => {
    setShowPlaylistModal(false);
    setModalSong(null);
    setNewPlaylistName("");
    setCreatingPlaylist(false);
  };
  // Create a new playlist and add song to it
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreatingPlaylist(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/user/create-playlist", {
        email: userEmail,
        name: newPlaylistName.trim()
      });
      const newPlaylistId = res.data.id;
      // Immediately add the song to the newly created playlist
      await handleAddSongToPlaylist(newPlaylistId, true);
      // Refresh playlists list
      const refreshed = await axios.post("http://127.0.0.1:5000/user/get-playlists", {
        email: userEmail
      });
      setUserPlaylists(refreshed.data);
      setNewPlaylistName("");
    } catch (err) {
      console.error("Failed to create playlist:", err);
      showToast("Failed to create playlist.", true);
    } finally {
      setCreatingPlaylist(false);
    }
  };
  // Add current modal song to a given playlist
  const handleAddSongToPlaylist = async (playlistId, silent = false) => {
    if (!modalSong) return;
    setAddingToPlaylistId(playlistId);
    const payload = {
      playlist_id: playlistId,
      song_id: String(modalSong.id),
      song_title: modalSong.title || "Unknown Title",
      song_artist: modalSong.artist || "Unknown Artist",
      song_mood: modalSong.mood || confirmedMood || "Unknown",
      song_image: modalSong.image || null,
      song_source: modalSong.is_api ? "jamendo" : "local",
      file_path: modalSong.file_path || ""
    };
    try {
      await axios.post("http://127.0.0.1:5000/user/add-to-playlist", payload);
      if (!silent) {
        showToast("✓ Added to playlist!");
        handleClosePlaylistModal();
      }
    } catch (err) {
      console.error("Failed to add song to playlist:", err);
      if (!silent) showToast("Failed to add song.", true);
    } finally {
      setAddingToPlaylistId(null);
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
            sessionStorage.setItem("moodify_confirmed_mood", mood);
            saveMoodToDB(mood);
            stopFramePolling();
            try {
              await axios.post("http://127.0.0.1:5000/stop_detection");
              console.log("Detection stopped on backend — camera released.");
            } catch (stopErr) {
              console.error("Failed to stop detection on backend", stopErr);
            }
          }
        } catch (err) {
          console.error("Error fetching mood from backend");
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDetecting, confirmedMood]);
  const handleStartDetection = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/start_detection");
      console.log("Detection started on backend.");
    } catch (err) {
      console.error("Failed to start detection on backend", err);
    }
    setIsDetecting(true);
    startFramePolling();
  };
  // Reset logic to allow detecting again.
  const handleDetectAgain = async () => {
    sessionStorage.removeItem("moodify_confirmed_mood");
    sessionStorage.removeItem("moodify_playlist");
    setConfirmedMood(null);
    setPlaylist([]);
    setStabilityScore(0);
    setLiveMood("Detecting...");
    stabilityCountRef.current = 0;
    lastMoodRef.current = "";
    setActiveTab("all");
    try {
      await axios.post("http://127.0.0.1:5000/start_detection");
      console.log("Detection restarted on backend.");
    } catch (err) {
      console.error("Failed to restart detection on backend", err);
    }
    startFramePolling();
  };
  // Filter playlist based on active tab
  const filteredPlaylist = playlist.filter((song) => {
    if (activeTab === "all") return true;
    if (activeTab === "ai") return song.is_api === true;
    if (activeTab === "admin") {
      if (song.is_api === true) return false;
      // Apply language filter; "All" shows every admin song
      if (languageFilter === "All") return true;
      return (song.language || "").trim().toLowerCase() === languageFilter.trim().toLowerCase();
    }
    return true;
  });
  // SVG heart icons 
  const HeartFilled = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
  const HeartOutline = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
  // SVG plus icon for add-to-playlist button
  const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
  // SVG shuffle/refresh icon for the shuffle button
  const ShuffleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  );
  // INLINE PLAYLIST DRAWER 
  const PlaylistDrawer = ({ song }) => {
    const isOpen = showPlaylistModal && modalSong && String(modalSong.id) === String(song.id);
    if (!isOpen) return null;
    const btnDisabled = (id) => addingToPlaylistId === id;
    return (
      <div style={{
        background: "#fff",
        border: "2px solid #e8d5f5",
        borderTop: "none",
        borderRadius: "0 0 14px 14px",
        padding: "16px 20px 8px",
        boxShadow: "0 10px 30px rgba(214,63,181,0.12)",
        animation: "drawerSlideDown 0.22s ease",
        marginBottom: "6px"
      }}>
        {/* Song being added — info strip */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid #f5f5f5" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#d63fb5", textTransform: "uppercase", letterSpacing: "0.8px" }}>Adding to playlist</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {song.title || "Unknown Title"}
          </span>
          <button
            onClick={handleClosePlaylistModal}
            style={{ background: "#f5f5f5", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#666", flexShrink: 0, fontWeight: 700 }}
          >✕</button>
        </div>
        {/* Create new playlist row */}
        <p style={{ margin: "0 0 8px 0", fontSize: "0.78rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.6px" }}>Create new</p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <input
            type="text"
            placeholder="New playlist name..."
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreatePlaylist(); }}
            className="playlist-name-input"
          />
          <button
            onClick={handleCreatePlaylist}
            disabled={creatingPlaylist || !newPlaylistName.trim()}
            style={{
              padding: "9px 14px",
              background: (creatingPlaylist || !newPlaylistName.trim()) ? "#f0f0f0" : "linear-gradient(135deg,#e05c2a,#d63fb5)",
              color: (creatingPlaylist || !newPlaylistName.trim()) ? "#bbb" : "#fff",
              border: "none", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700,
              cursor: (creatingPlaylist || !newPlaylistName.trim()) ? "not-allowed" : "pointer",
              whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0, transition: "all 0.2s"
            }}
          >
            {creatingPlaylist ? "Creating..." : "+ Create & Add"}
          </button>
        </div>
        {/* Divider */}
        {userPlaylists.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 10px 0", color: "#ccc", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            <div style={{ flex: 1, height: "1px", background: "#f0f0f0" }}></div>
            <span>or add to existing</span>
            <div style={{ flex: 1, height: "1px", background: "#f0f0f0" }}></div>
          </div>
        )}
        {/* Existing playlists */}
        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          {playlistsLoading ? (
            <p style={{ textAlign: "center", color: "#bbb", fontSize: "0.85rem", padding: "14px 0", margin: 0 }}>Loading your playlists...</p>
          ) : userPlaylists.length === 0 ? (
            <p style={{ textAlign: "center", color: "#bbb", fontSize: "0.85rem", padding: "14px 0", margin: 0 }}>No playlists yet — create one above!</p>
          ) : (
            userPlaylists.map(pl => (
              <button
                key={pl.id}
                onClick={() => handleAddSongToPlaylist(pl.id)}
                disabled={btnDisabled(pl.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 8px", background: "none", border: "none",
                  borderBottom: "1px solid #f8f8f8", cursor: btnDisabled(pl.id) ? "not-allowed" : "pointer",
                  textAlign: "left", borderRadius: "6px", transition: "background 0.15s",
                  fontFamily: "inherit", opacity: btnDisabled(pl.id) ? 0.55 : 1
                }}
                onMouseEnter={e => { if (!btnDisabled(pl.id)) e.currentTarget.style.background = "#fdf0ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
              >
                {/* Playlist cover or gradient icon */}
                <div style={{ width: "36px", height: "36px", borderRadius: "7px", background: "linear-gradient(135deg,#f5e6ff,#ffe6f0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0, overflow: "hidden" }}>
                  {pl.image
                    ? <img src={pl.image} alt={pl.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "7px" }} />
                    : "♪"
                  }
                </div>
                <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: btnDisabled(pl.id) ? "#aaa" : "#d63fb5", background: btnDisabled(pl.id) ? "#f5f5f5" : "rgba(214,63,181,0.09)", padding: "3px 10px", borderRadius: "20px", flexShrink: 0, transition: "all 0.15s" }}>
                  {btnDisabled(pl.id) ? "Adding..." : "Add"}
                </span>
              </button>
            ))
          )}
        </div>
        {/* View all playlists footer */}
        <button
          onClick={() => { handleClosePlaylistModal(); navigate("/playlists"); }}
          style={{ display: "block", width: "100%", padding: "10px", border: "none", borderTop: "1px solid #f5f5f5", background: "none", color: "#bbb", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", textAlign: "center", marginTop: "8px", fontFamily: "inherit", transition: "color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#d63fb5"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#bbb"; }}
        >
          ♪ View All My Playlists
        </button>
      </div>
    );
  };
  // ──
  return (
    <div className="music-home-container detect-page-bg">
      {/* Keyframe for the drawer slide-down animation */}
      <style>{`
        @keyframes drawerSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      {/* shows like/unlike feedback */}
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
      {/* NAV MOVED OUTSIDE detect-hero-panel so position:fixed works correctly */}
      <nav className="music-nav detect-hero-nav">
        <div className="music-logo" onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>Moodify</div>
        <div className="profile-container" style={{ position: "relative", zIndex: 200 }}>
          <img src={profileImg} alt="profile" className="profile-icon-img"
            onClick={() => setShowDropdown(!showDropdown)} />
          {showDropdown && (
            <div className="profile-dropdown" style={{ right: 0, left: "auto", zIndex: 300 }}>
              <p onClick={() => navigate("/home")}>Home</p>
              <p onClick={() => navigate("/dashboard")}>Dashboard</p>
              <p onClick={() => navigate("/playlists")}>Playlists</p>
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>
      <div className={`detect-hero-panel ${isDetecting ? "detect-hero-compact" : ""}`}>
        <div className="detect-diagonal-overlay"></div>
        <div className="detect-scan-box">
          <div className="detect-scan-corner detect-tl"></div>
          <div className="detect-scan-corner detect-tr"></div>
          <div className="detect-scan-corner detect-bl"></div>
          <div className="detect-scan-corner detect-br"></div>
          <div className="hero-scan-face-inner">
            <svg viewBox="0 0 200 220" width="200" height="220" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="detectScanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff4e00" stopOpacity="0" />
                  <stop offset="50%" stopColor="#ec008c" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ff4e00" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="detectMusicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4e00" />
                  <stop offset="100%" stopColor="#ec008c" />
                </linearGradient>
                <linearGradient id="detectBgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4e00" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#ec008c" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* Soft background circle */}
              <circle cx="100" cy="100" r="72" fill="url(#detectBgGlow)" stroke="#ec008c" strokeWidth="1" strokeDasharray="3 4" opacity="0.5">
                <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" dur="18s" repeatCount="indefinite" />
              </circle>
              {/* Lucide music note icon */}
              <circle cx="100" cy="105" r="45" fill="none" stroke="url(#detectMusicGrad)" strokeWidth="6" strokeLinecap="round" />
              {/* Eyes */}
              <circle cx="84" cy="95" r="5" fill="url(#detectMusicGrad)" />
              <circle cx="116" cy="95" r="5" fill="url(#detectMusicGrad)" />
              {/* Smile */}
              <path d="M82 115 Q100 132 118 115" fill="none" stroke="url(#detectMusicGrad)" strokeWidth="5.5" strokeLinecap="round" />
              {/* Pulsing eye left */}
              <circle cx="84" cy="95" r="5" fill="#ff4e00" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="r" values="4;6.5;4" dur="2s" begin="0s" repeatCount="indefinite" />
              </circle>
              {/* Pulsing eye right */}
              <circle cx="116" cy="95" r="5" fill="#ec008c" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
                <animate attributeName="r" values="4;6.5;4" dur="2s" begin="0.5s" repeatCount="indefinite" />
              </circle>
              {/* Sound wave lines — left */}
              <line x1="58" y1="90" x2="68" y2="90" stroke="#ff4e00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0s" repeatCount="indefinite" />
              </line>
              <line x1="54" y1="100" x2="66" y2="100" stroke="#ff4e00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.15s" repeatCount="indefinite" />
              </line>
              <line x1="58" y1="110" x2="68" y2="110" stroke="#ff4e00" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              </line>
              {/* Sound wave lines — right */}
              <line x1="162" y1="90" x2="172" y2="90" stroke="#ec008c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
              </line>
              <line x1="164" y1="100" x2="176" y2="100" stroke="#ec008c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.75s" repeatCount="indefinite" />
              </line>
              <line x1="162" y1="110" x2="172" y2="110" stroke="#ec008c" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.2s" begin="0.9s" repeatCount="indefinite" />
              </line>
              {/* Scanning sweep line */}
              <line x1="28" y1="0" x2="172" y2="0" stroke="url(#detectScanGrad)" strokeWidth="1.5" opacity="0.75">
                <animateTransform attributeName="transform" type="translate" values="0,40;0,175;0,40" dur="2.6s" repeatCount="indefinite" />
              </line>
              {/* Label */}
              <text x="100" y="198" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ec008c" letterSpacing="2.5" opacity="0.75" fontFamily="inherit">MOODIFY</text>
            </svg>
          </div>
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
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <button className="detect-start-btn" onClick={handleStartDetection}>
                Start Detection
              </button>
              <button className="detect-back-btn" onClick={() => navigate("/home")}>
                Back to Home
              </button>
            </div>
          </div>
        )}
        {/* Compact bar when camera active */}
        {isDetecting && (
          <div className="detect-hero-compact-bar">
            <button className="back-link-btn" onClick={() => navigate("/home")}> Back to Home</button>
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
                {confirmedMood ? (
                  <div style={{
                    width: "100%", height: "100%", minHeight: "300px",
                    background: "#1a1614", display: "flex", alignItems: "center",
                    justifyContent: "center", flexDirection: "column", gap: "10px",
                    borderRadius: "16px", color: "#fff"
                  }}>
                    <div style={{ fontSize: "3rem" }}>📷</div>
                    <p style={{ margin: 0, fontWeight: "600", fontSize: "1.1rem" }}>Mood Captured!</p>
                  </div>
                ) : (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    {/* Loading overlay — shown until first frame arrives */}
                    {!cameraReady && (
                      <div style={{
                        position: "absolute", inset: 0, zIndex: 2,
                        background: "#111", borderRadius: "16px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "14px", color: "#aaa"
                      }}>
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "50%",
                          border: "4px solid #333", borderTopColor: "#ec008c",
                          animation: "spin 0.9s linear infinite"
                        }} />
                        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>Starting camera...</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>This may take a few seconds</p>
                      </div>
                    )}
                    <img ref={cameraImgRef} alt="Live Emotion Feed" className="camera-feed"
                      style={{
                        width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px", display: "block",
                        opacity: cameraReady ? 1 : 0, transition: "opacity 0.4s ease"
                      }} />
                  </div>
                )}
              </div>
              {/* STABILITY PROGRESS BAR */}
              <div className="stability-container">
                {confirmedMood ? (
                  <p style={{ color: "#27ae60", fontWeight: "bold", fontSize: "1.1rem" }}>Detection Complete!</p>
                ) : (
                  <p style={{ color: "#555" }}>Analyzing expression stability...</p>
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
                  {confirmedMood ? "⏸ Detection Paused" : `🔴 Live: ${liveMood}`}
                </p>
                <div className="final-mood-box">
                  {confirmedMood ? (
                    <>
                      <p style={{ fontSize: "1rem", color: "#666" }}>Detected Mood:</p>
                      <h2 className="detected-mood-text">{confirmedMood}</h2>
                      <button className="recommendation-btn" onClick={handleGetPlaylist} disabled={playlistLoading}>
                        {playlistLoading ? "Loading Tracks..." : "♫ Get Playlist"}
                      </button>
                      <button className="music-card-btn"
                        style={{ marginTop: "15px", width: "100%", border: "1px solid #ddd" }}
                        onClick={handleDetectAgain}>
                        🔁 Detect Mood Again
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
            <div className="music-card full-width-card" style={{ marginTop: "40px", textAlign: "left", animation: "fadeIn 1s ease" }}>
              {/* Playlist header row — title on left, shuffle button on top right */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                <h3 style={{ margin: 0 }}>Recommended {confirmedMood} Songs</h3>
                {/* Shuffle button — fetches a new random set of songs for the same mood */}
                <button
                  onClick={handleShuffleSongs}
                  disabled={shuffling}
                  title="Get new random songs for this mood"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "9px 18px",
                    background: shuffling ? "#f0f0f0" : "linear-gradient(135deg, #e05c2a, #d63fb5)",
                    color: shuffling ? "#aaa" : "#fff",
                    border: "none",
                    borderRadius: "30px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: shuffling ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: shuffling ? "none" : "0 3px 12px rgba(214,63,181,0.28)",
                    transition: "all 0.2s",
                    flexShrink: 0
                  }}
                  onMouseEnter={e => { if (!shuffling) e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  {/* Spin the icon while loading */}
                  <span style={{ display: "inline-flex", animation: shuffling ? "spin 0.8s linear infinite" : "none" }}>
                    <ShuffleIcon />
                  </span>
                  {shuffling ? "Loading..." : "Shuffle Songs"}
                </button>
              </div>
              <p style={{ color: "#666", marginBottom: "20px" }}>Based on your detected emotion, here are some tracks to listen.</p>
              {/* PLAYLIST TAB FILTER */}
              <div className="playlist-tabs" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <button className={`playlist-tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => { setActiveTab("all"); setLanguageFilter("All"); }}>
                  🎵 All Tracks</button>
                <button className={`playlist-tab-btn ${activeTab === "ai" ? "active" : ""}`} onClick={() => { setActiveTab("ai"); setLanguageFilter("All"); }}>
                  ✨ Smart Picks</button>
                <button className={`playlist-tab-btn ${activeTab === "admin" ? "active" : ""}`} onClick={() => { setActiveTab("admin"); setLanguageFilter("All"); }}>
                  🎧 Curator's Choice</button>
                {/* Language dropdown — only visible on Curator's Choice tab */}
                {activeTab === "admin" && (
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    style={{
                      marginLeft: "10px",
                      padding: "8px 20px 8px 16px",
                      borderRadius: "20px",
                      minWidth: "140px",
                      border: "1px solid #ddd",
                      background: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#444",
                      cursor: "pointer",
                      outline: "none",
                      fontFamily: "inherit",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                    }}
                  >
                    <option value="All">All</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Nepali">Nepali</option>
                  </select>
                )}
              </div>
              {/* FILTERED SONG LIST */}
              <div className="playlist-grid">
                {filteredPlaylist.length > 0 ? (
                  filteredPlaylist.map((song, index) => {
                    const drawerOpen = showPlaylistModal && modalSong && String(modalSong.id) === String(song.id);
                    return (
                      <div key={index}>
                        <div
                          className="song-item"
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "15px",
                            borderBottom: drawerOpen ? "none" : "1px solid #eee",
                            background: drawerOpen ? "#fdf8ff" : "transparent",
                            borderRadius: drawerOpen ? "10px 10px 0 0" : "0",
                            border: drawerOpen ? "2px solid #e8d5f5" : undefined,
                            transition: "background 0.2s, border 0.2s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            {song.image ? (
                              <img src={song.image} alt="album" style={{ width: "55px", height: "55px", borderRadius: "8px", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "55px", height: "55px", background: "#eee", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1.5rem" }}>♪</div>
                            )}
                            <div>
                              <h4 style={{ margin: 0, color: "#333" }}>{song.title || "Unknown Title"}</h4>
                              <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>
                                {song.artist || "Unknown Artist"} • {song.is_api ? "Free Jamendo Library" : "Local Admin Song"}
                              </p>
                            </div>
                          </div>
                          {/* AUDIO + ADD TO PLAYLIST BUTTON + LIKE BUTTON */}
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <audio controls src={song.is_api ? song.file_path : `http://127.0.0.1:5000/songs/${song.file_path}`} style={{ height: "35px" }}></audio>
                            {/* ADD TO PLAYLIST BUTTON — turns pink/active when drawer is open for this song */}
                            <button
                              className="add-to-playlist-btn"
                              onClick={() => handleOpenPlaylistModal(song)}
                              title={drawerOpen ? "Close playlist picker" : "Add to playlist"}
                              style={{
                                color: drawerOpen ? "#d63fb5" : undefined,
                                borderColor: drawerOpen ? "#d63fb5" : undefined,
                                background: drawerOpen ? "rgba(214,63,181,0.10)" : undefined
                              }}
                            >
                              <PlusIcon />
                            </button>
                            {/* LIKE BUTTON */}
                            <button
                              className={`like-btn ${likedSongIds.has(String(song.id)) ? "liked" : ""}`}
                              onClick={() => handleLikeSong(song)}
                              title={likedSongIds.has(String(song.id)) ? "Unlike this song" : "Like this song"}
                            >
                              {likedSongIds.has(String(song.id)) ? <HeartFilled /> : <HeartOutline />}
                            </button>
                          </div>
                        </div>
                        <PlaylistDrawer song={song} />
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>♪</div>
                    <p style={{ fontWeight: "600", color: "#888" }}>No tracks in this category yet.</p>
                    <p style={{ fontSize: "0.85rem" }}>Try switching to another tab or refresh the playlist.</p>
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
