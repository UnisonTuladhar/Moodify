import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/Register.css";

export default function Register() {
  const [step, setStep] = useState(1); 
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate(); 

  const requestOtp = async () => {
    if(!username || !email || !password) return alert("Please fill all fields");
    try {
      const res = await axios.post("http://127.0.0.1:5000/register-step1", { username, email, password });
      alert(res.data.message);
      setStep(2); 
    } catch (err) { alert(err.response?.data?.error || "Error sending OTP"); }
  };

  const verifyAndRegister = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/verify-registration", { email, otp });
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
            <p className="music-tagline">Start your journey with us.</p>
            <h1>Create <br/> Your Account</h1>
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
          <h2>{step === 1 ? "Sign Up" : "Verification"}</h2>
          {step === 1 ? (
            <>
              <div className="music-input-group">
                <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="music-input-group">
                <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="music-input-group">
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
              </div>
              <button className="music-main-btn" onClick={requestOtp}>Register Now</button>
            </>
          ) : (
            <>
              <p style={{marginBottom: '20px', color: '#555'}}>Code sent to {email}</p>
              <div className="music-input-group">
                <input 
                  placeholder="Enter OTP" 
                  value={otp} // Keeps the box empty and follows logic
                  onChange={e => setOtp(e.target.value)} 
                />
              </div>
              <button className="music-main-btn" onClick={verifyAndRegister}>Verify Account</button>
              <p className="music-back-link" onClick={() => setStep(1)}>Go back</p>
            </>
          )}
        </div>
        <p className="music-footer">© 2025 Moodify Inc. | Contact Us</p>
      </div>
    </div>
  );
}