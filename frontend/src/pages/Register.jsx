import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/Register.css";

export default function Register() {
  const [step, setStep] = useState(1); 
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  
  const [otp, setOtp] = useState(new Array(6).fill(""));
  
  const [error, setError] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
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
           <div className="music-logo">Moodify</div>
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
              <div className="music-input-group">
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} onFocus={() => setError("")} />
              </div>
              <div className="music-input-group">
                <input type="password" placeholder="Confirm Password" onChange={e => setConfirmPassword(e.target.value)} onFocus={() => setError("")} />
              </div>
              
              {/* Error Message */}
              {error && <p style={{color: '#e74c3c', fontSize: '0.9rem', marginBottom: '15px', fontWeight: '600'}}>{error}</p>}

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