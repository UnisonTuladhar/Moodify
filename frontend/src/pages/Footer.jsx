import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Footer.css'; 
import moodifyLogo from "../images/Moodify logo.png";

const Footer = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <footer className="spotify-footer">
      <div className="footer-container">
        <div className="footer-columns">
          
          {/* Brand & About Column */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
               <img src={moodifyLogo} alt="Moodify Logo" />
               <h2 className="brand-name">MOODIFY</h2>
            </div>
            <p className="brand-description">
              Moodify is an AI-powered music recommendation system that uses advanced facial recognition 
              to understand your emotions. We specialize in curating the perfect auditory experience 
              tailored to your real-time vibes.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li onClick={() => navigate("/home")}>Home</li>
              <li>About</li>
              <li onClick={() => navigate("/settings")}>Profile</li>
              <li onClick={() => navigate("/dashboard")}>Dashboard</li>
              <li onClick={handleLogout} >Logout</li>
            </ul>
          </div>

          {/* Social Column */}
          <div className="footer-col">
            <h4>Connect with us</h4>
            <ul>
              <li>
                <a href="https://www.instagram.com/accounts/login/" target="_blank" rel="noopener noreferrer">Instagram</a>
              </li>
              <li>
                <a href="https://www.facebook.com/login/" target="_blank" rel="noopener noreferrer">Facebook</a>
              </li>
              <li>
                <a href="https://x.com/login" target="_blank" rel="noopener noreferrer">Twitter</a>
              </li>
            </ul>
          </div>

          {/* Contacts Column */}
          <div className="footer-col contact-col">
            <h4>Contacts</h4>
            <div className="contact-item">
              <div className="contact-icon">✉</div>
              <div>
                <strong>EMAIL</strong>
                <p>info@moodify.com</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div>
                <strong>PHONE</strong>
                <p>+977 9800000000</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">💬</div>
              <div>
                <strong>WHATSAPP</strong>
                <p>+977 9800000000</p>
              </div>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            <span>Legal</span>
            <span>Safety & Privacy Center</span>
            <span>Privacy Policy</span>
            <span>Cookies</span>
            <span>Accessibility</span>
          </div>
          <div className="footer-copyright">
            © 2025 Moodify 
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;