import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Shared.css";
import "../styles/Admin.css";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/admin/users");
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users");
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="music-home-container">
      <nav className="music-nav" style={{borderTop: "5px solid #8e44ad"}}>
        <div className="music-logo" onClick={() => navigate("/admin-home")} style={{cursor:'pointer'}}>
          Moodify <span style={{fontSize: "0.8rem", color: "#8e44ad"}}>ADMIN</span>
        </div>
        <button className="music-logout-btn" onClick={() => navigate("/admin-home")}>Back to Panel</button>
      </nav>

      <div className="music-home-content">
        <header className="music-welcome-header">
          <h1>User Management</h1>
          <p>List of all registered users in the system.</p>
        </header>

        <div className="music-card" style={{ width: "100%", textAlign: "left", cursor: "default" }}>
          <h3 style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "15px" }}>Registered Users</h3>
          
          {loading ? (
            <p style={{textAlign: 'center', padding: '20px'}}>Loading users...</p>
          ) : users.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
              <p>No users registered yet.</p>
            </div>
          ) : (
            <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#8e44ad" }}>
                  <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>#</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>Username</th>
                  <th style={{ padding: "12px", borderBottom: "2px solid #eee" }}>Email Address</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px" }}>{index + 1}</td>
                    <td style={{ padding: "12px", fontWeight: "600" }}>{user.username}</td>
                    <td style={{ padding: "12px", color: "#555" }}>{user.email}</td>
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