import './App.css';
import React, { useState, useRef } from 'react';

const STATUSES = [
  "Configure setup",
  "Configurations confirmed",
  "Running",
  "Inactive"
];

function App() {
  const [status, setStatus] = useState(STATUSES[0]);
  const [config, setConfig] = useState({ email: '', password: '', server: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [logEmails, setLogEmails] = useState([
    { id: 1, from: "alice@example.com", subject: "Meeting Update", date: "2025-05-29", draft: "Sure, let's reschedule." },
    { id: 2, from: "bob@example.com", subject: "Project Files", date: "2025-05-28", draft: "Thanks for the files!" },
    { id: 3, from: "carol@example.com", subject: "Lunch?", date: "2025-05-27", draft: "Lunch sounds good!" },
    { id: 4, from: "dan@example.com", subject: "Invoice", date: "2025-05-26", draft: "Invoice attached." },
    { id: 5, from: "eve@example.com", subject: "Vacation Notice", date: "2025-05-25", draft: "I'll be on vacation next week." },
    { id: 6, from: "frank@example.com", subject: "Follow Up", date: "2025-05-24", draft: "Just following up on our last conversation." },
    { id: 7, from: "grace@example.com", subject: "Welcome!", date: "2025-05-23", draft: "Welcome to the team!" },
    { id: 8, from: "heidi@example.com", subject: "Schedule", date: "2025-05-22", draft: "Here's my schedule for next week." }
  ]);
  const carouselRef = useRef(null);
  const [selectedLogIdx, setSelectedLogIdx] = useState(0);

  // For long press scroll
  const scrollInterval = useRef(null);

  const handleConfigChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setStatus(STATUSES[1]);
  };

  const handleStart = () => {
    setStatus(STATUSES[2]);
  };

  const startScroll = (direction) => {
    handleLogArrowClick(direction); // Initial scroll
    scrollInterval.current = setInterval(() => {
      handleLogArrowClick(direction);
    }, 120); // Adjust speed as needed
  };

  const stopScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  // Scroll to selected log email in the log carousel
  const handleLogArrowClick = (direction) => {
    const carousel = carouselRef.current;
    if (carousel) {
      const scrollAmount = 160; // Adjust to match your card width + gap
      carousel.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="App">
      <header className="mail-header">
        <h2>Email Assistant</h2>
      </header>

      {/* Status Bar */}
      <div className="status-bar">
        <strong>Status:</strong> <span className="status-text">{status}</span>
      </div>

      {/* Configurations Card */}
      <div className="config-card">
        <div className="config-title">Configurations</div>
        <div className="config-fields">
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={config.email}
              onChange={handleConfigChange}
              disabled={confirmed}
              className="config-input"
              autoComplete="username"
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              name="password"
              value={config.password}
              onChange={handleConfigChange}
              disabled={confirmed}
              className="config-input"
              autoComplete="current-password"
            />
          </label>
          <label>
            Server:
            <input
              type="text"
              name="server"
              value={config.server}
              onChange={handleConfigChange}
              disabled={confirmed}
              className="config-input"
              placeholder="imap.gmail.com"
            />
          </label>
        </div>
        <button
          className="confirm-btn"
          onClick={handleConfirm}
          disabled={confirmed || !config.email || !config.password || !config.server}
        >
          Confirm
        </button>
      </div>

      {/* Start Assistant Button */}
      <div className="start-row">
        <button
          className="start-btn"
          onClick={handleStart}
          disabled={!confirmed || status === STATUSES[2]}
        >
          START ASSISTANT
        </button>
      </div>

      {/* Log of AI drafted emails (carousel at bottom) */}
      <div className="log-label">Draft Log</div>
      <div className="carousel-container log-carousel">
        <button
          className="carousel-arrow"
          onClick={() => handleLogArrowClick(-1)}
          onMouseDown={() => startScroll(-1)}
          onMouseUp={stopScroll}
          onMouseLeave={stopScroll}
          onTouchStart={() => startScroll(-1)}
          onTouchEnd={stopScroll}
          disabled={selectedLogIdx === 0}
          aria-label="Previous"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#ff8800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="carousel-list" ref={carouselRef}>
          {logEmails.map((em, idx) => (
            <div
              key={em.id}
              className="carousel-item"
            >
              <div className="carousel-from">{em.from}</div>
              <div className="carousel-date">{em.date}</div>
              <div className="carousel-subject">{em.subject}</div>
            </div>
          ))}
        </div>
        <button
          className="carousel-arrow"
          onClick={() => handleLogArrowClick(1)}
          onMouseDown={() => startScroll(1)}
          onMouseUp={stopScroll}
          onMouseLeave={stopScroll}
          onTouchStart={() => startScroll(1)}
          onTouchEnd={stopScroll}
          disabled={selectedLogIdx === logEmails.length - 1}
          aria-label="Next"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="#ff8800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="draft-count-label">
         Drafted <strong>12,345</strong> e-mails!
      </div>
    </div>
  );
}

export default App;
