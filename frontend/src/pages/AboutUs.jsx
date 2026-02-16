import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Shared.css";
import "../styles/AboutUs.css";
import profileImg from "../images/profile.jpg"; 
import Footer from "./Footer";
import aboutHeroImg from "../images/AboutUs.png";
import expertiseImg from "../images/Expertise-AboutUs.png";
import toolsImg from "../images/Tools-AboutUs.png";
import dashboardImg from "../images/Dashboard-AboutUs.png"; 

export default function AboutUs() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="music-home-container">
      {/* Navbar */}
      <nav className="music-nav">
        <div className="music-logo" onClick={() => navigate("/home")} style={{cursor:'pointer'}}>Moodify</div>
        <div className="profile-container">
          <img 
            src={profileImg} 
            alt="profile" 
            className="profile-icon-img"
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className="profile-dropdown">
              <p onClick={() => navigate("/home")}>Home</p>
              <p onClick={() => navigate("/dashboard")}>Dashboard</p>
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="about-hero-section">
        <div className="about-hero-content">
            <div className="about-text-col">
                <h1 className="about-title">About Us</h1>
                <p className="about-breadcrumb">
                    <span onClick={() => navigate("/home")}>Home</span> • <span className="active">About Us</span>
                </p>
                <p className="about-description">
                    Moodify is an emotion-based music recommendation system designed to personalize 
                    your listening experience using artificial intelligence. By analyzing user emotions 
                    through advanced emotion detection techniques, Moodify recommends music that aligns 
                    with the user's current mood. Whether you need motivation, relaxation, or emotional 
                    balance, Moodify intelligently selects music that enhances your moment. 

                    From facial emotion recognition to curating the perfect playlist, we offer a 
                    comprehensive solution driven by innovation and empathy. Our dedicated system 
                    bridges the gap between your feelings and the music you love, ensuring every 
                    track resonates with your current state of mind in today's dynamic digital landscape.

                    Our goal is to combine technology and music to create a smarter, 
                    more emotionally aware listening experience.
                </p>
            </div>
            <div className="about-img-col">
                <img src={aboutHeroImg} alt="About Us Illustration" className="about-hero-img" />
            </div>
        </div>
      </div>

      {/* Why Moodify Section*/}
      <div className="why-section-container">
        <h2 className="why-title">Why Moodify?</h2>

        <div className="feature-row">
            <div className="feature-text">
                <h3 className="feature-heading">1. Expertise Combined with Compassion:</h3>
                <p>
                    We believe technology should do more than function — it should understand. 
                    Moodify combines advanced artificial intelligence with a deep focus on emotional
                    well-being. By analyzing facial expressions through real-time camera input, our 
                    system understands user emotions and delivers music that provides comfort, motivation, 
                    or relaxation when it's needed most. This seamless blend of emotion recognition and music creates a truly human-centric experience.
                </p>
            </div>
            <div className="feature-img">
                 <img src={expertiseImg} alt="Expertise Diagram" />
            </div>
        </div>

        <div className="feature-row reverse-layout">
            <div className="feature-img">
                 <img src={toolsImg} alt="Tools and Resources" />
            </div>
            <div className="feature-text">
                <h3 className="feature-heading">2. Tools and Resources:</h3>
                <p>
                   Moodify uses advanced computer vision and machine learning to detect subtle emotional cues accurately. 
                   Based on the detected mood, the system instantly recommends music from a diverse and carefully curated music library.
                    Each recommendation is personalized, ensuring that every user receives music that aligns perfectly with their emotional state — anytime, anywhere.
                </p>
            </div>
        </div>

        <div className="feature-row">
            <div className="feature-text">
                <h3 className="feature-heading">3. Insightful Emotion Tracking & User Dashboard:</h3>
                <p>
                    Moodify goes beyond music recommendation by helping users understand their emotional patterns. 
                    The application securely stores detected emotions and presents them visually through an interactive dashboard.
                    Users can view their emotional history using pie charts and bar graphs, enabling them to track mood trends over time,
                    gain self-awareness, and reflect on their emotional well-being.
                </p>
            </div>
            <div className="feature-img">
                 <img src={dashboardImg} alt="Dashboard and Analytics" />
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}