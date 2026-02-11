import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import "../styles/Shared.css";
import "../styles/Admin.css";
import profileImg from "../images/profile.jpg"; 

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  
  // Data State
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartData, setChartData] = useState([]);

  // Add User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", is_admin: "0" });

  // Edit State
  const [editUserId, setEditUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({ username: "", email: "" });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if(users.length > 0) {
        processData();
    }
  }, [users, startDate, endDate, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:5000/admin/users");
      console.log("API Response:", res.data); 
      if (Array.isArray(res.data)) {
        setUsers(res.data);
        setFilteredUsers(res.data); 
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const processData = () => {
    let result = [...users]; 

    // 1. Filter by Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.username && u.username.toLowerCase().includes(lowerQuery)) ||
        (u.email && u.email.toLowerCase().includes(lowerQuery))
      );
    }

    // 2. Filter by Date 
    if (startDate) {
      result = result.filter(u => {
        if(!u.registered_date) return false; 
        return new Date(u.registered_date) >= new Date(startDate);
      });
    }
    if (endDate) {
      result = result.filter(u => {
        if(!u.registered_date) return false;
        return new Date(u.registered_date) <= new Date(endDate);
      });
    }

    setFilteredUsers(result);

    // 3. Prepare Chart Data
    const dateCounts = {};
    result.forEach(u => {
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
    
    setChartData(graphData);
  };

  const handleClearDates = () => {
      setStartDate("");
      setEndDate("");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:5000/admin/add-user", newUser);
      alert(res.data.message);
      setNewUser({ username: "", email: "", password: "", is_admin: "0" });
      setShowAddUser(false);
      fetchUsers(); 
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.post("http://127.0.0.1:5000/admin/delete-user", { id });
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  const handleEditClick = (user) => {
    setEditUserId(user.id);
    setEditFormData({ username: user.username, email: user.email });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/admin/edit-user", {
        id: editUserId,
        username: editFormData.username,
        email: editFormData.email
      });
      setEditUserId(null);
      fetchUsers();
    } catch (err) {
      alert("Failed to update user");
    }
  };

  return (
    <div className="music-home-container" style={{background: "#f0f2f5"}}>
      <nav className="music-nav" style={{borderTop: "5px solid #8e44ad"}}>
        <div className="music-logo" onClick={() => navigate("/admin-home")} style={{cursor:'pointer'}}>
            Moodify <span style={{fontSize: "0.8rem", color: "#8e44ad"}}>ADMIN</span>
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
              <p onClick={() => navigate("/admin-home")}>Home</p>
              <p onClick={() => navigate("/admin-dashboard")}>Dashboard</p>
              <p onClick={() => navigate("/admin-settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      <div className="settings-back-container">
         <button className="back-link-btn" onClick={() => navigate("/admin-home")}>
           ← Back to Home
         </button>
      </div>

      <div className="music-home-content">
        <header className="music-welcome-header">
          <h1>System Dashboard</h1>
          <p>Analytics and Management Tools</p>
        </header>

        {/* Dashboard Tabs */}
        <div className="dashboard-tabs">
            <button 
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
                onClick={() => setActiveTab('users')}
            >
                User Management
            </button>
            <button 
                className={`tab-btn ${activeTab === 'emotions' ? 'active' : ''}`} 
                onClick={() => setActiveTab('emotions')}
            >
                Emotion Management
            </button>
            <button 
                className={`tab-btn ${activeTab === 'music' ? 'active' : ''}`} 
                onClick={() => setActiveTab('music')}
            >
                Music Management
            </button>
        </div>

        {/* USER MANAGEMENT TAB */}
        {activeTab === "users" && (
          <div className="admin-dashboard-layout">
            
            {/* 1. Global Date Filter Section */}
            <div className="music-card full-width-card filter-card-row">
                <span className="filter-label">📅 Filter Records by Date:</span>
                <div className="date-inputs-wrapper">
                    <div className="input-wrap">
                        <label>From:</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="input-wrap">
                        <label>To:</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    {(startDate || endDate) && (
                        <button className="clear-date-btn" onClick={handleClearDates}>Clear Dates</button>
                    )}
                </div>
            </div>

            {/* 2. Graph Section */}
            <div className="music-card full-width-card" style={{ marginBottom: "40px", textAlign: "left" }}>
              <h3>User Registration Trends</h3>
              <div style={{width: '100%', height: 350, marginTop: '20px'}}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
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

            {/* 3. Table Controls */}
            <div className="table-controls-bar">
                <div className="search-wrapper">
                    <input 
                        type="text" 
                        placeholder="Search users by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-search-input"
                    />
                </div>
                <button 
                    className="music-main-btn add-user-btn" 
                    onClick={() => setShowAddUser(!showAddUser)}
                >
                    {showAddUser ? "✕ Cancel" : "+ Add New User"}
                </button>
            </div>

            {/* 4. Add User Form */}
            {showAddUser && (
                <div className="music-card full-width-card slide-down" style={{marginBottom: "30px", textAlign: "left", background: "#fdfdfd", border: "1px solid #eee"}}>
                    <h3 style={{marginBottom: '20px', color: '#27ae60'}}>Create New Account</h3>
                    <form onSubmit={handleAddUser}>
                        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                            <div className="music-input-group" style={{flex: 1}}>
                                <label>Username</label>
                                <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                            </div>
                            <div className="music-input-group" style={{flex: 1}}>
                                <label>Email</label>
                                <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                            <div className="music-input-group" style={{flex: 1}}>
                                <label>Password</label>
                                <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                            </div>
                            <div className="music-input-group" style={{flex: 1}}>
                                <label>Role</label>
                                <select 
                                    style={{width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid #ddd', outline: 'none', background: '#fff'}}
                                    value={newUser.is_admin} 
                                    onChange={e => setNewUser({...newUser, is_admin: e.target.value})}
                                >
                                    <option value="0">Regular User</option>
                                    <option value="1">Admin</option>
                                </select>
                            </div>
                        </div>
                        <button className="music-main-btn" type="submit" style={{maxWidth: '200px'}}>Create User</button>
                    </form>
                </div>
            )}

            {/* 5. Users Table */}
            <div className="music-card full-width-card" style={{ textAlign: "left", cursor: "default", overflowX: "auto" }}>
              <h3 style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "15px" }}>Registered Users List</h3>
              
              {loading ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: "50px", textAlign: "center", color: "#888" }}>
                  <p>No users found matching criteria.</p>
                </div>
              ) : (
                <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#8e44ad", fontSize: '0.95rem' }}>
                      <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>S.N.</th>
                      <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Username</th>
                      <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Email Address</th>
                      <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Role</th>
                      <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Registered Date</th>
                      <th style={{ padding: "15px", borderBottom: "2px solid #eee" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id || index} className="table-row">
                        <td style={{ padding: "15px" }}>{index + 1}</td>
                        
                        <td style={{ padding: "15px", fontWeight: "600" }}>
                          {editUserId === user.id ? (
                            <input 
                              value={editFormData.username} 
                              onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                              className="edit-input"
                            />
                          ) : user.username}
                        </td>

                        <td style={{ padding: "15px", color: "#555" }}>
                           {editUserId === user.id ? (
                            <input 
                              value={editFormData.email} 
                              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                              className="edit-input"
                            />
                          ) : user.email}
                        </td>

                        <td style={{ padding: "15px" }}>
                            <span className={user.is_admin === 1 ? "role-badge admin" : "role-badge user"}>
                                {user.is_admin === 1 ? "Admin" : "User"}
                            </span>
                        </td>

                        <td style={{ padding: "15px" }}>{user.registered_date || "N/A"}</td>
                        
                        <td style={{ padding: "15px" }}>
                           {editUserId === user.id ? (
                             <>
                               <button className="action-btn save" onClick={handleSaveEdit}>Save</button>
                               <button className="action-btn cancel" onClick={() => setEditUserId(null)}>Cancel</button>
                             </>
                           ) : (
                             <>
                               <button className="action-btn edit" onClick={() => handleEditClick(user)}>Edit</button>
                               <button className="action-btn delete" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                             </>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PLACEHOLDERS FOR OTHER TABS */}
        {activeTab === "emotions" && (
            <div className="music-card full-width-card">
                <h3>Emotion Management Dashboard</h3>
            </div>
        )}

        {activeTab === "music" && (
            <div className="music-card full-width-card">
                <h3>Music Management Dashboard</h3>
            </div>
        )}

      </div>
    </div>
  );
}