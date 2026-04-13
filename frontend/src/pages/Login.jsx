import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/Login.css";
import MoodifyLogo from "../images/Moodify-logo.png"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); 
  const submit = async () => {
    setError(""); 
    
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/login", { email, password });
      if (res.status === 200) {
        localStorage.setItem("username", res.data.username);
        localStorage.setItem("email", res.data.email);
        localStorage.setItem("is_admin", res.data.is_admin); 

        // Clear any previously detected mood from a different session or user
        sessionStorage.removeItem("moodify_confirmed_mood");
        sessionStorage.removeItem("moodify_playlist");
        
        if (res.data.is_admin === 1) {
          navigate("/admin-home"); 
        } else {
          navigate("/home");
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login Failed");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="music-container">
      {/* Background Image */}
      <div 
      className="music-left" 
      style={{ 
        backgroundImage: `url(${require("../images/Login.jpg")})` 
      }}>
        <div className="music-overlay">
          <div className="music-left-content">
            <p className="music-tagline">Music for every mood — global solutions for your vibes.</p>
            <h1>Manage <br/> your moods</h1>
          </div>
        </div>
      </div>
      
      {/* Login Form */}
      <div className="music-right">
        <div className="music-top-nav">
           <img src={MoodifyLogo} alt="Moodify" className="music-logo-img" />
           <Link to="/register" className="music-signup-btn">Sign Up</Link>
        </div>
        <div className="music-form-box">
          <h2>Sign In</h2>
          <div className="music-input-group">
            <input 
              type="email" 
              placeholder="Email or Username" 
              onChange={e => setEmail(e.target.value)} 
              onFocus={() => setError("")} 
            />
          </div>
          {/* Password field with eye toggle */}
          <div className="music-input-group" style={{ position: "relative" }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              onChange={e => setPassword(e.target.value)} 
              onFocus={() => setError("")}
              style={{ paddingRight: "48px" }}
            />
            {/* Eye toggle button */}
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                display: "flex",
                alignItems: "center",
                color: "#aaa",
                zIndex: 2
              }}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye-off icon (password visible)
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                // Eye icon (password hidden)
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <div className="music-links-row">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          {/* Error Message Display */}
          {error && (
            <p style={{
              color: '#e74c3c', 
              fontSize: '0.9rem', 
              marginBottom: '15px', 
              fontWeight: '600'
            }}>
              {error}
            </p>
          )}
          
          <div className="music-guide-link-row">
            <span className="music-guide-hint">Difficulty in login?</span>
            <Link to="/user-manual" className="music-guide-link">Read the guide</Link>
          </div>
          <button className="music-main-btn" onClick={submit} disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </div>
        <p className="music-footer">© 2025 Moodify Inc. | Contact Us</p>
      </div>
    </div>
  );
}
