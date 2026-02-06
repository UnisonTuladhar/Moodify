import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Shared.css";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const email = localStorage.getItem("email");
        setHistory([]); 
      } catch (err) {
        console.error("Error fetching history");
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="music-home-container">
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate("/home")} style={{cursor:'pointer'}}>Moodify</div>
        <button className="music-logout-btn" onClick={() => navigate("/home")}>Back to Home</button>
      </nav>

      <div className="music-home-content">
        <header className="music-welcome-header">
          <h1>{username}'s Mood Analytics</h1>
          <p>Track your emotional journey through music.</p>
        </header>

        <div className="music-card" style={{ width: "100%", textAlign: "left", cursor: "default" }}>
          <h3 style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "15px" }}>Recent Emotion History</h3>
          
          {history.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>⏳</div>
              <p>No emotion history available right now.</p>
              <small>Your mood logs will appear here once you start using the detector!</small>
            </div>
          ) : (
            <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#ff4e00" }}>
                  <th style={{ padding: "10px" }}>Date</th>
                  <th style={{ padding: "10px" }}>Mood Detected</th>
                  <th style={{ padding: "10px" }}>Suggested Genre</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>{item.date}</td>
                    <td style={{ padding: "10px" }}>{item.emotion}</td>
                    <td style={{ padding: "10px" }}>{item.genre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}