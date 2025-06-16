import { useEffect, useState, useRef } from "react";
import './App.css';
import LLMSelector from "./components/LLMSelector";
import StatusBar from "./components/StatusBar";
import EmailCarousel from "./components/EmailCarousel";
import LLMModal from "./components/LLMModal";
import LoginScreen from "./components/LoginScreen";

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
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: "",
    model: "openchat/openchat-3.5-0106"
  });
  const [processingId, setProcessingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const assistantActiveRef = useRef(assistantActive);

  // Keep ref in sync with state
  useEffect(() => {
    assistantActiveRef.current = assistantActive;
  }, [assistantActive]);

  // Fetch unread emails from backend
  const fetchUnreadEmails = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:4000/api/gmail/unread');
      if (!res.ok) throw new Error('Not authenticated or error fetching emails');
      const emails = await res.json();
      setLogEmails(emails);
    } catch (err) {
      setLogEmails([]);
    }
    setIsRefreshing(false);
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
    if (assistantActive) {
      setAssistantActive(false);
      setStatus("Inactive");
      return;
    }

    setAssistantActive(true);
    setStatus("Active");

    // Let React update the UI before starting the loop!
    await new Promise(resolve => setTimeout(resolve, 0));

    let emailsToProcess = [...logEmails];
    for (let i = 0; i < emailsToProcess.length; i++) {
      if (!assistantActiveRef.current) break;

      const email = emailsToProcess[i];
      setProcessingId(email.id);

      // --- LLM Selection Logic ---
      let endpoint = "/api/llm/reply";
      let fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      };

      if (selectedLLM === "huggingface") {
        endpoint = "/api/llm/reply-hf";
      } else if (selectedLLM === "other") {
        endpoint = "/api/llm/custom";
        fetchOptions.body = JSON.stringify({
          ...customLLM,
          prompt: `Reply to this email:\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.body || ''}`
        });
      }

      try {
        const res = await fetch(`http://localhost:4000${endpoint}`, fetchOptions);
        const data = await res.json();

        if (!res.ok || !data.body && !data.response || data.error) {
          setStatus("LLM failed to generate a response. Please try again or check your LLM settings.");
          setProcessingId(null);
          return;
        }

        // Support both .body (OpenAI/HF) and .response (custom)
        const replyBody = data.body || data.response;
        const replySubject = data.subject || `Re: ${email.subject}`;

        await fetch('http://localhost:4000/api/gmail/draft-and-mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: email.id,
            reply: replyBody,
            subject: replySubject
          })
        });

        await new Promise(resolve => setTimeout(resolve, 800)); // for animation

        setLogEmails(prev => prev.filter(e => e.id !== email.id));
        setVisibleCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Processing failed:", err);
      }
      setProcessingId(null);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadEmails();
    }
  }, [isAuthenticated]);

  // --- CONDITIONAL RENDERING ---
  if (!isAuthenticated) {
    return <LoginScreen handleLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="mail-header">
        <h2>Email Assistant</h2>
      </header>

      <div className="back-row">
        <button className="back-btn" onClick={handleLogout}>
          &larr; Back to Login
        </button>
      </div>

      <StatusBar status={status} />

      <LLMSelector
        selectedLLM={selectedLLM}
        setSelectedLLM={setSelectedLLM}
        setShowLLMModal={setShowLLMModal}
        assistantActive={assistantActive}
      />

      <div className="start-row">
        <button
          className={`start-btn${assistantActive ? " active" : ""}`}
          onClick={handleStart}
        >
          {assistantActive ? "Stop Assistant" : "Start Assistant"}
          <div className="start-btn-filter"></div>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
  <div className="log-label" style={{ lineHeight: "20px" }}>Recently Unread</div>
  <button
    className={`refresh-btn${isRefreshing ? " spinning" : ""}`}
    onClick={fetchUnreadEmails}
    title="Refresh"
    disabled={isRefreshing}
    style={{
      background: "none",
      border: "none",
      cursor: isRefreshing ? "wait" : "pointer",
      padding: 0,
      display: "flex",
      alignItems: "center",
      height: "35px", // smaller height
      marginTop: "1px" // lower the button
    }}
  >
    <svg
      className="refresh-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      style={{ display: "block" }}
    >
      <g>
        <path
          d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.13-.31 2.18-.85 3.07l1.46 1.46A7.938 7.938 0 0020 12c0-4.42-3.58-8-8-8zm-6.85 2.93L3.69 7.39A7.938 7.938 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.13.31-2.18.85-3.07z"
          fill="#1976d2"
        />
      </g>
    </svg>
  </button>
</div>
      <EmailCarousel
        logEmails={logEmails}
        visibleCount={visibleCount}
        processingId={processingId}
        carouselRef={carouselRef}
        handleLogArrowClick={handleLogArrowClick}
        startScroll={startScroll}
        stopScroll={stopScroll}
        selectedLogIdx={selectedLogIdx}
      />

      <div className="draft-count-label">
         Recently Unread: <strong>{visibleCount}</strong>
      </div>

      {showLLMModal && (
        <LLMModal
          onClose={() => setShowLLMModal(false)}
          onSave={llmConfig => {
            setCustomLLM(llmConfig);
            setShowLLMModal(false);
            setSelectedLLM("other");
          }}
        />
      )}
    </div>
  );
}

export default App;
