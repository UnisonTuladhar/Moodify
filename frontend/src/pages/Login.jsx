import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
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
      {/* ackground Image */}
      <div 
      className="music-left" 
      style={{ 
        backgroundImage: `url(${require("../images/Login.jpg")})` 
      }}
>
        <div className="music-overlay">
          <div className="music-left-content">
            <p className="music-tagline">Music for every mood – global solutions for your vibes.</p>
            <h1>Manage <br/> your moods</h1>
          </div>
        </div>
      </div>
      
      {/* Login Form */}
      <div className="music-right">
        <div className="music-top-nav">
           <div className="music-logo">Moodify</div>
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
          <div className="music-input-group">
            <input 
              type="password" 
              placeholder="Password" 
              onChange={e => setPassword(e.target.value)} 
              onFocus={() => setError("")} 
            />
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

          <button className="music-main-btn" onClick={submit} disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </div>
        <p className="music-footer">© 2025 Moodify Inc. | Contact Us</p>
      </div>
    </div>
  );
}