import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State for loading and error messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); 
  
  const navigate = useNavigate(); 

  // Send OTP LOgic 
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
      
      alert("Password reset successfully. Please login.");
      navigate("/login"); 
    } catch (err) { 
        setError(err.response?.data?.error || "Failed to reset password"); 
    } finally {
        setIsLoading(false);
    }
  };

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
           <div className="music-logo">Moodify</div>
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
              <div className="music-input-group">
                <input 
                    type="password" 
                    placeholder="New Password" 
                    onChange={e => setNewPassword(e.target.value)}
                    onFocus={() => setError("")}
                />
              </div>
              <div className="music-input-group">
                <input 
                    type="password" 
                    placeholder="Confirm Password" 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    onFocus={() => setError("")}
                />
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

        </div>
        <p className="music-footer">© 2025 Moodify Inc. | Contact Us</p>
      </div>
    </div>
  );
}