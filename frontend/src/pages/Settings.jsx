import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import "../styles/Shared.css";
import "../styles/Settings.css";

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

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [user, setUser] = useState({ username: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", is_admin: "0" });
  
  // HISTORY STATE 
  const [history, setHistory] = useState([]);
  const [moodFilter, setMoodFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartData, setChartData] = useState([]);

  // Delete Account 
  const [deleteStep, setDeleteStep] = useState(1);
  const [delPassword, setDelPassword] = useState("");

  const userEmail = localStorage.getItem("email");
  const isAdmin = localStorage.getItem("is_admin") === "1";

  useEffect(() => {
    if (userEmail) fetchProfile();
  }, [userEmail]);

  useEffect(() => {
      if (activeTab === "history") {
          fetchHistory();
      }
  }, [activeTab, moodFilter, startDate, endDate]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/user/profile?email=${userEmail}`);
      setUser(res.data);
    } catch (err) { 
      console.error("Profile fetch error"); 
    }
  };

  const fetchHistory = async () => {
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
      console.error("Failed to load history");
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:5000/user/update-profile", {
        old_email: userEmail,
        username: user.username, email: user.email
      });
      localStorage.setItem("email", user.email);
      localStorage.setItem("username", user.username);
      alert("Profile Updated Successfully!");
    } catch (err) { alert("Update failed"); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:5000/user/change-password", {
        email: userEmail,
        current_password: passwords.current,
        new_password: passwords.new
      });
      alert("Password Updated Successfully!");
      setPasswords({ current: "", new: "" });
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to update password"); 
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:5000/admin/add-user", newUser);
      alert(res.data.message);
      setNewUser({ username: "", email: "", password: "", is_admin: "0" });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:5000/user/delete-account", {
        email: userEmail,
        password: delPassword
      });
      alert("Account Deleted Permanently.");
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Incorrect Password");
    }
  };

  return (
    <div className="music-home-container">
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate(isAdmin ? "/admin-home" : "/home")} style={{cursor:'pointer'}}>Moodify</div>
        <button className="music-logout-btn" onClick={() => navigate(-1)}>Back</button>
      </nav>

      <div className="settings-page-wrapper">
        
        {/* SIDEBAR */}
        <div className="settings-sidebar">
          <button className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab("profile")}>Profile</button>
          <button className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab("password")}>Security</button>
          <button className={`sidebar-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab("history")}>Emotion History</button>
          <button className="sidebar-btn" onClick={() => navigate("/dashboard")}>Music Dashboard</button>

          {isAdmin && (
            <>
              <button className="sidebar-btn" onClick={() => navigate("/manage-users")}>User Management</button>
              <button className={`sidebar-btn ${activeTab === 'adduser' ? 'active' : ''}`} onClick={() => setActiveTab("adduser")}>Add User</button>
            </>
          )}

          <button className={`sidebar-btn ${activeTab === 'delete' ? 'active' : ''}`} style={{color: 'red'}} onClick={() => {setActiveTab("delete"); setDeleteStep(1)}}>Delete Account</button>
        </div>

        {/* CONTENT CARD */}
        <div className="music-card" style={{flex: 1, padding: '40px 50px', textAlign: 'left', minHeight: '600px'}}>
          
           {activeTab === "history" && (
            <div className="history-container">
              <h2 style={{fontSize: '2rem', marginBottom: '30px'}}>Emotion History</h2>
              
              <div className="filters-row">
                
                <div className="filter-group">
                  <label>Filter Mood:</label>
                  <select 
                    value={moodFilter} 
                    onChange={(e) => setMoodFilter(e.target.value)} 
                  >
                    <option value="All">All Moods</option>
                    {Object.keys(COLORS).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Start Date:</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>

                <div className="filter-group">
                  <label>End Date:</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                  />
                </div>
              </div>

              {history.length === 0 ? (
                <div style={{padding: '60px', textAlign: 'center', background: '#f9f9f9', borderRadius: '20px', marginTop: '30px'}}>
                    <p style={{color: '#999', fontSize: '1.2rem'}}>No emotion records found for these filters.</p>
                </div>
              ) : (
                <div className="charts-layout" style={{display: 'flex', flexDirection: 'column', gap: '60px', marginTop: '40px'}}>
                  
                  {/* PIE CHART */}
                  <div className="chart-box">
                    <h3 style={{textAlign: 'center', marginBottom: '20px', color: '#555'}}>Overall Mood Distribution</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* BAR CHART */}
                  <div className="chart-box">
                    <h3 style={{textAlign: 'center', marginBottom: '20px', color: '#555'}}>Mood Frequency</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Legend />
                        <Bar dataKey="value" name="Count" radius={[10, 10, 0, 0]} barSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div style={{marginTop: '20px'}}>
                     <h3 style={{marginBottom: '20px'}}>Recent Logs</h3>
                     <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead>
                            <tr style={{borderBottom: '2px solid #eee', textAlign: 'left'}}>
                                <th style={{padding: '15px'}}>Date & Time</th>
                                <th style={{padding: '15px'}}>Emotion Detected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.slice(0, 5).map((log, i) => (
                                <tr key={i} style={{borderBottom: '1px solid #f0f0f0'}}>
                                    <td style={{padding: '15px', color: '#666'}}>{log.date}</td>
                                    <td style={{padding: '15px'}}>
                                        <span style={{
                                            backgroundColor: COLORS[log.emotion] + '30', 
                                            color: COLORS[log.emotion],
                                            padding: '8px 15px',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem'
                                        }}>
                                            {log.emotion}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                  </div>

                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
             <form onSubmit={handleUpdateProfile} style={{maxWidth: '600px'}}>
               <h2 style={{marginBottom: '30px'}}>Edit Profile</h2>
               <div className="music-input-group">
                 <label>Username</label>
                 <input value={user.username} onChange={e => setUser({...user, username: e.target.value})} />
               </div>
               <div className="music-input-group">
                 <label>Email</label>
                 <input value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
               </div>
               <button className="music-main-btn" type="submit" style={{marginTop: '10px'}}>Save Changes</button>
             </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} style={{maxWidth: '600px'}}>
              <h2 style={{marginBottom: '30px'}}>Change Password</h2>
              <div className="music-input-group">
                <label>Current Password</label>
                <input type="password" required placeholder="Enter current password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
              </div>
              <div className="music-input-group">
                <label>New Password</label>
                <input type="password" required placeholder="Enter new password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
              </div>
              <button className="music-main-btn" type="submit" style={{marginTop: '10px'}}>Update Password</button>
            </form>
          )}

          {activeTab === "adduser" && isAdmin && (
            <form onSubmit={handleAddUser} style={{maxWidth: '600px'}}>
              <h2 style={{marginBottom: '30px'}}>Add New User</h2>
              <div className="music-input-group">
                <label>Username</label>
                <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <div className="music-input-group">
                <label>Email</label>
                <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="music-input-group">
                <label>Password</label>
                <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="music-input-group">
                <label>Role</label>
                <select 
                  style={{width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid #ddd', outline: 'none', background: '#f9f9f9'}}
                  value={newUser.is_admin} 
                  onChange={e => setNewUser({...newUser, is_admin: e.target.value})}
                >
                  <option value="0">Regular User</option>
                  <option value="1">Admin</option>
                </select>
              </div>
              <button className="music-main-btn" type="submit" style={{marginTop: '10px'}}>Create User</button>
            </form>
          )}

          {activeTab === "delete" && (
            <div className="delete-section">
              {deleteStep === 1 ? (
                <>
                  <h2 style={{color: '#e74c3c'}}>Delete Account</h2>
                  <p style={{lineHeight: '1.6', color: '#666'}}>Are you sure you want to delete your account? This action cannot be undone and you will lose all your emotion history.</p>
                  <div style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
                    <button className="music-logout-btn" style={{background: '#e74c3c', padding: '12px 30px'}} onClick={() => setDeleteStep(2)}>Yes, Delete</button>
                    <button className="music-card-btn" style={{margin: 0, padding: '12px 30px'}} onClick={() => setActiveTab("profile")}>No, Keep Account</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleDeleteAccount} style={{maxWidth: '500px'}}>
                  <h2 style={{color: '#e74c3c'}}>Verify Identity</h2>
                  <p style={{marginBottom: '20px', color: '#666'}}>Please enter your account password to confirm deletion.</p>
                  <div className="music-input-group">
                    <input type="password" placeholder="Enter Password" required value={delPassword} onChange={e => setDelPassword(e.target.value)} />
                  </div>
                  <div style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
                    <button className="music-main-btn" type="submit" style={{background: '#e74c3c', width: 'auto', padding: '12px 30px'}}>Confirm Deletion</button>
                    <p className="music-back-link" style={{margin: 'auto 0', cursor: 'pointer', color: '#666'}} onClick={() => setDeleteStep(1)}>Cancel</p>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}