import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Shared.css";
import "../styles/Settings.css";
import profileImg from "../images/profile.jpg";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [user, setUser] = useState({ username: "", email: "", address: "", gender: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  
  // Delete Account State
  const [deleteStep, setDeleteStep] = useState(1);
  const [delPassword, setDelPassword] = useState("");

  const userEmail = localStorage.getItem("email");

  // Inline message state for each section
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [deleteMsg, setDeleteMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    if (userEmail) fetchProfile();
  }, [userEmail]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/user/profile?email=${userEmail}`);
      setUser({
        username: res.data.username || "",
        email: res.data.email || "",
        address: res.data.address || "",
        gender: res.data.gender || ""
      });
    } catch (err) { 
      console.error("Profile fetch error"); 
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: "", type: "" });
    try {
      await axios.post("http://127.0.0.1:5000/user/update-profile", {
        email: userEmail,
        username: user.username,
        address: user.address,
        gender: user.gender
      });
      localStorage.setItem("username", user.username);
      setProfileMsg({ text: "Admin Profile Updated Successfully!", type: "success" });
    } catch (err) { setProfileMsg({ text: "Update failed", type: "error" }); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: "", type: "" });
    // Validate password length (6-18 characters)
    if (passwords.new.length < 6 || passwords.new.length > 18) {
      setPasswordMsg({ text: "New password must be between 6 and 18 characters.", type: "error" });
      return;
    }
    try {
      await axios.post("http://127.0.0.1:5000/user/change-password", {
        email: userEmail,
        current_password: passwords.current,
        new_password: passwords.new
      });
      setPasswordMsg({ text: "Password Updated Successfully!", type: "success" });
      setPasswords({ current: "", new: "" });
    } catch (err) { 
      setPasswordMsg({ text: err.response?.data?.error || "Failed to update password", type: "error" }); 
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMsg({ text: "", type: "" });
    try {
      await axios.post("http://127.0.0.1:5000/user/delete-account", {
        email: userEmail,
        password: delPassword
      });
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      setDeleteMsg({ text: err.response?.data?.error || "Incorrect Password or Cannot Delete Last Admin", type: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Get initials for avatar
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "A";

  // Helper to render inline message banner
  const InlineMessage = ({ msg }) => {
    if (!msg.text) return null;
    const isSuccess = msg.type === "success";
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 18px",
        borderRadius: "12px",
        marginBottom: "16px",
        fontSize: "0.9rem",
        fontWeight: "600",
        background: isSuccess ? "#f0faf4" : "#fff2f2",
        color: isSuccess ? "#1a7f4b" : "#c0392b",
        border: `1px solid ${isSuccess ? "#a8e6c3" : "#f5b7b1"}`,
      }}>
        <span style={{ fontSize: "1.1rem" }}>{isSuccess ? "✅" : "⚠️"}</span>
        {msg.text}
      </div>
    );
  };

  return (
    <div className="music-home-container settings-page-bg">
      <nav className="music-nav">
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
               <p onClick={() => navigate("/admin-home")}>Home</p>
               <p onClick={() => navigate("/admin-dashboard")}>Dashboard</p>
               <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      <div className="settings-back-container">
         <button className="back-link-btn" onClick={() => navigate("/admin-home")}>
           Back to Home
         </button>
      </div>

      <div className="settings-page-wrapper">
        
        {/* SIDEBAR — matches user Settings layout with avatar card */}
        <div className="settings-sidebar">
          <div className="settings-user-card">
            <div className="settings-avatar">
              {getInitials(user.username)}
            </div>
            <div className="settings-user-info">
              <p className="settings-user-name">{user.username || "Admin"}</p>
              <p className="settings-user-email">{user.email || ""}</p>
            </div>
          </div>
          {/* Nav items */}
          <nav className="settings-nav-list">
            <button
              className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveTab("profile"); setProfileMsg({ text: "", type: "" }); }}
            >
              <span className="sidebar-icon"></span> Profile
            </button>
            <button
              className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => { setActiveTab("password"); setPasswordMsg({ text: "", type: "" }); }}
            >
              <span className="sidebar-icon"></span> Security
            </button>
            <button
              className={`sidebar-btn sidebar-btn-danger ${activeTab === 'delete' ? 'active-danger' : ''}`}
              onClick={() => { setActiveTab("delete"); setDeleteStep(1); setDeleteMsg({ text: "", type: "" }); }}
            >
              <span className="sidebar-icon"></span> Delete Account
            </button>
          </nav>
        </div>

        {/* CONTENT CARD — matches user Settings layout */}
        <div className="settings-content-card">
          
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="settings-form-header">
                <div className="settings-form-icon"></div>
                <div>
                  <h2>Edit Admin Profile</h2>
                  <p>Update your display name and account details</p>
                </div>
              </div>
              <div className="settings-divider"></div>
              <div className="music-input-group">
                <label>Username</label>
                <input
                  required
                  value={user.username}
                  onChange={e => { setUser({...user, username: e.target.value}); setProfileMsg({ text: "", type: "" }); }}
                  placeholder="Enter your username"
                />
              </div>
              <div className="music-input-group">
                <label>Address <span style={{color:'#aaa', fontWeight:'400'}}>(optional)</span></label>
                <input
                  value={user.address}
                  onChange={e => setUser({...user, address: e.target.value})}
                  placeholder="Enter your address"
                />
              </div>
              <div className="music-input-group">
                <label>Gender <span style={{color:'#aaa', fontWeight:'400'}}>(optional)</span></label>
                <select
                  value={user.gender}
                  onChange={e => setUser({...user, gender: e.target.value})}
                  style={{width:'100%', padding:'14px 18px', borderRadius:'30px', border:'1px solid #ddd', outline:'none', background:'#fff', fontSize:'0.95rem', color: user.gender ? '#333' : '#aaa'}}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              {/* Inline message above button */}
              <InlineMessage msg={profileMsg} />
              <button className="settings-save-btn" type="submit">Save Changes</button>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="settings-form-header">
                <div className="settings-form-icon"></div>
                <div>
                  <h2>Change Password</h2>
                  <p>Keep your admin account secure with a strong password</p>
                </div>
              </div>
              <div className="settings-divider"></div>
              <div className="music-input-group">
                <label>Current Password</label>
                <input type="password" required placeholder="Enter current password" value={passwords.current} onChange={e => { setPasswords({...passwords, current: e.target.value}); setPasswordMsg({ text: "", type: "" }); }} />
              </div>
              <div className="music-input-group">
                <label>New Password</label>
                <input type="password" required placeholder="Enter new password (6–18 characters)" minLength={6} maxLength={18} value={passwords.new} onChange={e => { setPasswords({...passwords, new: e.target.value}); setPasswordMsg({ text: "", type: "" }); }} />
              </div>
              {/* Inline message above button */}
              <InlineMessage msg={passwordMsg} />
              <button className="settings-save-btn" type="submit">Update Password</button>
            </form>
          )}

          {activeTab === "delete" && (
            <div className="delete-section">
              {deleteStep === 1 ? (
                <>
                  <div className="delete-warning-icon"></div>
                  <h2>Delete Admin Account</h2>
                  <p>Warning: Deleting your admin account may restrict access to the dashboard. Ensure there is at least one other admin.</p>
                  <div className="delete-actions">
                    <button className="delete-confirm-btn" onClick={() => setDeleteStep(2)}>Yes, Delete My Account</button>
                    <button className="delete-cancel-btn" onClick={() => setActiveTab("profile")}>No, Keep Account</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleDeleteAccount} className="settings-form" style={{maxWidth:'100%'}}>
                  <div className="delete-warning-icon"></div>
                  <h2>Verify Identity</h2>
                  <p style={{marginBottom: '25px', color: '#666'}}>Please enter your password to confirm permanent deletion.</p>
                  <div className="music-input-group">
                    <label>Password</label>
                    <input type="password" placeholder="Enter your password" required value={delPassword} onChange={e => { setDelPassword(e.target.value); setDeleteMsg({ text: "", type: "" }); }} />
                  </div>
                  {/* Inline message above buttons */}
                  <InlineMessage msg={deleteMsg} />
                  <div className="delete-actions">
                    <button className="delete-confirm-btn" type="submit">Confirm Deletion</button>
                    <button className="delete-cancel-btn" type="button" onClick={() => setDeleteStep(1)}>Cancel</button>
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
