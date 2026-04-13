import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/Register.css";
import MoodifyLogo from "../images/Moodify-logo.png"; 

export default function Register() {
  const [step, setStep] = useState(1); 
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate(); 
  const requestOtp = async () => {
    setError(""); 
    if(!username || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }
    if(password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    // Validate password length (6-18 characters)
    if (password.length < 6 || password.length > 18) {
      setError("Password must be between 6 and 18 characters.");
      return;
    }
    // Validate email format before calling backend
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address (e.g. name@gmail.com)");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/register-step1", { username, email, password });
      setStep(2); 
      setError("");
    } catch (err) { 
      setError(err.response?.data?.error || "Error sending OTP"); 
    } finally {
      setIsLoading(false);
    }
  };
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
  const verifyAndRegister = async () => {
    setError("");
    const finalOtp = otp.join("");
    if(finalOtp.length < 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:5000/verify-registration", { email, otp: finalOtp });
      navigate("/login"); 
    } catch (err) { 
      setError(err.response?.data?.error || "Invalid OTP"); 
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
            <p className="music-tagline">Start your journey with us.</p>
            <h1>Create <br/> Your Account</h1>
          </div>
        </div>
      </div>
      <div className="music-right">
        <div className="music-top-nav">
           <img src={MoodifyLogo} alt="Moodify" className="music-logo-img" />
           <Link to="/login" className="music-signup-btn">Sign In</Link>
        </div>
        <div className="music-form-box">
          <h2>{step === 1 ? "Sign Up" : "Verification"}</h2>
          
          {step === 1 ? (
            <>
              <div className="music-input-group">
                <input placeholder="Username" onChange={e => setUsername(e.target.value)} onFocus={() => setError("")} />
              </div>
              <div className="music-input-group">
                <input placeholder="Email" onChange={e => setEmail(e.target.value)} onFocus={() => setError("")} />
              </div>
              {/* Password field with eye toggle */}
              <div className="music-input-group" style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (6–18 characters)"
                  maxLength={18}
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
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
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
              
              {/* Error Message */}
              {error && <p style={{color: '#e74c3c', fontSize: '0.9rem', marginBottom: '15px', fontWeight: '600'}}>{error}</p>}
              {/* Guide link — shown just above the register button */}
              <div className="music-guide-link-row">
                <span className="music-guide-hint">Difficulty in registration?</span>
                <Link to="/user-manual" className="music-guide-link">Read the guide</Link>
              </div>
              <button className="music-main-btn" onClick={requestOtp} disabled={isLoading}>
                {isLoading ? "Sending..." : "Register Now"}
              </button>
            </>
          ) : (
            <>
              <p style={{marginBottom: '20px', color: '#555'}}>Code sent to {email}</p>
              
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
              
              {/* Error Message for OTP */}
              {error && <p style={{color: '#e74c3c', fontSize: '0.9rem', marginBottom: '15px', fontWeight: '600', textAlign: 'center'}}>{error}</p>}
              <button className="music-main-btn" onClick={verifyAndRegister} disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Account"}
              </button>
              
              <p className="music-back-link" onClick={() => { setStep(1); setError(""); }}>Go back</p>
            </>
          )}
        </div>
        <p className="music-footer">© 2025 Moodify Inc. | Contact Us</p>
      </div>
    </div>
  );
}
