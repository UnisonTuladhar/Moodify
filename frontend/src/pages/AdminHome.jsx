import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
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
  "Fear": "#2c3e50",
  "Disgust": "#2ecc71"
};

export default function AdminHome() {
  const navigate = useNavigate();
  const[showDropdown, setShowDropdown] = useState(false);
  const adminName = localStorage.getItem("username") || "Admin";

  // States for Analytics
  const [loading, setLoading] = useState(true);
  const[userChartData, setUserChartData] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const[recentUsers, setRecentUsers] = useState([]);
  
  // States for Today's Summaries
  const[totalMoodsToday, setTotalMoodsToday] = useState(0);
  const[mostDetectedMoodToday, setMostDetectedMoodToday] = useState("None");

  // To get today's date in YYYY-MM-DD format
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
            .sort((a, b) => b.id - a.id) // Sort by newest
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
    <div className="music-home-container" style={{background: "#f0f2f5"}}>
      {/* Admin Navbar */}
      <nav className="music-nav" style={{borderTop: "5px solid #8e44ad"}}>
        <div className="music-logo" onClick={() => navigate("/admin-home")} style={{cursor:'pointer'}}>
          Moodify 
        </div>
        
        <div className="profile-container">
          <img 
            src={profileImg} 
            alt="profile" 
            className="profile-icon-img"
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

      {/* Admin Home Content */}
      <div className="music-home-content" style={{maxWidth: "1400px", margin: "0 auto", padding: "40px 20px"}}>
        <div className="admin-status-label">ADMIN PANEL</div>
        
        <header className="music-welcome-header" style={{marginBottom: "30px"}}>
          <h1>Welcome Back, <span className="highlight-text">{adminName}</span></h1>
          <p className="hero-subtitle">
            Here's a quick overview of what's happening on Moodify today.
          </p>
        </header>

        {loading ? (
            <div style={{textAlign: "center", padding: "50px", fontSize: "1.2rem", color: "#888"}}>
                Loading Dashboard Analytics...
            </div>
        ) : (
            <>
                {/* SUMMARY CARDS */}
                <div style={{
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '30px'
                }}>
                    {/* Total Moods Today */}
                    <div className="music-card" style={{padding: '30px', textAlign: 'center'}}>
                        <div style={{fontSize: '3rem', marginBottom: '10px'}}>📊</div>
                        <h4 style={{color: '#888', margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '600'}}>Total Moods Detected Today</h4>
                        <h2 style={{color: '#1a1614', margin: 0, fontSize: '2.5rem'}}>{totalMoodsToday}</h2>
                    </div>

                    {/* Most Detected Mood Today */}
                    <div className="music-card" style={{padding: '30px', textAlign: 'center'}}>
                        <div style={{fontSize: '3rem', marginBottom: '10px'}}>🎭</div>
                        <h4 style={{color: '#888', margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '600'}}>Most Detected Mood Today</h4>
                        <h2 style={{color: EMOTION_COLORS[mostDetectedMoodToday] || '#8e44ad', margin: 0, fontSize: '2.5rem'}}>
                            {mostDetectedMoodToday}
                        </h2>
                    </div>

                    {/* Most Listened Music (Placeholder) */}
                    <div className="music-card" style={{padding: '30px', textAlign: 'center', background: '#fcfcfc', border: '1px dashed #ddd'}}>
                        <div style={{fontSize: '3rem', marginBottom: '10px', opacity: 0.5}}>🎵</div>
                        <h4 style={{color: '#888', margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '600'}}>Most Listened Music Today</h4>
                    </div>
                </div>

                {/* CHARTS SECTION (Middle Row) */}
                <div style={{
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
                    gap: '30px', 
                    marginBottom: '30px'
                }}>
                    {/* Line Chart: Registration */}
                    <div className="music-card full-width-card" style={{ padding: '25px', textAlign: 'left' }}>
                        <h3 style={{marginBottom: "20px", color: "#333"}}>User Registration Trends</h3>
                        <div style={{width: '100%', height: 300}}>
                            <ResponsiveContainer>
                            <LineChart data={userChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                                <Legend />
                                <Line type="monotone" dataKey="Registrations" stroke="#8e44ad" strokeWidth={3} dot={{r: 5}} activeDot={{r: 8}} />
                            </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: All-Time Emotions */}
                    <div className="music-card full-width-card" style={{ padding: '25px', textAlign: 'left' }}>
                        <h3 style={{marginBottom: "20px", color: "#333"}}>Global Emotion Analytics (All Time)</h3>
                        <div style={{width: '100%', height: 300}}>
                            <ResponsiveContainer>
                                <BarChart data={emotionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                                        contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} 
                                    />
                                    <Bar dataKey="value" name="Total Detections" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                        {emotionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name] || '#8e44ad'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* TODAY'S REGISTRATIONS TABLE (Bottom Row) */}
                <div className="music-card full-width-card" style={{ textAlign: "left", cursor: "default", overflowX: "auto" }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: "2px solid #f0f0f0", paddingBottom: "15px"}}>
                        <h3 style={{ margin: 0 }}>Today's Registered Users</h3>
                        <button 
                            className="music-card-btn" 
                            style={{margin: 0, padding: '8px 15px', fontSize: '0.85rem'}}
                            onClick={() => navigate("/admin-dashboard")}
                        >
                            View All Users →
                        </button>
                    </div>

                    {recentUsers.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
                            <p style={{fontSize: '1.1rem', margin: 0}}>No users have registered today.</p>
                        </div>
                    ) : (
                        <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", color: "#8e44ad", fontSize: '0.95rem' }}>
                                    <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>S.N.</th>
                                    <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Username</th>
                                    <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Email Address</th>
                                    <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map((user, index) => (
                                <tr key={user.id} className="table-row">
                                    <td style={{ padding: "15px" }}>{index + 1}</td>
                                    <td style={{ padding: "15px", fontWeight: "600" }}>{user.username}</td>
                                    <td style={{ padding: "15px", color: "#555" }}>{user.email}</td>
                                    <td style={{ padding: "15px" }}>
                                        <span className={user.is_admin === 1 ? "role-badge admin" : "role-badge user"}>
                                            {user.is_admin === 1 ? "Admin" : "User"}
                                        </span>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </>
        )}
      </div>
      <Footer />
    </div>
  );
}