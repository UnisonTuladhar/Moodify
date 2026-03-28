import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell} from 'recharts';
import "../styles/Shared.css";
import "../styles/Admin.css";
import profileImg from "../images/profile.jpg"; 
import Footer from "./Footer"; 

// Consistent colors for the emotion bar chart
const EMOTION_COLORS = {
  "Happy": "#FFCC00",
  "Sad": "#3498db",
  "Angry": "#e74c3c",
  "Neutral": "#95a5a6",
  "Surprise": "#9b59b6",
};

export default function AdminHome() {
  const navigate = useNavigate();
  const[showDropdown, setShowDropdown] = useState(false);
  const adminName = localStorage.getItem("username") || "Admin";
  const [loading, setLoading] = useState(true);
  const[userChartData, setUserChartData] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const[recentUsers, setRecentUsers] = useState([]);
  const[totalMoodsToday, setTotalMoodsToday] = useState(0);
  const[mostDetectedMoodToday, setMostDetectedMoodToday] = useState("None");
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const todayStr = getTodayString();
      
      try {
        // Fetch All Users for Line Chart 
        const usersRes = await axios.get("http://127.0.0.1:5000/admin/users");
        const allUsers = Array.isArray(usersRes.data) ? usersRes.data :[];
        
        // Process User Chart Data 
        const dateCounts = {};
        allUsers.forEach(u => {
          const date = u.registered_date ? u.registered_date : "N/A";
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
        const graphData = Object.keys(dateCounts).map(date => ({
          date,
          Registrations: dateCounts[date]
        })).sort((a, b) => {
          if(a.date === "N/A") return -1;
          if(b.date === "N/A") return 1;
          return new Date(a.date) - new Date(b.date);
        });
        setUserChartData(graphData);
        // Process Today's Registered Users (10 max)
        const todaysUsers = allUsers
            .filter(u => u.registered_date === todayStr)
            .sort((a, b) => b.id - a.id)
            .slice(0, 10);
        setRecentUsers(todaysUsers);
        // Fetch All-time Emotions for Bar Chart
        const allTimeEmotionsRes = await axios.post("http://127.0.0.1:5000/admin/emotion-analytics", {});
        setEmotionData(Array.isArray(allTimeEmotionsRes.data) ? allTimeEmotionsRes.data :[]);
        // Fetch Today's Emotions for Summary Cards
        const todayEmotionsRes = await axios.post("http://127.0.0.1:5000/admin/emotion-analytics", {
            start_date: todayStr,
            end_date: todayStr
        });
        const tEmotions = Array.isArray(todayEmotionsRes.data) ? todayEmotionsRes.data :[];
        
        let totalToday = 0;
        let maxMood = "None";
        let maxCount = 0;
        tEmotions.forEach(e => {
            totalToday += e.value;
            if (e.value > maxCount) {
                maxCount = e.value;
                maxMood = e.name;
            }
        });
        setTotalMoodsToday(totalToday);
        setMostDetectedMoodToday(maxMood);
      } catch (err) {
        console.error("Error fetching admin home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  },[]);
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  return (
    <div className="music-home-container admin-home-bg">
      <div className="admin-hero-panel" style={{ minHeight: "100vh" }}>
        <nav className="music-nav admin-hero-nav">
          <div className="music-logo admin-hero-logo" onClick={() => navigate("/admin-home")} style={{cursor:'pointer'}}>
            Moodify
          </div>
          <div className="profile-container">
            <img 
              src={profileImg} 
              alt="profile" 
              className="profile-icon-img admin-hero-profile"
              onClick={() => setShowDropdown(!showDropdown)}
            />
            {showDropdown && (
              <div className="profile-dropdown">
                <p onClick={() => navigate("/admin-dashboard")}>Dashboard</p>
                <p onClick={() => navigate("/admin-settings")}>Settings</p>
                <p onClick={handleLogout} className="dropdown-logout">Logout</p>
              </div>
            )}
          </div>
        </nav>

        <div className="admin-diagonal-overlay"></div>

        {/* Scan corner brackets */}
        <div className="hero-scan-lines">
          <div className="scan-corner scan-tl"></div>
          <div className="scan-corner scan-tr"></div>
          <div className="scan-corner scan-bl"></div>
          <div className="scan-corner scan-br"></div>
        </div>

        <div className="admin-hero-content">
          <div className="admin-hero-badge">Admin Panel</div>
          <h1 className="admin-hero-title">
            Welcome Back, <span className="highlight-text">{adminName}</span>!
          </h1>
          <p className="admin-hero-subtitle">
            Here's a quick overview of what's happening on Moodify today. 
            Monitor users, emotions, and platform activity in real time.
          </p>
          <div style={{ marginTop: "38px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <button 
              className="admin-hero-btn primary"
              onClick={() => navigate("/admin-dashboard")}
            >
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="admin-home-content">

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Loading Dashboard Analytics...</p>
          </div>
        ) : (
          <>
            <div className="admin-stats-grid">
              {/* Total Moods Today */}
              <div className="admin-stat-card">
                <div className="admin-stat-icon mood-icon">📊</div>
                <div className="admin-stat-info">
                  <p className="admin-stat-label">Total Moods Today</p>
                  <h2 className="admin-stat-value">{totalMoodsToday}</h2>
                </div>
                <div className="admin-stat-accent accent-orange"></div>
              </div>

              {/* Most Detected Mood */}
              <div className="admin-stat-card">
                <div className="admin-stat-icon emotion-icon">🎭</div>
                <div className="admin-stat-info">
                  <p className="admin-stat-label">Top Mood Today</p>
                  <h2 className="admin-stat-value" style={{color: EMOTION_COLORS[mostDetectedMoodToday] || '#8e44ad'}}>
                    {mostDetectedMoodToday}
                  </h2>
                </div>
                <div className="admin-stat-accent accent-purple"></div>
              </div>

              {/* Today's Registrations */}
              <div className="admin-stat-card">
                <div className="admin-stat-icon users-icon">👤</div>
                <div className="admin-stat-info">
                  <p className="admin-stat-label">New Users Today</p>
                  <h2 className="admin-stat-value">{recentUsers.length}</h2>
                </div>
                <div className="admin-stat-accent accent-green"></div>
              </div>

              {/* Quick Actions Card */}
              <div className="admin-stat-card admin-quick-actions">
                <div className="admin-stat-icon">⚡</div>
                <div className="admin-stat-info">
                  <p className="admin-stat-label">Quick Actions</p>
                  <div style={{display:'flex', gap:'8px', marginTop:'8px', flexWrap:'wrap'}}>
                    <button className="admin-quick-btn" onClick={() => navigate("/admin-dashboard", { state: { openAddSong: true } })}>+ Add New Song</button>
                  </div>
                </div>
                <div className="admin-stat-accent accent-blue"></div>
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="admin-charts-grid">
              {/* Line Chart: Registration Trends */}
              <div className="admin-chart-card">
                <div className="admin-chart-header">
                  <h3>User Registration Trends</h3>
                  <span className="admin-chart-tag">All Time</span>
                </div>
                <div style={{width: '100%', height: 300}}>
                  <ResponsiveContainer>
                    <LineChart data={userChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{fontSize: 11, fill: '#aaa'}} />
                      <YAxis allowDecimals={false} tick={{fontSize: 11, fill: '#aaa'}} />
                      <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 5px 20px rgba(0,0,0,0.1)'}} />
                      <Legend />
                      <Line type="monotone" dataKey="Registrations" stroke="url(#lineGrad)" strokeWidth={3} dot={{r: 5, fill: '#ff4e00'}} activeDot={{r: 8}} />
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ff4e00" />
                          <stop offset="100%" stopColor="#ec008c" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: All-Time Emotions */}
              <div className="admin-chart-card">
                <div className="admin-chart-header">
                  <h3>Global Emotion Analytics</h3>
                  <span className="admin-chart-tag">All Time</span>
                </div>
                <div style={{width: '100%', height: 300}}>
                  <ResponsiveContainer>
                    <BarChart data={emotionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{fontSize: 11, fill: '#aaa'}} />
                      <YAxis allowDecimals={false} tick={{fontSize: 11, fill: '#aaa'}} />
                      <Tooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 5px 20px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="value" name="Total Detections" radius={[8, 8, 0, 0]} maxBarSize={55}>
                        {emotionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name] || '#8e44ad'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* TODAY'S REGISTRATIONS TABLE */}
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div>
                  <h3>Today's Registered Users</h3>
                  <p>Users who joined Moodify today</p>
                </div>
                <button 
                  className="admin-view-all-btn"
                  onClick={() => navigate("/admin-dashboard")}
                >
                  View All Users →
                </button>
              </div>

              {recentUsers.length === 0 ? (
                <div className="admin-empty-state">
                  <div style={{fontSize: '2.5rem', marginBottom: '10px'}}>👤</div>
                  <p>No users have registered today.</p>
                </div>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>S.N.</th>
                        <th>Username</th>
                        <th>Email Address</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user, index) => (
                        <tr key={user.id} className="table-row">
                          <td>{index + 1}</td>
                          <td style={{fontWeight: "600"}}>{user.username}</td>
                          <td style={{color: "#777"}}>{user.email}</td>
                          <td>
                            <span className={user.is_admin === 1 ? "role-badge admin" : "role-badge user"}>
                              {user.is_admin === 1 ? "Admin" : "User"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
