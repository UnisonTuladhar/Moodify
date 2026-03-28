import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Shared.css";
import "../styles/AboutUs.css";
import profileImg from "../images/profile.jpg"; 
import Footer from "./Footer";
import aboutHeroImg from "../images/AboutUs.png";
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
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <button className="back-link-btn" onClick={() => navigate("/home")}>
            Back to Home
          </button>
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
        </div>
      </nav>

      {/* Hero Section */}
      <div className="about-hero-section">
        <div className="about-hero-content">
            <div className="about-text-col">
                <h1 className="about-title">About Us</h1>

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

      {/* How Moodify Works Section */}
      <div className="how-it-works-section">
        <h2 className="how-title">How Moodify Works</h2>
        <p className="how-subtitle">Three simple steps to a perfectly matched playlist</p>
        <div className="how-steps-grid">
          {/* Facial Analysis */}
          <div className="how-step-card">
            <div className="how-step-number">01</div>
            <div className="how-step-icon-wrap">
              <span className="how-step-icon">📷</span>
            </div>
            <h3 className="how-step-title">Facial Analysis</h3>
            <p className="how-step-desc">
              Moodify uses your device's camera to capture your face in real time. 
              Our advanced Computer Vision engine powered by OpenCV analyzes key facial 
              landmarks — the position of your eyebrows, the curve of your lips, 
              the tension in your jaw — to build an accurate picture of your current expression. 
              No data is stored; analysis happens live on the device for your privacy.
            </p>
            <div className="how-step-tags">
              <span className="step-tag">Computer Vision</span>
              <span className="step-tag">Real-time</span>
              <span className="step-tag">Privacy-first</span>
            </div>
          </div>

          {/* AI Detection */}
          <div className="how-step-card how-step-card--featured">
            <div className="how-step-number">02</div>
            <div className="how-step-icon-wrap">
              <span className="how-step-icon">🧠</span>
            </div>
            <h3 className="how-step-title">AI Emotion Detection</h3>
            <p className="how-step-desc">
              Once your facial landmarks are captured, they are passed to our custom-trained 
              Convolutional Neural Network (CNN). The model has been trained on thousands of 
              labeled facial expression images and can confidently classify your emotion 
              into one of five categories: <strong>Happy, Sad, Angry, Neutral,</strong> or <strong>Surprised</strong>. 
              The system confirms your mood only after 3 consistent seconds of detection, 
              ensuring accurate and stable results before recommending music.
            </p>
            <div className="how-step-tags">
              <span className="step-tag">Neural Network</span>
              <span className="step-tag">5 Emotions</span>
              <span className="step-tag">High Accuracy</span>
            </div>
          </div>

          {/* Smart Playlists */}
          <div className="how-step-card">
            <div className="how-step-number">03</div>
            <div className="how-step-icon-wrap">
              <span className="how-step-icon">🎵</span>
            </div>
            <h3 className="how-step-title">Smart Playlists</h3>
            <p className="how-step-desc">
              With your emotion confirmed, Moodify instantly curates a personalized playlist 
              just for you. Songs are sourced from two layers: a carefully hand-curated admin 
              library and live tracks from the Jamendo open-music API. Every song is tagged 
              by mood, so you always receive tracks that truly match how you feel — 
              uplifting beats when you're happy, calming melodies when you're sad, 
              energetic rhythms when you're surprised.
            </p>
            <div className="how-step-tags">
              <span className="step-tag">Mood-matched</span>
              <span className="step-tag">Instant</span>
              <span className="step-tag">Jamendo API</span>
            </div>
          </div>
        </div>

        {/* Flow diagram */}
        <div className="how-flow-row">
          <div className="how-flow-item">
            <div className="how-flow-dot">📷</div>
            <span>Camera Input</span>
          </div>
          <div className="how-flow-arrow">→</div>
          <div className="how-flow-item">
            <div className="how-flow-dot">🔍</div>
            <span>Face Detection</span>
          </div>
          <div className="how-flow-arrow">→</div>
          <div className="how-flow-item">
            <div className="how-flow-dot">🧠</div>
            <span>CNN Model</span>
          </div>
          <div className="how-flow-arrow">→</div>
          <div className="how-flow-item">
            <div className="how-flow-dot">😊</div>
            <span>Emotion Label</span>
          </div>
          <div className="how-flow-arrow">→</div>
          <div className="how-flow-item">
            <div className="how-flow-dot">🎵</div>
            <span>Your Playlist</span>
          </div>
        </div>
      </div>

      {/* Why Moodify Section*/}
      <div className="why-section-container">
        <h2 className="why-title">Why Moodify?</h2>
        <div className="why-cards-grid">
          {/* Card 1 */}
          <div className="why-card">
            <div className="why-card-accent why-card-accent--orange"></div>
            <div className="why-card-icon">💡</div>
            <h3 className="why-card-heading">1. Expertise Combined with Compassion</h3>
            <p>
                We believe technology should do more than function — it should understand. 
                Moodify combines advanced artificial intelligence with a deep focus on emotional well-being. 
                By analyzing facial expressions through real-time camera input, our system understands user emotions 
                and delivers music that provides comfort, motivation, or relaxation when it's needed most. 
                This seamless blend of emotion recognition and music creates a truly human-centric experience.
            </p>
          </div>

          {/* Card 2 */}
          <div className="why-card">
            <div className="why-card-accent why-card-accent--pink"></div>
            <div className="why-card-icon">🛠️</div>
            <h3 className="why-card-heading">2. Tools and Resources</h3>
            <p> Moodify uses advanced computer vision and machine learning to detect subtle emotional cues accurately. 
                Based on the detected mood, the system instantly recommends music from a diverse and carefully curated music library.
                Each recommendation is personalized, ensuring that every user receives music that aligns perfectly with their emotional state — anytime, anywhere.
            </p>
          </div>

          {/* Card 3 */}
          <div className="why-card">
            <div className="why-card-accent why-card-accent--purple"></div>
            <div className="why-card-icon">📊</div>
            <h3 className="why-card-heading">3. Insightful Emotion Tracking & User Dashboard</h3>
            <p>
                Moodify goes beyond music recommendation by helping users understand their emotional patterns. 
                The application securely stores detected emotions and presents them visually through an interactive dashboard.
                Users can view their emotional history using pie charts and bar graphs, enabling them to track mood trends over time,
                gain self-awareness, and reflect on their emotional well-being.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="about-cta-banner">
        <div className="about-cta-inner">
          <h2>Ready to experience music differently?</h2>
          <p>Let Moodify understand your emotions and find the perfect soundtrack for your moment.</p>
          <button className="about-cta-btn" onClick={() => navigate("/detect-mood")}>
            Try Mood Detection
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
