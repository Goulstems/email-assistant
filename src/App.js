import { useEffect, useState, useRef } from "react";
import './App.css';

const STATUSES = [
  "Inactive",
  "Active"
];

function App() {
  const [status, setStatus] = useState(STATUSES[0]);
  const [assistantActive, setAssistantActive] = useState(false);
  const [logEmails, setLogEmails] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const carouselRef = useRef(null);
  const [selectedLogIdx, setSelectedLogIdx] = useState(0);
  const scrollInterval = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState("chatgpt");
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [customLLM, setCustomLLM] = useState({
    name: "",
    endpoint: "",
    apiKey: ""
  });
  // Use processingId instead of processingIdx
  const [processingId, setProcessingId] = useState(null);
  const assistantActiveRef = useRef(assistantActive);

  // Keep ref in sync with state
  useEffect(() => {
    assistantActiveRef.current = assistantActive;
  }, [assistantActive]);

  // Fetch unread emails from backend
  const fetchUnreadEmails = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/gmail/unread');
      if (!res.ok) throw new Error('Not authenticated or error fetching emails');
      const emails = await res.json();
      setLogEmails(emails);
    } catch (err) {
      setLogEmails([]);
    }
  };

  const handleLogin = () => {
    window.location.href = "http://localhost:4000/api/auth/google";
  };

  const handleLogout = () => {
    setAssistantActive(false);
    setStatus(STATUSES[0]);
    setLogEmails([]);
    setVisibleCount(0);
    setIsAuthenticated(false);
  };

  // --- MAIN LOGIC: Start/Stop Assistant ---
  const handleStart = async () => {
    console.log("handleStart called, assistantActive:", assistantActive);

    // Toggle assistantActive state
    if (assistantActive) {
      setAssistantActive(false);
      setStatus("Inactive");
      return;
    }

    setAssistantActive(true);
    setStatus("Active");

    // Let React update the UI before starting the loop!
    await new Promise(resolve => setTimeout(resolve, 0));

    // Work on a copy to avoid index issues
    let emailsToProcess = [...logEmails];
    for (let i = 0; i < emailsToProcess.length; i++) {
      if (!assistantActiveRef.current) break;

      const email = emailsToProcess[i];
      setProcessingId(email.id);

      let endpoint = "/api/llm/reply";
      if (selectedLLM === "huggingface") endpoint = "/api/llm/reply-hf";

      try {
        const res = await fetch(`http://localhost:4000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        await fetch('http://localhost:4000/api/gmail/draft-and-mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: email.id,
            reply: data.body,
            subject: data.subject
          })
        });

        // Animate/fade out
        await new Promise(resolve => setTimeout(resolve, 800)); // for animation

        setLogEmails(prev => prev.filter(e => e.id !== email.id));
        setVisibleCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Processing failed:", err);
      }
      setProcessingId(null); // Clear after removal
    }

    setProcessingId(null);
    setAssistantActive(false);
    setStatus("Inactive");
  };

  const startScroll = (direction) => {
    handleLogArrowClick(direction);
    scrollInterval.current = setInterval(() => {
      handleLogArrowClick(direction);
    }, 120);
  };

  const stopScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleLogArrowClick = (direction) => {
    const carousel = carouselRef.current;
    if (carousel) {
      const scrollAmount = 160;
      carousel.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        carousel.scrollLeft += e.deltaY;
      }
    };
    carousel.addEventListener('wheel', onWheel, { passive: false });
    return () => carousel.removeEventListener('wheel', onWheel);
  }, []);

  // Always show all loaded emails, no animation
  useEffect(() => {
    setVisibleCount(logEmails.length);
  }, [logEmails]);

  // Check for ?authed=1 in the URL
  useEffect(() => {
    if (window.location.search.includes('authed=1')) {
      setIsAuthenticated(true);
      fetchUnreadEmails();
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleLLMRequest = async (userPrompt) => {
    const res = await fetch('http://localhost:4000/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        llm: selectedLLM // always use the current value
      })
    });
    const data = await res.json();
    // Use data.response
  };

  // --- CONDITIONAL RENDERING ---
  if (!isAuthenticated) {
    // Show login options until authenticated
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="mail-header">Email Assistant</h1>
          <button className="start-btn google-btn" onClick={handleLogin}>
            <img className="btn-logo" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Sign In with Google
          </button>

          <div className="todo-parent">
            <button
              className="start-btn ms-btn"
              tabIndex={-1}
              style={{ pointerEvents: "none" }}
            >
              <img className="btn-logo" src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" />
              Sign In with Microsoft
            </button>
            <div className="todo-overlay">TODO</div>
          </div>

          <div className="todo-parent">
            <button
              className="start-btn yahoo-btn"
              tabIndex={-1}
              style={{ pointerEvents: "none" }}
            >
              <img className="btn-logo" src="https://static-00.iconduck.com/assets.00/yahoo-icon-256x256-nvdslpv7.png" alt="Yahoo" />
              Sign In with Yahoo
            </button>
            <div className="todo-overlay">TODO</div>
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="todo-parent">
            <button
              className="start-btn imap-btn"
              tabIndex={-1}
              style={{ pointerEvents: "none" }}
            >
              <img className="btn-logo" src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Mail_%28iOS%29.svg" alt="IMAP/SMTP" />
              Sign In with IMAP/SMTP
            </button>
            <div className="todo-overlay">TODO</div>
          </div>
        </div>
      </div>
    );
  }

  // Show your previous interface after login
  return (
    <div className="App">
      <header className="mail-header">
        <h2>Email Assistant</h2>
      </header>

      {/* Back Button */}
      <div className="back-row">
        <button className="back-btn" onClick={handleLogout}>
          &larr; Back to Login
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <strong>Status:</strong>{" "}
        <span
          className="status-text"
          style={{
            color: status === "Active" ? "#1db954" : "#e53935",
            fontWeight: "bold"
          }}
        >
          {status}
        </span>
      </div>

      {/* LLM Selector */}
      <div className="llm-selector">
        <label htmlFor="llm-select" style={{ fontWeight: "bold", marginRight: 8 }}>LLM:</label>
        <button
          className={`llm-btn${selectedLLM === "chatgpt" ? " selected" : ""}`}
          onClick={() => setSelectedLLM("chatgpt")}
          type="button"
          title="ChatGPT"
          disabled={assistantActive}
        >
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f916.png" alt="ChatGPT" width={24} height={24} />
          ChatGPT
        </button>
        <button
          className={`llm-btn${selectedLLM === "other" ? " selected" : ""}`}
          onClick={() => {
            setSelectedLLM("other");
            setShowLLMModal(true);
          }}
          type="button"
          title="Other LLM"
          style={{ marginLeft: 8 }}
        >
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a1.png" alt="Other LLM" width={24} height={24} />
          Other
        </button>
        <button
          className={`llm-btn${selectedLLM === "huggingface" ? " selected" : ""}`}
          onClick={() => setSelectedLLM("huggingface")}
          type="button"
          title="Hugging Face"
          style={{ marginLeft: 8 }}
        >
          <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="Hugging Face" width={24} height={24} />
          Hugging Face
        </button>
      </div>

      {/* Start Assistant Button */}
      <div className="start-row">
        <button
          className={`start-btn${assistantActive ? " active" : ""}`}
          onClick={handleStart}
        >
          {assistantActive ? "Stop Assistant" : "Start Assistant"}
          <div className="start-btn-filter"></div>
        </button>
      </div>

      {/* Recently Unread Emails Carousel */}
      <div className="log-label">Recently Unread</div>
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
          {logEmails.slice(0, visibleCount).map((em) => (
            <div
              key={em.id}
              className={`carousel-item${processingId === em.id ? " processing" : ""}`}
              style={{
                opacity: processingId === em.id ? 0.5 : 1,
                transition: "opacity 0.6s"
              }}
            >
              <div className="carousel-from">{em.from}</div>
              <div className="carousel-date">{em.date}</div>
              <div className="carousel-subject">{em.subject}</div>
              {processingId === em.id && (
                <div className="processing-overlay">
                  <div className="processing-text">Processing...</div>
                </div>
              )}
            </div>
          ))}
        </div>
        {visibleCount < logEmails.length && logEmails.length > 0 && (
          <div className="loading-ellipsis" aria-label="Loading emails">
            Loading<span className="dot one">.</span>
            <span className="dot two">.</span>
            <span className="dot three">.</span>
          </div>
        )}
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
         Recently Unread: <strong>{visibleCount}</strong>
      </div>

      {showLLMModal && (
        <div className="llm-modal-backdrop">
          <div className="llm-modal">
            <h3>Configure Custom LLM</h3>
            <label>
              Name:
              <input
                type="text"
                value={customLLM.name}
                onChange={e => setCustomLLM({ ...customLLM, name: e.target.value })}
              />
            </label>
            <label>
              API Endpoint:
              <input
                type="text"
                value={customLLM.endpoint}
                onChange={e => setCustomLLM({ ...customLLM, endpoint: e.target.value })}
              />
            </label>
            <label>
              API Key:
              <input
                type="text"
                value={customLLM.apiKey}
                onChange={e => setCustomLLM({ ...customLLM, apiKey: e.target.value })}
              />
            </label>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setShowLLMModal(false)}
                style={{ marginRight: 8 }}
              >Save</button>
              <button onClick={() => setShowLLMModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
