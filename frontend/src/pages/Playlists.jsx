import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Shared.css";
import "../styles/Playlists.css";
import profileImg from "../images/profile.jpg";
import Footer from "./Footer";
export default function Playlists() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const userEmail = localStorage.getItem("email");
  const coverInputRef = useRef(null);
  const editCoverInputRef = useRef(null);
  // Used to auto-play the next song when the current one ends.
  const audioRefsMap = useRef({});
  // ── STATE ──
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  // Create playlist form state
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState(null);     
  const [newPlaylistCoverPreview, setNewPlaylistCoverPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  //  Playlist detail view state
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [removingSongId, setRemovingSongId] = useState(null);
  // Edit playlist state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCover, setEditCover] = useState(null);         
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  // Tracks the index of the song currently playing in the detail view.
  const [nowPlayingIndex, setNowPlayingIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2500);
  };
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.removeItem("moodify_confirmed_mood");
    sessionStorage.removeItem("moodify_playlist");
    navigate("/login");
  };
  // Fetch all playlists for the user
  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/user/get-playlists", {
        email: userEmail
      });
      setPlaylists(res.data);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPlaylists();
  }, []);
  // Convert a File to base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  // Compress and resize a cover image before saving to DB.
  const compressImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.55) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate scaled dimensions while preserving aspect ratio
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          // Export as JPEG with specified quality to keep file size small
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  // Handle cover image selection for new playlist
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await compressImage(file);
    setNewPlaylistCover(b64);
    setNewPlaylistCoverPreview(b64);
  };
  // Handle cover image selection when editing a playlist
  const handleEditCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await compressImage(file);
    setEditCover(b64);
    setEditCoverPreview(b64);
  };
  // Create a new playlist
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    try {
      await axios.post("http://127.0.0.1:5000/user/create-playlist", {
        email: userEmail,
        name: newPlaylistName.trim(),
        image: newPlaylistCover || null
      });
      setNewPlaylistName("");
      setNewPlaylistCover(null);
      setNewPlaylistCoverPreview(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
      showToast("✅ Playlist created!");
      fetchPlaylists();
    } catch (err) {
      console.error("Failed to create playlist:", err);
      showToast("Failed to create playlist.", true);
    } finally {
      setCreating(false);
    }
  };
  // Delete a playlist
  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm("Delete this playlist? This cannot be undone.")) return;
    setDeletingId(playlistId);
    try {
      await axios.post("http://127.0.0.1:5000/user/delete-playlist", {
        playlist_id: playlistId
      });
      showToast("Playlist deleted.");
      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        setSelectedPlaylist(null);
        setPlaylistSongs([]);
        setEditMode(false);
      }
      fetchPlaylists();
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      showToast("Failed to delete playlist.", true);
    } finally {
      setDeletingId(null);
    }
  };
  // Open a playlist and load its songs
  const handleOpenPlaylist = async (pl) => {
    setSelectedPlaylist(pl);
    setEditMode(false);
    setEditName(pl.name);
    setEditCover(null);
    setEditCoverPreview(null);
    setSongsLoading(true);
    setPlaylistSongs([]);
    try {
      const res = await axios.post("http://127.0.0.1:5000/user/playlist-songs", {
        playlist_id: pl.id
      });
      setPlaylistSongs(res.data);
    } catch (err) {
      console.error("Failed to fetch playlist songs:", err);
    } finally {
      setSongsLoading(false);
    }
  };
  // Remove a song from the open playlist
  const handleRemoveSong = async (playlistSongId) => {
    setRemovingSongId(playlistSongId);
    try {
      await axios.post("http://127.0.0.1:5000/user/remove-from-playlist", {
        playlist_song_id: playlistSongId
      });
      setPlaylistSongs(prev => prev.filter(s => s.id !== playlistSongId));
      showToast("Song removed from playlist.");
    } catch (err) {
      console.error("Failed to remove song:", err);
      showToast("Failed to remove song.", true);
    } finally {
      setRemovingSongId(null);
    }
  };
  // Save edits to the currently open playlist
  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await axios.post("http://127.0.0.1:5000/user/update-playlist", {
        playlist_id: selectedPlaylist.id,
        name: editName.trim(),
        image: editCover || selectedPlaylist.image || null
      });
      // Reflect changes locally
      const updatedPlaylist = {
        ...selectedPlaylist,
        name: editName.trim(),
        image: editCover || selectedPlaylist.image || null
      };
      setSelectedPlaylist(updatedPlaylist);
      setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
      setEditMode(false);
      setEditCover(null);
      setEditCoverPreview(null);
      if (editCoverInputRef.current) editCoverInputRef.current.value = "";
      showToast("✅ Playlist updated!");
    } catch (err) {
      console.error("Failed to update playlist:", err);
      showToast("Failed to save changes.", true);
    } finally {
      setSaving(false);
    }
  };
  // Stop all audio elements in the playlist.
  const stopAllAudio = () => {
    Object.values(audioRefsMap.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };
  // Play the song at the given index, stopping everything else first.
  const playSongAtIndex = (index) => {
    stopAllAudio();
    const audio = audioRefsMap.current[index];
    if (audio) {
      setNowPlayingIndex(index);
      setCurrentTime(0);
      setDuration(audio.duration || 0);
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.error("Autoplay blocked:", err);
      });
    }
  };
  
  const handleMiniPlayPause = () => {
    if (nowPlayingIndex === null) return;
    const audio = audioRefsMap.current[nowPlayingIndex];
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(err => console.error("Play failed:", err));
    } else {
      audio.pause();
    }
  };
  // Skip to the previous song.
  const handlePrevSong = () => {
    if (nowPlayingIndex === null) return;
    const prevIndex = nowPlayingIndex > 0 ? nowPlayingIndex - 1 : playlistSongs.length - 1;
    playSongAtIndex(prevIndex);
  };
  // Skip to the next song.
  const handleNextSong = () => {
    if (nowPlayingIndex === null) return;
    const nextIndex = nowPlayingIndex < playlistSongs.length - 1 ? nowPlayingIndex + 1 : 0;
    playSongAtIndex(nextIndex);
  };
  // Auto-play the next song when the current one finishes naturally and if the finished song is the last one, playback stops 
  const handleSongEnded = (currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlistSongs.length) {
      const nextAudio = audioRefsMap.current[nextIndex];
      if (nextAudio) {
        setNowPlayingIndex(nextIndex);
        setCurrentTime(0);
        setDuration(nextAudio.duration || 0);
        nextAudio.play().catch(err => {
          console.error("Autoplay blocked for next song:", err);
        });
      }
    } else {
      // Last song finished — clear the Now Playing banner
      setNowPlayingIndex(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Mood pill colour helper
  const moodColor = (mood) => {
    const map = {
      Happy:    { bg: "#fff3cd", color: "#856404" },
      Sad:      { bg: "#d1ecf1", color: "#0c5460" },
      Angry:    { bg: "#f8d7da", color: "#721c24" },
      Surprise: { bg: "#e2d9f3", color: "#5a3e85" },
      Neutral:  { bg: "#e2e3e5", color: "#383d41" },
    };
    return map[mood] || { bg: "#f0f0f0", color: "#555" };
  };
  // Determine cover image src for a playlist 
  const getCoverSrc = (pl) => {
    if (!pl.image) return null;
    return pl.image;
  };
  return (
    <div className="playlists-page">
      {toast && (
        <div className={`playlists-toast ${toast.isError ? "playlists-toast-error" : ""}`}>
          {toast.msg}
        </div>
      )}
       {/* NAVBAR logo is plain black  */}
      <nav className="playlists-nav">
        <div className="music-logo" onClick={() => navigate("/home")} style={{cursor:'pointer'}}>Moodify</div>
        <div className="profile-container" style={{position:"relative"}}>
          <img
            src={profileImg}
            alt="profile"
            className="profile-icon-img"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="profile-dropdown" style={{right:0, left:"auto", zIndex:300}}>
              <p onClick={() => navigate("/home")}>Home</p>
              <p onClick={() => navigate("/dashboard")}>Dashboard</p>
              <p onClick={() => navigate("/playlists")}>Playlists</p>
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>
      {/* Back to Home */}
      <div className="playlists-tophome-row">
        <button className="playlists-home-btn" onClick={() => navigate("/home")}>
          Back to Home
        </button>
      </div>
      <div className="playlists-body">
        {/* PLAYLIST DETAIL VIEW */}
        {selectedPlaylist ? (
          <div className="playlists-detail">
            {/* Back button */}
            <button className="playlists-back-btn" onClick={() => { setSelectedPlaylist(null); setPlaylistSongs([]); setEditMode(false); }}>
              Back to Playlists
            </button>
            <div className="playlists-detail-header">
              <div className="playlists-detail-cover">
                {getCoverSrc(selectedPlaylist) ? (
                  <img src={getCoverSrc(selectedPlaylist)} alt="cover" className="playlists-detail-cover-img" />
                ) : (
                  <span className="playlists-detail-cover-icon">🎵</span>
                )}
              </div>
              <div className="playlists-detail-meta">
                {editMode ? (
                  <div className="playlists-edit-form">
                    <p className="playlists-detail-label">EDITING PLAYLIST</p>
                    <input
                      className="playlists-edit-name-input"
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Playlist name..."
                      onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(); }}
                    />
                    {/* Cover image upload for edit */}
                    <div className="playlists-cover-upload-row">
                      {editCoverPreview && (
                        <img src={editCoverPreview} alt="preview" className="playlists-cover-preview" />
                      )}
                      <button
                        className="playlists-cover-upload-btn"
                        onClick={() => editCoverInputRef.current && editCoverInputRef.current.click()}
                        type="button"
                      >
                        
 {editCoverPreview ? "Change Cover" : "Upload Cover"}
                      </button>
                      {editCoverPreview && (
                        <button
                          className="playlists-cover-remove-btn"
                          onClick={() => { setEditCover(null); setEditCoverPreview(null); if (editCoverInputRef.current) editCoverInputRef.current.value = ""; }}
                          type="button"
                        >
                          
                        </button>
                      )}
                      <input
                        ref={editCoverInputRef}
                        type="file"
                        accept="image/*"
                        style={{display:"none"}}
                        onChange={handleEditCoverChange}
                      />
                    </div>
                    <div className="playlists-edit-actions">
                      <button className="playlists-save-btn" onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
                        {saving ? "Saving..." : "💾 Save Changes"}
                      </button>
                      <button className="playlists-cancel-edit-btn" onClick={() => { setEditMode(false); setEditCover(null); setEditCoverPreview(null); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <>
                    <p className="playlists-detail-label">PLAYLIST</p>
                    <h1 className="playlists-detail-name">{selectedPlaylist.name}</h1>
                    <p className="playlists-detail-sub">
                      {playlistSongs.length} song{playlistSongs.length !== 1 ? "s" : ""} 
                      {" "}
                      Created {new Date(selectedPlaylist.created_at).toLocaleDateString()}
                    </p>
                    <div className="playlists-detail-btns">
                      <button
                        className="playlists-edit-btn"
                        onClick={() => { setEditMode(true); setEditName(selectedPlaylist.name); }}
                      >
                        Edit Playlist
                      </button>
                      <button
                        className="playlists-delete-btn"
                        onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                        disabled={deletingId === selectedPlaylist.id}
                      >
                        {deletingId === selectedPlaylist.id ? "Deleting..." : "🗑 Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Now Playing mini-player banner ─ shown whenever a song is selected */}
            {nowPlayingIndex !== null && playlistSongs[nowPlayingIndex] && (
              <div className="playlists-now-playing-bar">
                {/* Animated sound wave bars (only bounce when actually playing) */}
                <div className={`playlists-now-playing-icon${isPlaying ? "" : " playlists-now-playing-icon--paused"}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                {/* Album art */}
                {playlistSongs[nowPlayingIndex].song_image ? (
                  <img
                    src={playlistSongs[nowPlayingIndex].song_image}
                    alt="album"
                    className="playlists-now-playing-thumb"
                  />
                ) : (
                  <div className="playlists-now-playing-thumb playlists-now-playing-thumb-placeholder">♪</div>
                )}
                {/* Song info */}
                <div className="playlists-now-playing-info">
                  <p className="playlists-now-playing-label">NOW PLAYING</p>
                  <p className="playlists-now-playing-title">
                    {playlistSongs[nowPlayingIndex].song_title || "Unknown Title"}
                  </p>
                  <p className="playlists-now-playing-artist">
                    {playlistSongs[nowPlayingIndex].song_artist || "Unknown Artist"}
                  </p>
                </div>
                {/* ── Controls: Prev · Play/Pause · Next ── */}
                <div className="playlists-mini-controls">
                  {/* Previous button — always visible; wraps to last song if on first */}
                  <button
                    className="playlists-mini-btn"
                    onClick={handlePrevSong}
                    title="Previous song"
                  >
                    {/* ⏮ skip-back icon */}
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                  </button>
                  {/* Play / Pause toggle */}
                  <button
                    className="playlists-mini-btn playlists-mini-btn--play"
                    onClick={handleMiniPlayPause}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      /* Pause icon */
                      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      /* Play icon */
                      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                  {/* Next button — always visible; wraps to first song if on last */}
                  <button
                    className="playlists-mini-btn"
                    onClick={handleNextSong}
                    title="Next song"
                  >
                    {/* ⏭ skip-forward icon */}
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z"/>
                    </svg>
                  </button>
                </div>
                {/* ── Time display + seek bar ── */}
                <div className="playlists-mini-time-area">
                  <span className="playlists-mini-time">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    className="playlists-mini-seek"
                    min={0}
                    max={duration || 0}
                    step={1}
                    value={currentTime}
                    onChange={e => {
                      const t = Number(e.target.value);
                      setCurrentTime(t);
                      const audio = audioRefsMap.current[nowPlayingIndex];
                      if (audio) audio.currentTime = t;
                    }}
                  />
                  <span className="playlists-mini-time">{formatTime(duration)}</span>
                </div>
                {/* Track position indicator */}
                <div className="playlists-now-playing-position">
                  <span>{nowPlayingIndex + 1}</span>
                  <span className="playlists-now-playing-of">of</span>
                  <span>{playlistSongs.length}</span>
                </div>
              </div>
            )}
            {/* Songs list */}
            <div className="playlists-songs-list">
              {songsLoading ? (
                <div className="playlists-empty">
                  <div className="playlists-empty-icon"></div>
                  <p>Loading songs...</p>
                </div>
              ) : playlistSongs.length === 0 ? (
                <div className="playlists-empty">
                  <div className="playlists-empty-icon"></div>
                  <p>No songs in this playlist yet.</p>
                  <p style={{fontSize:"0.85rem", color:"#aaa"}}>Go to Mood Detection and add songs using the + button.</p>
                </div>
              ) : (
                <>
                  {/* Column labels */}
                  <div className="playlists-songs-cols">
                    <span style={{flex:"0 0 44px"}}></span>
                    <span style={{flex:1}}>TITLE</span>
                    <span style={{width:"110px"}}>MOOD</span>
                    <span style={{flex:"0 0 340px"}}>AUDIO</span>
                    <span style={{width:"36px"}}></span>
                  </div>
                  {playlistSongs.map((song, songIndex) => {
                    const mc = moodColor(song.song_mood);
                    const audioSrc = song.song_source === "jamendo"
                      ? song.file_path
                      : `http://127.0.0.1:5000/songs/${song.file_path}`;
                    return (
                      <div key={song.id} className={`playlists-song-row${nowPlayingIndex === songIndex ? " playlists-song-row--playing" : ""}`}>
                        {/* Thumbnail */}
                        {song.song_image ? (
                          <img src={song.song_image} alt="album" className="playlists-song-thumb" />
                        ) : (
                          <div className="playlists-song-thumb playlists-song-thumb-placeholder"></div>
                        )}
                        {/* Info */}
                        <div className="playlists-song-info">
                          <p className="playlists-song-name">{song.song_title || "Unknown Title"}</p>
                          <p className="playlists-song-artist">{song.song_artist || "Unknown Artist"}</p>
                        </div>
                        {/* Mood pill */}
                        <div style={{width:"110px", flexShrink:0}}>
                          <span
                            className="playlists-mood-pill"
                            style={{background: mc.bg, color: mc.color}}
                          >
                            {song.song_mood || ""}
                          </span>
                        </div>
                        {/* Audio player — wider so seek bar is usable */}
                        <div style={{flex:"0 0 340px", minWidth:0}}>
                          <audio
                            controls
                            src={audioSrc}
                            className="playlists-audio-player"
                            ref={el => { audioRefsMap.current[songIndex] = el; }}
                            onPlay={() => {
                              // Stop every other audio element so only one plays at a time
                              Object.entries(audioRefsMap.current).forEach(([idx, audio]) => {
                                if (Number(idx) !== songIndex && audio && !audio.paused) {
                                  audio.pause();
                                  audio.currentTime = 0;
                                }
                              });
                              setNowPlayingIndex(songIndex);
                              setIsPlaying(true);
                              const audio = audioRefsMap.current[songIndex];
                              if (audio) setDuration(audio.duration || 0);
                            }}
                            onPause={() => {
                              setIsPlaying(false);
                            }}
                            onTimeUpdate={() => {
                              const audio = audioRefsMap.current[songIndex];
                              if (audio && nowPlayingIndex === songIndex) {
                                setCurrentTime(audio.currentTime);
                                setDuration(audio.duration || 0);
                              }
                            }}
                            onLoadedMetadata={() => {
                              const audio = audioRefsMap.current[songIndex];
                              if (audio && nowPlayingIndex === songIndex) {
                                setDuration(audio.duration || 0);
                              }
                            }}
                            onEnded={() => handleSongEnded(songIndex)}
                          ></audio>
                        </div>
                        {/* Remove button */}
                        <button
                          className="playlists-remove-btn"
                          onClick={() => handleRemoveSong(song.id)}
                          disabled={removingSongId === song.id}
                          title="Remove from playlist"
                        >
                          {removingSongId === song.id ? "⏳" : "🗑"}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ) : (
          <> {/* PLAYLISTS GRID VIEW */}
            {/* Page header */}
            <div className="playlists-page-header">
              <h1 className="playlists-page-title">My Playlists</h1>
              <p className="playlists-page-sub">Create and manage your personal music collections.</p>
              {/* Add Songs to Playlist button — takes user to Mood Detection page to discover and add songs */}
              <button
                className="playlists-add-songs-btn"
                onClick={() => navigate("/detect-mood")}
              >
                🎵 Add Songs to Playlist
              </button>
            </div>
            {/* Create new playlist card */}
            <div className="playlists-create-card">
              <h3 className="playlists-create-title">+ Create New Playlist</h3>
              {/* Name input row */}
              <div className="playlists-create-row">
                <input
                  type="text"
                  className="playlists-create-input"
                  placeholder="Enter playlist name..."
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreatePlaylist(); }}
                />
                <button
                  className="playlists-create-btn"
                  onClick={handleCreatePlaylist}
                  disabled={creating || !newPlaylistName.trim()}
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
              {/* Cover image upload row */}
              <div className="playlists-cover-upload-row" style={{marginTop:"12px"}}>
                {newPlaylistCoverPreview && (
                  <img src={newPlaylistCoverPreview} alt="cover preview" className="playlists-cover-preview" />
                )}
                <button
                  className="playlists-cover-upload-btn"
                  onClick={() => coverInputRef.current && coverInputRef.current.click()}
                  type="button"
                >
                  
 {newPlaylistCoverPreview ? "Change Cover Image" : "Add Cover Image (optional)"}
                </button>
                {newPlaylistCoverPreview && (
                  <button
                    className="playlists-cover-remove-btn"
                    onClick={() => { setNewPlaylistCover(null); setNewPlaylistCoverPreview(null); if (coverInputRef.current) coverInputRef.current.value = ""; }}
                    type="button"
                  >
                    Remove
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{display:"none"}}
                  onChange={handleCoverChange}
                />
              </div>
            </div>
            {/* Playlists grid */}
            {loading ? (
              <div className="playlists-empty">
                <div className="playlists-empty-icon"></div>
                <p>Loading playlists...</p>
              </div>
            ) : playlists.length === 0 ? (
              <div className="playlists-empty">
                <div className="playlists-empty-icon"></div>
                <p style={{fontWeight:"600", color:"#333", fontSize:"1.1rem"}}>No playlists yet</p>
                <p style={{color:"#aaa", fontSize:"0.9rem"}}>Create your first playlist above, or add songs using the + button on the Mood Detection page.</p>
              </div>
            ) : (
              <div className="playlists-grid">
                {playlists.map(pl => {
                  const coverSrc = getCoverSrc(pl);
                  return (
                    <div key={pl.id} className="playlists-card">
                      {/* Cover art area */}
                      <div className="playlists-card-cover" onClick={() => handleOpenPlaylist(pl)}>
                        {coverSrc ? (
                          <img
                            src={coverSrc}
                            alt="cover"
                            className="playlists-card-cover-img"
                            onError={e => {
                              /* If image fails to load (broken/invalid base64), fall back to the music note icon */
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = '<span class="playlists-card-cover-icon">🎵</span>';
                            }}
                          />
                        ) : (
                          <span className="playlists-card-cover-icon">🎵</span>
                        )}
                      </div>
                      {/* Card info */}
                      <div className="playlists-card-body">
                        <h4 className="playlists-card-name" onClick={() => handleOpenPlaylist(pl)}>
                          {pl.name}
                        </h4>
                        <p className="playlists-card-date">
                          {new Date(pl.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {/* Card actions */}
                      <div className="playlists-card-actions">
                        <button
                          className="playlists-card-open-btn"
                          onClick={() => handleOpenPlaylist(pl)}
                        >
                          Open
                        </button>
                        <button
                          className="playlists-card-delete-btn"
                          onClick={() => handleDeletePlaylist(pl.id)}
                          disabled={deletingId === pl.id}
                          title="Delete playlist"
                        >
                          {deletingId === pl.id ? "⏳" : "🗑"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <div style={{marginTop:"80px"}}>
        <Footer />
      </div>
    </div>
  );
}

