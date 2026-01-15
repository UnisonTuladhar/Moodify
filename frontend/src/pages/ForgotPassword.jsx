import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate(); 

  const sendOtp = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/forgot-password", { email });
      setStep(2);
    } catch (err) { alert("User not found"); }
  };

  const resetPassword = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/reset-password", { email, otp, new_password: newPassword });
      navigate("/login"); 
    } catch (err) { alert("Invalid OTP"); }
  };

  return (
    <div className="music-container">
      {/* Left Side with Background Image Path */}
      <div 
        className="music-left" 
        style={{ backgroundImage: `url(${require("../images/Login.jpg")})` }}
      >
        <div className="music-overlay">
          <div className="music-content">
            <h1>Recover <br/> your access</h1>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="music-right">
        <div className="music-top-nav">
           <div className="music-logo">Moodify</div>
           <Link to="/login" className="music-signup-btn">Sign In</Link>
        </div>

        <div className="music-form-box">
          <h2>Reset Password</h2>
          {step === 1 ? (
            <>
              <div className="music-input-group">
                <input placeholder="Email Address" onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="music-main-btn" onClick={sendOtp}>Send OTP Code</button>
            </>
          ) : (
            <>
              <div className="music-input-group">
                <input 
                  placeholder="OTP Code" 
                  value={otp} // Added value here to keep box empty initially
                  onChange={e => setOtp(e.target.value)} 
                />
              </div>
              <div className="music-input-group">
                <input type="password" placeholder="New Password" onChange={e => setNewPassword(e.target.value)} />
              </div>
              <button className="music-main-btn" onClick={resetPassword}>Update Password</button>
            </>
          )}
        </div>
        <p className="music-footer">© 2025 Moodify Inc. | Contact Us</p>
      </div>
    </div>
  );
}