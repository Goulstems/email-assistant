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
    name: "",
    endpoint: "",
    apiKey: ""
  });
  const [processingId, setProcessingId] = useState(null);
  const assistantActiveRef = useRef(assistantActive);

  // Keep ref in sync with state
  useEffect(() => {
    assistantActiveRef.current = assistantActive;
  }, [assistantActive]);

  // Fetch unread emails from backend
  const fetchUnreadEmails = async () => {
    console.log("Fetching unread emails...");
    try {
      const res = await fetch('http://localhost:4000/api/gmail/unread');
      if (!res.ok) throw new Error('Not authenticated or error fetching emails');
      const emails = await res.json();
      console.log("Fetched emails:", emails);
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
    console.log("visibleCount set to:", logEmails.length);
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

  useEffect(() => {
    console.log("logEmails updated:", logEmails);
  }, [logEmails]);

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

      <div className="log-label">Recently Unread</div>
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
          customLLM={customLLM}
          setCustomLLM={setCustomLLM}
          setShowLLMModal={setShowLLMModal}
        />
      )}
    </div>
  );
}

export default App;
