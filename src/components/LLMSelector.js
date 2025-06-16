import React from "react";
// import "./styles/LLMSelector.css";

export default function LLMSelector({ selectedLLM, setSelectedLLM, setShowLLMModal, assistantActive }) {
  return (
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
    </div>
  );
}