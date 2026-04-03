import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Shared.css";
import "../styles/Settings.css";
import profileImg from "../images/profile.jpg";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState({ username: "", email: "", address: "", gender: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [deleteStep, setDeleteStep] = useState(1);
  const [delPassword, setDelPassword] = useState("");
  const userEmail = localStorage.getItem("email");
  const isAdmin = localStorage.getItem("is_admin") === "1";
  const homeLink = isAdmin ? "/admin-home" : "/home";
  const dashboardLink = isAdmin ? "/admin-dashboard" : "/dashboard";

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
    try {
      await axios.post("http://127.0.0.1:5000/user/update-profile", {
        email: userEmail,
        username: user.username,
        address: user.address,
        gender: user.gender
      });
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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Get initials for avatar
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "U";

  return (
    <div className="music-home-container settings-page-bg">
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate(homeLink)} style={{cursor:'pointer'}}>Moodify</div>
        <div className="profile-container">
          <img
            src={profileImg}
            alt="profile"
            className="profile-icon-img"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="profile-dropdown">
               <p onClick={() => navigate(homeLink)}>Home</p>
               <p onClick={() => navigate(dashboardLink)}>Dashboard</p>
                <p onClick={() => navigate("/detect-mood")}>Mood Detection</p>
                <p onClick={() => navigate("/playlists")}>Playlists</p>
               <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      <div className="settings-back-container">
        <button className="back-link-btn" onClick={() => navigate(homeLink)}>
          Back to Home
        </button>
      </div>

      <div className="settings-page-wrapper">

        {/* SIDEBAR */}
        <div className="settings-sidebar">
          <div className="settings-user-card">
            <div className="settings-avatar">
              {getInitials(user.username)}
            </div>
            <div className="settings-user-info">
              <p className="settings-user-name">{user.username || "User"}</p>
              <p className="settings-user-email">{user.email || ""}</p>
            </div>
          </div>
          {/* Nav items */}
          <nav className="settings-nav-list">
            <button
              className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab("profile")}
            >
              <span className="sidebar-icon"></span> Profile
            </button>
            <button
              className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab("password")}
            >
              <span className="sidebar-icon"></span> Security
            </button>
            <button
              className={`sidebar-btn sidebar-btn-danger ${activeTab === 'delete' ? 'active-danger' : ''}`}
              onClick={() => { setActiveTab("delete"); setDeleteStep(1); }}
            >
              <span className="sidebar-icon"></span> Delete Account
            </button>
          </nav>
        </div>

        {/* CONTENT CARD */}
        <div className="settings-content-card">

          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="settings-form-header">
                <div className="settings-form-icon"></div>
                <div>
                  <h2>Edit Profile</h2>
                  <p>Update your display name and personal details</p>
                </div>
              </div>
              <div className="settings-divider"></div>
              <div className="music-input-group">
                <label>Username</label>
                <input
                  required
                  value={user.username}
                  onChange={e => setUser({...user, username: e.target.value})}
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
              <button className="settings-save-btn" type="submit">Save Changes</button>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="settings-form-header">
                <div className="settings-form-icon"></div>
                <div>
                  <h2>Change Password</h2>
                  <p>Keep your account secure with a strong password</p>
                </div>
              </div>
              <div className="settings-divider"></div>
              <div className="music-input-group">
                <label>Current Password</label>
                <input type="password" required placeholder="Enter current password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
              </div>
              <div className="music-input-group">
                <label>New Password</label>
                <input type="password" required placeholder="Enter new password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
              </div>
              <button className="settings-save-btn" type="submit">Update Password</button>
            </form>
          )}

          {activeTab === "delete" && (
            <div className="delete-section">
              {deleteStep === 1 ? (
                <>
                  <div className="delete-warning-icon"></div>
                  <h2>Delete Account</h2>
                  <p>Are you sure you want to delete your account? This action cannot be undone and you will lose all your emotion history.</p>
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
                    <input type="password" placeholder="Enter your password" required value={delPassword} onChange={e => setDelPassword(e.target.value)} />
                  </div>
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