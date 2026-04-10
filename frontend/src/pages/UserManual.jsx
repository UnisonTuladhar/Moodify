import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Shared.css";
import "../styles/UserManual.css";

// Manual sections data
const sections = [
  {
    id: "getting-started",
    icon: "🚀",
    title: "Getting Started",
    color: "#7c3aed",
    accent: "#f3f0ff",
    steps: [
      {
        step: "1",
        heading: "Create Your Account",
        body: "Visit the Moodify app and click Register. Enter your username, email address, and a secure password. You will receive a 6-digit verification code to your email — enter it to activate your account.",
      },
      {
        step: "2",
        heading: "Log In",
        body: "Once verified, head to the Login page and sign in with your email and password. You will be taken directly to your personalized home page.",
      },
      {
        step: "3",
        heading: "Welcome Home",
        body: "Your home page greets you by name and gives you quick access to all of Moodify's features. You can detect your mood, explore the dashboard, or read this manual anytime.",
      },
    ],
  },
  {
    id: "detect-mood",
    icon: "📷",
    title: "Detecting Your Mood",
    color: "#ff4e00",
    accent: "#fff5f0",
    steps: [
      {
        step: "1",
        heading: "Click 'Detect My Mood'",
        body: "From the home page, press the orange Detect My Mood button. Your browser will ask for camera permission — click Allow so Moodify can see your face.",
      },
      {
        step: "2",
        heading: "Look at the Camera",
        body: "Position yourself so your face is clearly visible and well-lit. The AI will scan your facial expressions in real-time. You will see a live preview with a colored rectangle drawn around your face and your current detected emotion labelled above it.",
      },
      {
        step: "3",
        heading: "Emotion is Confirmed",
        body: "Moodify waits until it is confident about your emotion before locking it in. The detected emotion — Happy, Sad, Angry, Neutral, or Surprise — is shown on screen. The camera turns off automatically once the mood is confirmed.",
      },
      {
        step: "4",
        heading: "Mood is Saved",
        body: "Your detected emotion is saved to your emotion history automatically so you can track it over time in the Dashboard.",
      },
    ],
  },
  {
    id: "get-playlist",
    icon: "🎵",
    title: "Getting Your Playlist",
    color: "#ec008c",
    accent: "#fff0f8",
    steps: [
      {
        step: "1",
        heading: "AI-Recommended Songs",
        body: "After your mood is detected, Moodify instantly fetches up to 15 songs from its AI-powered music library (Jamendo) that match your emotional state. Every time you detect a mood, the playlist is freshly generated — so you always get a different set of songs.",
      },
      {
        step: "2",
        heading: "Admin-Added Songs",
        body: "In addition to AI recommendations, the Moodify team curates and uploads songs directly into the app. Up to 5 of these hand-picked tracks (matching your mood) are also included in your playlist for a personal touch.",
      },
      {
        step: "3",
        heading: "Language Selection",
        body: "A language filter will let you choose the songs language of your choice — so you can enjoy music in your preferred language every time.",
      },
      {
        step: "4",
        heading: "Create a Playlist",
        body: "You will be able to save your current playlist as a named collection, so you can revisit your favourite mood-based playlists anytime.",
      },
      {
        step: "5",
        heading: "Like Songs",
        body: "Tap the heart icon on any song to like it. Liked songs are saved to your personal collection and can be accessed anytime from your Dashboard.",
      },
      {
        step: "6",
        heading: "Get Fresh Songs",
        body: "Don't like the current playlist? Press the Refresh button to instantly generate a brand-new set of AI-recommended tracks for your mood.",
      },
    ],
  },
  {
    id: "dashboard",
    icon: "📊",
    title: "Your Dashboard",
    color: "#2d3a8c",
    accent: "#eef0ff",
    steps: [
      {
        step: "1",
        heading: "View Mood Analytics",
        body: "The Dashboard shows you beautiful charts of your emotional patterns over time. See which moods you experience most, track how your emotions change day by day, and gain deeper self-awareness.",
      },
      {
        step: "2",
        heading: "Filter by Date or Mood",
        body: "Use the filter options to narrow down your history by a specific date range or a particular mood (e.g., only show your Happy sessions from last week).",
      },
      {
        step: "3",
        heading: "View Liked Songs",
        body: "The Dashboard also shows all the songs you have liked so far. You can play them directly from here without needing to detect your mood again.",
      },
      {
        step: "4",
        heading: "Detected Emotion History",
        body: "Every mood detection session is logged with the emotion and the exact date and time. You can scroll through your full emotion history to see your journey over days, weeks, and months.",
      },
    ],
  },
  {
    id: "settings",
    icon: "⚙️",
    title: "Settings",
    color: "#1a1614",
    accent: "#f7f7f7",
    steps: [
      {
        step: "1",
        heading: "Change Your Password",
        body: "Go to Settings and select Change Password. Enter your current password, then type and confirm your new password. Click Save to update it immediately.",
      },
      {
        step: "2",
        heading: "Update Your Profile",
        body: "You can update your display name, gender, and address from the Settings page. These details help personalise your Moodify experience.",
      },
      {
        step: "3",
        heading: "Delete Your Account",
        body: "If you wish to permanently remove your account, go to Settings and select Delete Account. You will be asked to confirm your password before deletion. Warning: this action is permanent and cannot be undone — all your data, history, and liked songs will be erased.",
      },
    ],
  },
  {
    id: "about",
    icon: "ℹ️",
    title: "About Us",
    color: "#059669",
    accent: "#f0fdf4",
    steps: [
      {
        step: "1",
        heading: "Learn More About Moodify",
        body: "Visit the About Us page from the navigation to read the full story behind Moodify — why it was built, the technology that powers it (Computer Vision, Convolutional Neural Networks), and the vision for emotion-aware music.",
      },
      {
        step: "2",
        heading: "How the AI Works",
        body: "The About Us page explains in plain language how the facial emotion detection model was trained, what emotions it can detect, and how the music recommendation engine maps emotions to music genres.",
      },
    ],
  },
  {
    id: "socials",
    icon: "🌐",
    title: "Connect With Us",
    color: "#0ea5e9",
    accent: "#f0f9ff",
    steps: [
      {
        step: "1",
        heading: "Find Us on Social Media",
        body: "You can connect with the Moodify team through our social media profiles linked in the footer of every page. Follow us for updates, new features, and announcements.",
      },
      {
        step: "2",
        heading: "Share Your Feedback",
        body: "We love hearing from our users. If you have a suggestion, found a bug, or just want to say hello — reach out to us through our social channels. Your feedback helps make Moodify better for everyone.",
      },
    ],
  },
];

