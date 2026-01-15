import React from 'react';
import '../styles/Footer.css'; 
import moodifyLogo from "../images/Moodify logo.png";

const Footer = () => {
  return (
    <footer className="spotify-footer">
      <div className="footer-container">
        <div className="footer-columns">
          {/* Logo Column */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
               <img src={moodifyLogo} alt="Moodify Logo" style={{ height: "220px" }} />
            </div>
          </div>

          {/* Links Columns */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li>About</li>
              <li>For the Record</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Useful Links</h4>
            <ul>
              <li>Support</li>
              <li>Web Player</li>
              <li>Moodify Free</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Connect with us</h4>
            <ul>
              <li>Instagram</li>
              <li>Facebook</li>
              <li>Twitter</li>
            </ul>
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