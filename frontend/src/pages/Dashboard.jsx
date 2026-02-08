import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  "Surprise": "#9b59b6",
  "Fear": "#2c3e50",
  "Disgust": "#2ecc71"
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mood"); 
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Filters
  const [moodFilter, setMoodFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const username = localStorage.getItem("username") || "User";
  const userEmail = localStorage.getItem("email");

  useEffect(() => {
    if (userEmail && activeTab === "mood") {
      fetchHistory();
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
                <p onClick={() => navigate("/home")}>Home</p>
                <p onClick={() => navigate("/settings")}>Settings</p>
                <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
            )}
        </div>
      </nav>

      <div className="dashboard-back-container">
         <button className="back-link-btn" onClick={() => navigate("/home")}>
           ← Back to Home
         </button>
      </div>

      <div className="dashboard-content">
        <header className="dashboard-header">
            <h1>Dashboard and Analytics</h1>
            <p>Your emotional landscape & music insights are displayed here.</p>
        </header>

        {/* TABS */}
        <div className="dashboard-tabs">
            <button 
                className={`tab-btn ${activeTab === 'mood' ? 'active' : ''}`} 
                onClick={() => setActiveTab('mood')}
            >
                Mood Detection History
            </button>
            <button 
                className={`tab-btn ${activeTab === 'music' ? 'active' : ''}`} 
                onClick={() => setActiveTab('music')}
            >
                Music Dashboard
            </button>
        </div>

        <div className="dashboard-panel">
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
                            <span style={{fontSize: '3rem'}}>📊</span>
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
                                            <Tooltip />
                                            <Legend />
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
                                            {history.map((item, index) => (
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
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'music' && (
                <div className="music-dash-container">
                    <div className="empty-state">
                        <span style={{fontSize: '3rem'}}>🎵</span>
                        <h3>Music Dashboard</h3>
                        <p>This section will feature your top genres based on your mood history.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}