export default function UserManual() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("getting-started");

  const currentSection = sections.find((s) => s.id === activeSection);

  // if user is logged in go to /home, otherwise go to /login
  const isLoggedIn = !!localStorage.getItem("email");
  const handleBack = () => {
    navigate(isLoggedIn ? "/home" : "/login");
  };
  const backLabel = isLoggedIn ? "Back to Home" : "Back to Login";

  return (
    <div className="manual-root">
      <nav className="manual-nav">
        <div
          className="manual-nav-logo"
          onClick={handleBack}
          style={{ cursor: "pointer" }}
        >
          Moodify
        </div>

        <button className="manual-back-btn" onClick={handleBack}>
          {backLabel}
        </button>
      </nav>

      <div className="manual-hero">
        <div className="manual-hero-diagonal"></div>
        <div className="manual-hero-scan"></div>
        <div className="manual-hero-content">

          <div className="manual-hero-text">
            <div className="manual-hero-badge">📖 Complete Guide</div>
            <h1 className="manual-hero-title">
              How to Use <span className="manual-highlight">Moodify</span>
            </h1>
            <p className="manual-hero-sub">
              Everything you need to know — from detecting your first mood to
              exploring your emotional analytics. Read through each section to get
              the most out of Moodify.
            </p>
            <div className="manual-hero-meta">
              <div className="manual-hero-meta-item">
                <span className="manual-hero-meta-dot"></span>
                7 Sections
              </div>
              <div className="manual-hero-meta-item">
                <span className="manual-hero-meta-dot"></span>
                5 min read
              </div>
              <div className="manual-hero-meta-item">
                <span className="manual-hero-meta-dot"></span>
                Beginner friendly
              </div>
            </div>
            <div className="manual-hero-divider"></div>
          </div>

          <div className="manual-hero-cards">
            <div className="manual-hero-stat-card">
              <div className="manual-hero-stat-icon">📷</div>
              <div>
                <div className="manual-hero-stat-label">Step 1</div>
                <div className="manual-hero-stat-value">Detect your mood with AI</div>
              </div>
            </div>
            <div className="manual-hero-stat-card">
              <div className="manual-hero-stat-icon">🎵</div>
              <div>
                <div className="manual-hero-stat-label">Step 2</div>
                <div className="manual-hero-stat-value">Get a personalised playlist</div>
              </div>
            </div>
            <div className="manual-hero-stat-card">
              <div className="manual-hero-stat-icon">📊</div>
              <div>
                <div className="manual-hero-stat-label">Step 3</div>
                <div className="manual-hero-stat-value">Track emotions in dashboard</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="manual-layout">
        <aside className="manual-sidebar">
          <p className="manual-sidebar-label">SECTIONS</p>
          {sections.map((s) => (
            <button
              key={s.id}
              className={`manual-sidebar-item ${activeSection === s.id ? "active" : ""}`}
              style={
                activeSection === s.id
                  ? { borderLeftColor: s.color, color: s.color, background: s.accent }
                  : {}
              }
              onClick={() => setActiveSection(s.id)}
            >
              <span className="manual-sidebar-icon">{s.icon}</span>
              {s.title}
            </button>
          ))}
        </aside>

        {/* CONTENT PANEL */}
        <main className="manual-content">
          <div
            className="manual-section-header"
            style={{ borderLeftColor: currentSection.color }}
          >
            <span className="manual-section-big-icon">{currentSection.icon}</span>
            <div>
              <p
                className="manual-section-label"
                style={{ color: currentSection.color }}
              >
                Section {sections.indexOf(currentSection) + 1} of {sections.length}
              </p>
              <h2 className="manual-section-title">{currentSection.title}</h2>
            </div>
          </div>

          {/* Steps */}
          <div className="manual-steps">
            {currentSection.steps.map((item, idx) => (
              <div
                key={idx}
                className="manual-step-card"
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                <div
                  className="manual-step-number"
                  style={{
                    background: currentSection.color,
                  }}
                >
                  {item.step}
                </div>
                <div className="manual-step-body">
                  <h3 className="manual-step-heading">{item.heading}</h3>
                  <p className="manual-step-text">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation between sections */}
          <div className="manual-nav-btns">
            {sections.indexOf(currentSection) > 0 && (
              <button
                className="manual-prev-btn"
                onClick={() =>
                  setActiveSection(
                    sections[sections.indexOf(currentSection) - 1].id
                  )
                }
              >
                Previous
              </button>
            )}
            {sections.indexOf(currentSection) < sections.length - 1 && (
              <button
                className="manual-next-btn"
                style={{ background: `linear-gradient(90deg, ${currentSection.color}, #ec008c)` }}
                onClick={() =>
                  setActiveSection(
                    sections[sections.indexOf(currentSection) + 1].id
                  )
                }
              >
                Next Section 
              </button>
            )}
          </div>

          {/* Done — back to app */}
          {sections.indexOf(currentSection) === sections.length - 1 && (
            <div className="manual-done-banner">
              <h3>🎉 You're all set!</h3>
              <p>
                You've read the full Moodify manual. You're ready to start
                detecting your mood and discovering music made for how you feel.
              </p>
              <button
                className="manual-done-btn"
                onClick={() => navigate("/detect-mood")}
              >
                Detect My Mood Now
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
