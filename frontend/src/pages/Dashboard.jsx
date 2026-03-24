import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import "../styles/Shared.css";
import "../styles/Dashboard.css";
import profileImg from "../images/profile.jpg";

// Pie chart colors
const COLORS = {
  "Happy": "#FFCC00",
  "Sad": "#3498db",
  "Angry": "#e74c3c",
  "Neutral": "#95a5a6",
  "Surprise": "#9b59b6"
}

// SVG Play icon
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
)

// SVG Pause icon
const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
)

// SVG heart for unlike button
const HeartFilled = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("mood"); 
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filters 
  const [moodFilter, setMoodFilter] = useState(location.state?.moodFilter || "All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Liked Songs State
  const [likedSongs, setLikedSongs] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [toast, setToast] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const username = localStorage.getItem("username") || "User";
  const userEmail = localStorage.getItem("email");

  useEffect(() => {
    if (userEmail && activeTab === "mood") {
      setCurrentPage(1); 
      fetchHistory();
    }
    // Fetch liked songs 
    if (userEmail && activeTab === "liked") {
      fetchLikedSongs();
    }
  }, [userEmail, activeTab, moodFilter, startDate, endDate]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/user/emotion-history", {
        email: userEmail,
        mood_filter: moodFilter,
        start_date: startDate,
        end_date: endDate
      });
      setHistory(res.data);
      processChartData(res.data);
    } catch (err) {
      console.error("Error fetching history");
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    const counts = {};
    data.forEach(item => {
      counts[item.emotion] = (counts[item.emotion] || 0) + 1;
    });
    const processed = Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
      fill: COLORS[key] || "#8884d8"
    }));
    setChartData(processed);
  };

  // Fetch liked songs from backend
  const fetchLikedSongs = async () => {
    setLikedLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/user/liked-songs", {
        email: userEmail
      });
      setLikedSongs(res.data);
    } catch (err) {
      console.error("Error fetching liked songs");
    } finally {
      setLikedLoading(false);
    }
  };

  // Show toast notification
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // Unlike a song directly from the dashboard
  const handleUnlikeSong = async (song) => {
    try {
      await axios.post("http://127.0.0.1:5000/user/like-song", {
        email: userEmail,
        song_id: song.song_id,
        song_title: song.song_title,
        song_artist: song.song_artist,
        song_mood: song.song_mood,
        song_image: song.song_image || null,
        song_source: song.song_source,
        file_path: song.file_path
      });
      setLikedSongs(prev => prev.filter(s => s.song_id !== song.song_id));
      showToast("Removed from Liked Songs");
    } catch (err) {
      console.error("Failed to unlike song", err);
    }
  };

  // Toggle audio preview row
  const handlePreview = (songId) => {
    setPreviewId(prev => prev === songId ? null : songId);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const GRID = "30px 52px 1fr 1fr 110px 40px 40px";
  const GAP  = "0 16px";
  const headerRowStyle = {
    display: "grid",
    gridTemplateColumns: GRID,
    gap: GAP,
    alignItems: "center",
    padding: "8px 24px",
    background: "#fafafa",
    borderBottom: "1px solid #f0f0f0"
  };
  const dataRowStyle = (isHovered) => ({
    display: "grid",
    gridTemplateColumns: GRID,
    gap: GAP,
    alignItems: "center",
    padding: "10px 24px",
    borderBottom: "1px solid #f9f9f9",
    background: isHovered ? "#fdf9ff" : "#fff",
    transition: "background 0.15s ease"
  });
  const colLabel = {
    fontSize: "0.68rem",
    fontWeight: "700",
    color: "#c0c0c0",
    textTransform: "uppercase",
    letterSpacing: "0.7px"
  };
  const ellipsis = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  };

  return (
    <div className="music-home-container">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "30px", left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1614", color: "#fff",
          padding: "11px 26px", borderRadius: "30px",
          fontSize: "0.88rem", fontWeight: "600",
          zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          whiteSpace: "nowrap"
        }}>
          {toast}
        </div>
      )}

      {/* Navbar */}
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate("/home")} style={{cursor:'pointer'}}>Moodify</div>
        <div className="profile-container">
            <img src={profileImg} alt="profile" className="profile-icon-img"
              onClick={() => setShowDropdown(!showDropdown)} />
            {showDropdown && (
            <div className="profile-dropdown">
                <p onClick={() => navigate("/home")}>Home</p>
                <p onClick={() => navigate("/settings")}>Settings</p>
                <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
            )}
        </div>
      </nav>

      <div className="dashboard-back-container">
         <button className="back-link-btn" onClick={() => navigate("/home")}>
 Back to Home</button>
      </div>

      <div className="dashboard-content">
        <header className="dashboard-header">
            <h1>Dashboard and Analytics</h1>
            <p>Your emotional landscape & music insights are displayed here.</p>
        </header>

        {/* TABS */}
        <div className="dashboard-tabs">
            <button className={`tab-btn ${activeTab === 'mood' ? 'active' : ''}`} onClick={() => setActiveTab('mood')}>
                Mood Detection History
            </button>
            <button className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`} onClick={() => setActiveTab('liked')}>
                
 Liked Songs
            </button>
        </div>

        <div className="dashboard-panel">
            {/* 
 MOOD HISTORY TAB 
 */}
            {activeTab === 'mood' && (
                <div className="mood-analytics-container">
                    {/* Filters */}
                    <div className="dashboard-filters">
                        <div className="filter-item">
                            <label>Filter Mood:</label>
                            <select onChange={(e) => setMoodFilter(e.target.value)} value={moodFilter}>
                                <option value="All">All Moods</option>
                                {Object.keys(COLORS).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>From:</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="filter-item">
                            <label>To:</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    {loading ? (
                         <div className="loading-state">Loading data...</div>
                    ) : history.length === 0 ? (
                        <div className="empty-state">
                            <span style={{fontSize: '3rem'}}></span>
                            <p>No mood data found for this period.</p>
                            <button className="music-main-btn" style={{width: 'auto', marginTop: '10px'}} onClick={() => navigate("/detect-mood")}>Go Detect Mood</button>
                        </div>
                    ) : (
                        <>
                            {/* Charts Row */}
                            <div className="charts-row">
                                <div className="chart-card">
                                    <h4>Mood Distribution</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip /><Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-card">
                                    <h4>Frequency Analysis</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false}/>
                                            <Tooltip />
                                            <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="history-table-card">
                                <h3>Detailed Logs</h3>
                                <div className="table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date & Time</th>
                                                <th>Emotion Detected</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.date}</td>
                                                    <td>
                                                        <span className="mood-badge" style={{color: COLORS[item.emotion], borderColor: COLORS[item.emotion]}}>
                                                            {item.emotion}
                                                        </span>
                                                    </td>
                                                    <td>Completed</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                <div className="pagination-controls">
                                    <button className="page-btn nav" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>&laquo; Prev</button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => {
                                        if (totalPages > 10 && Math.abs(currentPage - number) > 2 && number !== 1 && number !== totalPages) return null;
                                        if (totalPages > 10 && Math.abs(currentPage - number) === 3 && number !== 1 && number !== totalPages) return <span key={number} className="page-dots">...</span>;
                                        return (
                                            <button key={number} className={`page-btn ${currentPage === number ? 'active' : ''}`} onClick={() => paginate(number)}>
                                                {number}
                                            </button>
                                        );
                                    })}
                                    <button className="page-btn nav" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next &raquo;</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* LIKED SONGS TAB  */}
            {activeTab === 'liked' && (
                <div style={{padding: "4px 0 20px 0"}}>
                    {likedLoading ? (
                        <div className="loading-state">Loading liked songs...</div>
                    ) : likedSongs.length === 0 ? (
                        <div className="empty-state">
                            <span style={{fontSize: '3rem'}}></span>
                            <h3>No Liked Songs Yet</h3>
                            <p>Go to Mood Detection and tap the heart icon next to a song to save it here.</p>
                            <button className="music-main-btn" style={{width: 'auto', marginTop: '10px'}} onClick={() => navigate("/detect-mood")}>
                                Discover Songs
                            </button>
                        </div>
                    ) : (
                        <div style={{background:"#fff", borderRadius:"16px", border:"1px solid #f0f0f0", overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,0.04)"}}>
                            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px 14px 24px", borderBottom:"1px solid #f5f5f5"}}>
                                <span style={{fontSize:"1rem", fontWeight:"700", color:"#222", display:"flex", alignItems:"center", gap:"8px"}}>
                                    <HeartFilled /> Liked Songs
                                </span>
                                <span style={{fontSize:"0.78rem", color:"#aaa", fontWeight:"500", background:"#f5f5f5", padding:"3px 12px", borderRadius:"20px"}}>
                                    {likedSongs.length} {likedSongs.length === 1 ? "song" : "songs"}
                                </span>
                            </div>
                            {/* Column labels */}
                            <div style={headerRowStyle}>
                                <span style={colLabel}>#</span>
                                <span style={colLabel}></span>
                                <span style={colLabel}>Title</span>
                                <span style={colLabel}>Artist</span>
                                <span style={colLabel}>Mood</span>
                                <span style={{...colLabel, textAlign:"center"}}>Play</span>
                                <span style={{...colLabel, textAlign:"center"}}>Unlike</span>
                            </div>
                            {likedSongs.map((song, index) => (
                                <div key={index}>
                                    <div
                                        style={dataRowStyle(hoveredRow === index)}
                                        onMouseEnter={() => setHoveredRow(index)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <span style={{fontSize:"0.8rem", color:"#ccc", textAlign:"center"}}>{index + 1}</span>
                                        {song.song_image ? (
                                            <img src={song.song_image} alt="art"
                                                style={{width:"44px", height:"44px", borderRadius:"7px", objectFit:"cover", display:"block"}} />
                                        ) : (
                                            <div style={{
                                                width:"44px", height:"44px", borderRadius:"7px",
                                                background:"linear-gradient(135deg,#f0f0f0,#e4e4e4)",
                                                display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem"
                                            }}></div>
                                        )}
                                        <div style={{minWidth:0}}>
                                            <p style={{margin:"0 0 3px 0", fontSize:"0.9rem", fontWeight:"600", color:"#1a1a1a", ...ellipsis}}>
                                                {song.song_title}
                                            </p>
                                            <p style={{margin:0, fontSize:"0.72rem", color:"#c0c0c0"}}>
                                                Added {song.liked_at}
                                            </p>
                                        </div>
                                        <p style={{margin:0, fontSize:"0.84rem", color:"#555", ...ellipsis}}>
                                            {song.song_artist || ""}
                                        </p>
                                        <span style={{
                                            display:"inline-block", padding:"4px 12px",
                                            borderRadius:"20px", fontSize:"0.73rem", fontWeight:"700",
                                            background: (COLORS[song.song_mood] || "#aaa") + "20",
                                            color: COLORS[song.song_mood] || "#888",
                                            border: `1px solid ${(COLORS[song.song_mood] || "#ddd")}50`,
                                            whiteSpace:"nowrap"
                                        }}>
                                            {song.song_mood || ""}
                                        </span>
                                        <div style={{display:"flex", justifyContent:"center"}}>
                                            <button
                                                onClick={() => handlePreview(song.song_id)}
                                                style={{
                                                    width:"32px", height:"32px", borderRadius:"50%", border:"none",
                                                    background: previewId === song.song_id
                                                        ? "linear-gradient(90deg,#ff4e00,#ec008c)"
                                                        : "#efefef",
                                                    color: previewId === song.song_id ? "#fff" : "#555",
                                                    cursor:"pointer", display:"flex", alignItems:"center",
                                                    justifyContent:"center", transition:"all 0.2s ease",
                                                    flexShrink:0, padding:0
                                                }}
                                                title={previewId === song.song_id ? "Collapse player" : "Preview song"}
                                            >
                                                {previewId === song.song_id ? <PauseIcon /> : <PlayIcon />}
                                            </button>
                                        </div>
                                        <div style={{display:"flex", justifyContent:"center"}}>
                                            <button
                                                onClick={() => handleUnlikeSong(song)}
                                                style={{
                                                    width:"32px", height:"32px", borderRadius:"50%",
                                                    border:"1.5px solid #ffcccc", background:"none",
                                                    cursor:"pointer", display:"flex", alignItems:"center",
                                                    justifyContent:"center", transition:"all 0.2s ease",
                                                    flexShrink:0, padding:0
                                                }}
                                                title="Remove from liked songs"
                                                onMouseEnter={e => { e.currentTarget.style.background="rgba(231,76,60,0.09)"; e.currentTarget.style.borderColor="#e74c3c"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.borderColor="#ffcccc"; }}
                                            >
                                                <HeartFilled />
                                            </button>
                                        </div>
                                    </div>
                                    {previewId === song.song_id && (
                                        <div style={{
                                            padding:"10px 24px 14px 120px",
                                            background:"#fdf9ff",
                                            borderBottom:"1px solid #f0f0f0"
                                        }}>
                                            <audio
                                                controls
                                                autoPlay
                                                src={
                                                    song.song_source === "jamendo"
                                                        ? song.file_path
                                                        : `http://127.0.0.1:5000/songs/${song.file_path}`
                                                }
                                                style={{width:"100%", height:"34px"}}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
