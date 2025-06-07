import { useEffect, useState, useRef } from "react";
import './App.css';

const CLIENT_ID = "686439120217-83sbckt02u93occvv4fc7o6co323f3bv.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

const STATUSES = [
  "Inactive",
  "Active"
];

function App() {
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // UI state for your previous interface
  const [status, setStatus] = useState(STATUSES[0]);
  const [assistantActive, setAssistantActive] = useState(false);
  const [config, setConfig] = useState({ email: '', password: '', server: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [logEmails, setLogEmails] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const carouselRef = useRef(null);
  const [selectedLogIdx, setSelectedLogIdx] = useState(0);

  // Carousel scroll logic
  const scrollInterval = useRef(null);

  const handleConfigChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setStatus(STATUSES[1]);
  };

  const handleStart = () => {
    if (!assistantActive) {
      setStatus(STATUSES[1]);
      setAssistantActive(true);
    } else {
      setStatus(STATUSES[0]);
      setAssistantActive(false);
    }
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

  // Google Identity Services logic
  useEffect(() => {
    const initializeGsi = () => {
      if (window.google && !tokenClient) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              loadGapiClient(response.access_token);
            }
          },
        });
        setTokenClient(client);
      }
    };

    if (window.google) {
      initializeGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initializeGsi();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [tokenClient]);

  const loadGapiClient = (accessToken) => {
    window.gapi.load("client", () => {
      window.gapi.client.setToken({ access_token: accessToken });
      window.gapi.client.load("gmail", "v1", () => {
        fetchUnreadEmails();
      });
    });
  };

  // Fetch unread emails from Gmail and update logEmails
  const fetchUnreadEmails = async () => {
    try {
      const res = await window.gapi.client.gmail.users.messages.list({
        userId: "me",
        q: "in:inbox is:unread",
        maxResults: 10,
      });
      const messages = res.result.messages || [];
      if (messages.length === 0) {
        setLogEmails([]);
        return;
      }
      // Fetch details for each message
      const emailPromises = messages.map(async (msg) => {
        const msgData = await window.gapi.client.gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });
        const headers = msgData.result.payload.headers;
        const subject = headers.find(h => h.name === "Subject")?.value || "(No Subject)";
        // Extract only the sender's name (not email)
        const fromHeader = headers.find(h => h.name === "From")?.value || "(Unknown Sender)";
        let from = fromHeader;
        const match = fromHeader.match(/^(.*?)\s*<.*?>$/);
        if (match && match[1]) {
          from = match[1].replace(/"/g, '').trim();
        }
        const dateRaw = headers.find(h => h.name === "Date")?.value || "";
        let date = "";
        if (dateRaw) {
          const localDate = new Date(dateRaw);
          date = localDate.toLocaleString(undefined, {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
        return {
          id: msg.id,
          from,
          subject,
          date,
        };
      });
      const emails = await Promise.all(emailPromises);
      setLogEmails(emails);
    } catch (err) {
      setLogEmails([]);
    }
  };

  const handleLogin = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      alert("Google API not loaded yet, please wait.");
    }
  };

  // Add this function to handle logout/back to login
  const handleLogout = () => {
    setAccessToken(null);
    setAssistantActive(false);
    setStatus(STATUSES[0]);
    // Optionally clear emails or other state here
  };

  useEffect(() => {
    if (logEmails.length === 0) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= logEmails.length) clearInterval(interval);
    }, 1000); // 120ms per email
    return () => clearInterval(interval);
  }, [logEmails]);

  // --- CONDITIONAL RENDERING ---
  if (!accessToken) {
    // Show only login until authenticated
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="mail-header">Email Assistant</h1>
          <button className="start-btn" onClick={handleLogin}>
            Sign In with Google
          </button>
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

      {/* Start Assistant Button */}
      <div className="start-row">
        <button
          className={`start-btn${assistantActive ? " active" : ""}`}
          onClick={handleStart}
        >
          {assistantActive ? "Stop Assistant" : "Start Assistant"}
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
          {logEmails.slice(0, visibleCount).map((em, idx) => (
  <div
    key={em.id}
    className="carousel-item"
    style={{ "--i": idx }}
  >
    <div className="carousel-from">{em.from}</div>
    <div className="carousel-date">{em.date}</div>
    <div className="carousel-subject">{em.subject}</div>
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
         Recently Unread: <strong>{logEmails.length}</strong>
      </div>
    </div>
  );
}

export default App;
