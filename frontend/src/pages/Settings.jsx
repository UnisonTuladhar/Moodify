import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Shared.css";
import "../styles/Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState({ username: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  
  // New User State (For Admin Add User feature)
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", is_admin: "0" });

  const [deleteStep, setDeleteStep] = useState(1);
  const [delPassword, setDelPassword] = useState("");

  const userEmail = localStorage.getItem("email");
  const isAdmin = localStorage.getItem("is_admin") === "1";

  useEffect(() => {
    if (userEmail) {
      fetchProfile();
    }
  }, [userEmail]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/user/profile?email=${userEmail}`);
      setUser(res.data);
    } catch (err) { 
      console.error("Profile fetch error"); 
      alert("Failed to load profile details. Please try logging in again.");
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

  return (
    <div className="music-home-container">
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate(isAdmin ? "/admin-home" : "/home")} style={{cursor:'pointer'}}>Moodify</div>
        <button className="music-logout-btn" onClick={() => navigate(-1)}>Back</button>
      </nav>

      <div className="music-home-content" style={{display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
        
        {/* SIDEBAR */}
        <div className="settings-sidebar">
          <button className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab("profile")}>Profile</button>
          <button className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab("password")}>Security</button>
          
          {/* NEW: MUSIC DASHBOARD OPTION MOVED HERE */}
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
        <div className="music-card" style={{flex: 1, padding: '40px', textAlign: 'left'}}>
          {activeTab === "profile" && (
             <form onSubmit={handleUpdateProfile}>
               <h2>Edit Profile</h2>
               <div className="music-input-group">
                 <label>Username</label>
                 <input value={user.username} onChange={e => setUser({...user, username: e.target.value})} />
               </div>
               <div className="music-input-group">
                 <label>Email</label>
                 <input value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
               </div>
               <button className="music-main-btn" type="submit">Save Changes</button>
             </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword}>
              <h2>Change Password</h2>
              <div className="music-input-group">
                <input type="password" required placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
              </div>
              <div className="music-input-group">
                <input type="password" required placeholder="New Password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
              </div>
              <button className="music-main-btn" type="submit">Update Password</button>
            </form>
          )}

          {activeTab === "adduser" && isAdmin && (
            <form onSubmit={handleAddUser}>
              <h2>Add New User</h2>
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
                  style={{width: '100%', padding: '15px', borderRadius: '30px', border: '1px solid #ddd', outline: 'none'}}
                  value={newUser.is_admin} 
                  onChange={e => setNewUser({...newUser, is_admin: e.target.value})}
                >
                  <option value="0">Regular User</option>
                  <option value="1">Admin</option>
                </select>
              </div>
              <button className="music-main-btn" type="submit">Create User</button>
            </form>
          )}

          {activeTab === "delete" && (
            <div className="delete-section">
              {deleteStep === 1 && (
                <>
                  <h2 style={{color: '#e74c3c'}}>Delete Account</h2>
                  <p>Are you sure you want to delete your account? Once you delete your account you cannot recover it.</p>
                  <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                    <button className="music-logout-btn" style={{background: '#e74c3c'}} onClick={() => setDeleteStep(2)}>Yes, Delete</button>
                    <button className="music-card-btn" onClick={() => setActiveTab("profile")}>No, Keep Account</button>
                  </div>
                </>
              )}

              {deleteStep === 2 && (
                <form onSubmit={handleDeleteAccount}>
                  <h2 style={{color: '#e74c3c'}}>Verify Identity</h2>
                  <p>Please enter your account password to confirm deletion.</p>
                  <div className="music-input-group">
                    <input type="password" placeholder="Enter Password" required value={delPassword} onChange={e => setDelPassword(e.target.value)} />
                  </div>
                  <button className="music-main-btn" type="submit" style={{background: 'red'}}>Confirm Permanent Deletion</button>
                  <p className="music-back-link" onClick={() => setDeleteStep(1)}>Go back</p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}