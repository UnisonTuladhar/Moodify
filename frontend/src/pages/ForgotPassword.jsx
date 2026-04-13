import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/ForgotPassword.css";
import MoodifyLogo from "../images/Moodify-logo.png"; 

export default function ForgotPassword() {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // State for loading and error messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); 
  // State for inline success message on password reset
  const [resetSuccess, setResetSuccess] = useState(false);
  // State to toggle password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate(); 
  // Send OTP Logic 
  const sendOtp = async () => {
    setError(""); 
    const cleanEmail = email.trim();
    if(!cleanEmail) {
        setError("Please enter an email address");
        return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/forgot-password", { email: cleanEmail });
      if(res.status === 200) {
        setStep(2);
        setError(""); 
      }
    } catch (err) { 
        setError(err.response?.data?.error || "User not found"); 
    } finally {
        setIsLoading(false);
    }
  };
  // OTP Input Logic
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };
  const handleKeyDown = (e, index) => {
      if (e.key === "Backspace") {
          if (e.target.previousSibling && otp[index] === "") {
              e.target.previousSibling.focus();
          }
      }
  };
  // Verify OTP
  const verifyOtp = async () => {
      setError("");
      const finalOtp = otp.join("");
      const cleanEmail = email.trim();
      
      if(finalOtp.length !== 6) {
          setError("Please enter the 6-digit code.");
          return;
      }
      setIsLoading(true);
      try {
          const res = await axios.post("http://127.0.0.1:5000/verify-forgot-otp", { email: cleanEmail, otp: finalOtp });
          if(res.status === 200) {
              setStep(3); 
              setError("");
          }
      } catch (err) {
          setError(err.response?.data?.error || "Invalid OTP");
      } finally {
          setIsLoading(false);
      }
  };
  // Update Password
  const resetPassword = async () => {
    setError(""); 
    if(!newPassword || !confirmPassword) {
        setError("Please fill all fields");
        return;
    }
    
    // Check if passwords match
    // Validate password length (6-18 characters)
    if (newPassword.length < 6 || newPassword.length > 18) {
        setError("Password must be between 6 and 18 characters.");
        return;
    }
    if(newPassword !== confirmPassword) {
        setError("Passwords do not match!");
        return;
    }
    const cleanEmail = email.trim();
    
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:5000/reset-password", { 
          email: cleanEmail, 
          new_password: newPassword
      });
      
      // Show inline success message instead of browser alert
      setResetSuccess(true);
      // Navigate to login after a short delay so user can read the message
      setTimeout(() => {
        navigate("/login"); 
      }, 2500);
    } catch (err) { 
        setError(err.response?.data?.error || "Failed to reset password"); 
    } finally {
        setIsLoading(false);
    }
  };

  // Reusable eye toggle SVG icons
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <div className="music-container">
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
      <div className="music-right">
        <div className="music-top-nav">
           <img src={MoodifyLogo} alt="Moodify" className="music-logo-img" />
           <Link to="/login" className="music-signup-btn">Sign In</Link>
        </div>
        <div className="music-form-box">
          
          {step === 1 && (
            <>
              <h2>Reset Password</h2>
              <div className="music-input-group">
                <input 
                    placeholder="Email Address" 
                    onChange={e => setEmail(e.target.value)} 
                    onFocus={() => setError("")} 
                />
              </div>
              
              {error && <p style={{color: '#e74c3c', fontSize: '0.9rem', marginBottom: '15px'}}>{error}</p>}
              
              <button className="music-main-btn" onClick={sendOtp} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send OTP Code"}
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Verification</h2>
              <p style={{marginBottom: '15px', color: '#666'}}>Enter the 6-digit OTP sent to your email.</p>
              <div className="otp-container">
                {otp.map((data, index) => (
                  <input
                    className="otp-input"
                    type="text"
                    name="otp"
                    maxLength="1"
                    key={index}
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={(e) => { e.target.select(); setError(""); }}
                  />
                ))}
              </div>
              {error && <p style={{color: '#e74c3c', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center'}}>{error}</p>}
              <button className="music-main-btn" onClick={verifyOtp} disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <p className="music-back-link" onClick={() => { setStep(1); setError(""); }} style={{marginTop: '15px', cursor: 'pointer', textAlign: 'center'}}>Go back</p>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Create New Password</h2>
              
              {/* Inline success message shown after successful reset */}
              {resetSuccess ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  padding: "24px 20px",
                  borderRadius: "14px",
                  background: "#f0faf4",
                  border: "1px solid #a8e6c3",
                  textAlign: "center",
                  marginTop: "10px"
                }}>
                  <span style={{ fontSize: "2.5rem" }}>✅</span>
                  <p style={{ color: "#1a7f4b", fontWeight: "700", fontSize: "1rem", margin: 0 }}>
                    Password reset successfully!
                  </p>
                  <p style={{ color: "#555", fontSize: "0.88rem", margin: 0 }}>
                    Redirecting you to login...
                  </p>
                </div>
              ) : (
                <>
                  {/* New Password field with eye toggle */}
                  <div className="music-input-group" style={{ position: "relative" }}>
                    <input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="New Password (6–18 characters)" 
                        maxLength={18}
                        onChange={e => setNewPassword(e.target.value)}
                        onFocus={() => setError("")}
                        style={{ paddingRight: "48px" }}
                    />
                    {/* Eye toggle button */}
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
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
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {/* Confirm Password field with eye toggle */}
                  <div className="music-input-group" style={{ position: "relative" }}>
                    <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Confirm Password" 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        onFocus={() => setError("")}
                        style={{ paddingRight: "48px" }}
                    />
                    {/* Eye toggle button */}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
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
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {/* Error Message Display */}
                  {error && (
                    <p style={{
                        color: '#e74c3c', 
                        fontSize: '0.95rem', 
                        marginBottom: '20px', 
                        textAlign: 'left',
                        fontWeight: '600'
                    }}>
                        {error}
                    </p>
                  )}
                  <button className="music-main-btn" onClick={resetPassword} disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
        <p className="music-footer">© 2025 Moodify Inc. | Contact Us</p>
      </div>
    </div>
  );
}
