import './App.css';
import React, { useState, useRef } from 'react';

const mockEmails = [
  { id: 1, from: "alice@example.com", date: "2025-05-29", subject: "Meeting Update", body: "Let's reschedule our meeting to next week." },
  { id: 2, from: "bob@example.com", date: "2025-05-28", subject: "Project Files", body: "Please find the attached project files." },
  { id: 3, from: "carol@example.com", date: "2025-05-27", subject: "Lunch?", body: "Are you free for lunch tomorrow?" },
];

const TABS = ["Original", "Summary", "Reply"];

function App() {
  const [selectedEmailIdx, setSelectedEmailIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("Original");
  const [replyText, setReplyText] = useState("");
  const carouselRef = useRef(null);

  const email = mockEmails[selectedEmailIdx];

  // Scroll to the selected email when arrows are clicked
  const handleArrowClick = (direction) => {
    let newIdx = selectedEmailIdx + direction;
    newIdx = Math.max(0, Math.min(mockEmails.length - 1, newIdx));
    setSelectedEmailIdx(newIdx);

    // Scroll the selected item into view
    setTimeout(() => {
      const carousel = carouselRef.current;
      if (carousel) {
        const selected = carousel.querySelector('.carousel-item.selected');
        if (selected) {
          selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }, 0);
  };

  return (
    <div className="App">
      <header className="mail-header">
        <h2>Email Assistant</h2>
      </header>
      {/* Email carousel */}
      <div className="carousel-container">
        <button
          className="carousel-arrow"
          onClick={() => handleArrowClick(-1)}
          disabled={selectedEmailIdx === 0}
          aria-label="Previous"
        >
          {/* Left Arrow SVG */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#007bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="carousel-list" ref={carouselRef}>
          {mockEmails.map((em, idx) => (
            <div
              key={em.id}
              className={`carousel-item${idx === selectedEmailIdx ? " selected" : ""}`}
              onClick={() => setSelectedEmailIdx(idx)}
            >
              <div className="carousel-from">{em.from}</div>
              <div className="carousel-date">{em.date}</div>
            </div>
          ))}
        </div>
        <button
          className="carousel-arrow"
          onClick={() => handleArrowClick(1)}
          disabled={selectedEmailIdx === mockEmails.length - 1}
          aria-label="Next"
        >
          {/* Right Arrow SVG */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="#007bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <div
            key={tab}
            className={`tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
      {/* Email details */}
      <div className="email-details">
        <div className="email-meta">
          <strong>From:</strong> {email.from} <br />
          <strong>Date:</strong> {email.date} <br />
          <strong>Subject:</strong> {email.subject}
        </div>
        {activeTab === "Original" && (
          <div className="email-body">{email.body}</div>
        )}
        {activeTab === "Summary" && (
          <div className="ai-summary">
            <strong>AI Summary:</strong>
            <div className="ai-summary-text">
              This is a summary of the email content.
            </div>
          </div>
        )}
        {activeTab === "Reply" && (
          <div className="ai-reply">
            <strong>AI Response:</strong>
            <div className="ai-reply-text">
              This is a suggested reply to the email.
            </div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Write your reply here..."
              className="reply-textarea"
            />
            <div className="reply-actions">
              <button className="draft-btn">Save as Draft</button>
              <button className="send-btn">Send Email</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
