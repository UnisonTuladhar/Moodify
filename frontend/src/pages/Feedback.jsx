import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Shared.css";
import "../styles/Settings.css";
import "../styles/Feedback.css";
import profileImg from "../images/profile.jpg";
export default function Feedback() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  // Pre-fill email and username from localStorage
  const userEmail = localStorage.getItem("email") || "";
  const storedUsername = localStorage.getItem("username") || "";
  // Form state
  const [name, setName] = useState(storedUsername);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Validate mandatory subject field
    if (!subject.trim()) {
      setError("Please enter a subject before submitting.");
      return;
    }
    // Validate mandatory message field
    if (!message.trim()) {
      setError("Please enter your feedback message before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post("http://127.0.0.1:5000/user/submit-feedback", {
        email: userEmail,
        name: name.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setMessage("");
      setSubject("");
      setName(storedUsername);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="music-home-container settings-page-bg">
      {/* Navbar */}
      <nav className="music-nav">
        <div
          className="music-logo"
          onClick={() => navigate("/home")}
          style={{ cursor: "pointer" }}
        >
          Moodify
        </div>
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
              <p onClick={() => navigate("/detect-mood")}>Mood Detection</p>
              <p onClick={() => navigate("/playlists")}>Playlists</p>
              <p onClick={() => navigate("/settings")}>Settings</p>
              <p onClick={handleLogout} className="dropdown-logout">Logout</p>
            </div>
          )}
        </div>
      </nav>
      {/* Back Button */}
      <div className="settings-back-container">
        <button className="back-link-btn" onClick={() => navigate("/home")}>
          Back to Home
        </button>
      </div>
      {/* Feedback Card */}
      <div className="feedback-page-wrapper">
        <div className="feedback-card">
          {/* Header */}
          <div className="feedback-card-header">
            <div className="feedback-header-icon"></div>
            <div>
              <h2>Send Feedback</h2>
              <p>We'd love to hear your thoughts, suggestions, or issues you're facing.</p>
            </div>
          </div>
          <div className="settings-divider"></div>
          {/* Success State */}
          {success ? (
            <div className="feedback-success-box">
              <div className="feedback-success-icon"></div>
              <h3>Thank you for your feedback!</h3>
              <p>Your message has been received and will be reviewed by our team.</p>
              <div className="feedback-success-actions">
                <button
                  className="settings-save-btn"
                  onClick={() => setSuccess(false)}
                >
                  Send Another
                </button>
                <button
                  className="back-link-btn"
                  style={{ marginLeft: "12px" }}
                  onClick={() => navigate("/home")}
                >
                  Go to Home
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="settings-form">
              {/* Email (read-only, auto-filled) */}
              <div className="music-input-group">
                <label>
                  Your Email
                  <span className="feedback-auto-label"> (auto-filled)</span>
                </label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className="feedback-readonly-input"
                  placeholder="No email found"
                />
              </div>
              {/* Name (optional) */}
              <div className="music-input-group">
                <label>
                  Name{" "}
                  <span style={{ color: "#aaa", fontWeight: "400" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={100}
                />
              </div>
              {/* Subject (mandatory) */}
              <div className="music-input-group">
                <label>
                  Subject{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "600" }}>*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Bug report, Feature suggestion, General feedback..."
                  maxLength={200}
                  required
                />
              </div>
              {/* Message (mandatory) */}
              <div className="music-input-group">
                <label>
                  Your Feedback{" "}
                  <span style={{ color: "#e74c3c", fontWeight: "600" }}>*</span>
                </label>
                <textarea
                  className="feedback-textarea"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Write your suggestions, issues, or any feedback here..."
                  rows={6}
                  maxLength={2000}
                  required
                />
                <div className="feedback-char-count">
                  {message.length} / 2000
                </div>
              </div>
              {/* Error */}
              {error && (
                <p className="feedback-error-msg">{error}</p>
              )}
              {/* Submit */}
              <button
                className="settings-save-btn"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
