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
  
  const [user, setUser] = useState({ username: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", is_admin: "0" });
  
  // Delete Account 
  const [deleteStep, setDeleteStep] = useState(1);
  const [delPassword, setDelPassword] = useState("");

  const userEmail = localStorage.getItem("email");
  const isAdmin = localStorage.getItem("is_admin") === "1";

  useEffect(() => {
    if (userEmail) fetchProfile();
  }, [userEmail]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/user/profile?email=${userEmail}`);
      setUser(res.data);
    } catch (err) { 
      console.error("Profile fetch error"); 
    }
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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="music-home-container">
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate(isAdmin ? "/admin-home" : "/home")} style={{cursor:'pointer'}}>Moodify</div>
        
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
               <p onClick={() => navigate("/dashboard")}>Dashboard</p>
               <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      <div className="settings-back-container">
         <button className="back-link-btn" onClick={() => navigate("/home")}>
           ← Back to Home
         </button>
      </div>

      <div className="settings-page-wrapper">
        
        {/* SIDEBAR */}
        <div className="settings-sidebar">
          <button className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab("profile")}>Profile</button>
          <button className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab("password")}>Security</button>

          {isAdmin && (
            <>
              <button className="sidebar-btn" onClick={() => navigate("/manage-users")}>User Management</button>
              <button className={`sidebar-btn ${activeTab === 'adduser' ? 'active' : ''}`} onClick={() => setActiveTab("adduser")}>Add User</button>
            </>
          )}

          <button className={`sidebar-btn ${activeTab === 'delete' ? 'active' : ''}`} style={{color: 'red'}} onClick={() => {setActiveTab("delete"); setDeleteStep(1)}}>Delete Account</button>
        </div>

        {/* CONTENT CARD */}
        <div className="music-card settings-content-card">
          
          {activeTab === "profile" && (
             <form onSubmit={handleUpdateProfile} className="settings-form">
               <h2 style={{marginBottom: '30px', color: '#333'}}>Edit Profile</h2>
               <div className="music-input-group">
                 <label>Username</label>
                 <input value={user.username} onChange={e => setUser({...user, username: e.target.value})} />
               </div>
               <div className="music-input-group">
                 <label>Email</label>
                 <input value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
               </div>
               <button className="music-main-btn" type="submit" style={{marginTop: '20px'}}>Save Changes</button>
             </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="settings-form">
              <h2 style={{marginBottom: '30px', color: '#333'}}>Change Password</h2>
              <div className="music-input-group">
                <label>Current Password</label>
                <input type="password" required placeholder="Enter current password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
              </div>
              <div className="music-input-group">
                <label>New Password</label>
                <input type="password" required placeholder="Enter new password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
              </div>
              <button className="music-main-btn" type="submit" style={{marginTop: '20px'}}>Update Password</button>
            </form>
          )}

          {activeTab === "adduser" && isAdmin && (
            <form onSubmit={handleAddUser} className="settings-form">
              <h2 style={{marginBottom: '30px', color: '#333'}}>Add New User</h2>
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
              <button className="music-main-btn" type="submit" style={{marginTop: '20px'}}>Create User</button>
            </form>
          )}

          {activeTab === "delete" && (
            <div className="delete-section">
              {deleteStep === 1 ? (
                <>
                  <h2 style={{color: '#e74c3c'}}>Delete Account</h2>
                  <p style={{lineHeight: '1.6', color: '#666', marginTop: '10px'}}>Are you sure you want to delete your account? This action cannot be undone and you will lose all your emotion history.</p>
                  <div style={{display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'center'}}>
                    <button className="music-logout-btn" style={{background: '#e74c3c', padding: '12px 30px'}} onClick={() => setDeleteStep(2)}>Yes, Delete</button>
                    <button className="music-card-btn" style={{margin: 0, padding: '12px 30px'}} onClick={() => setActiveTab("profile")}>No, Keep Account</button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleDeleteAccount} className="settings-form">
                  <h2 style={{color: '#e74c3c'}}>Verify Identity</h2>
                  <p style={{marginBottom: '20px', color: '#666'}}>Please enter your account password to confirm deletion.</p>
                  <div className="music-input-group">
                    <input type="password" placeholder="Enter Password" required value={delPassword} onChange={e => setDelPassword(e.target.value)} />
                  </div>
                  <div style={{display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center'}}>
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