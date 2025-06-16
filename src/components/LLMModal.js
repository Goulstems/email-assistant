import React, { useState } from "react";
import "./styles/LLMModal.css";

export default function LLMModal({ onClose }) {
  // Set default values here:
  const [name, setName] = useState("OpenRouter");
  const [endpoint, setEndpoint] = useState(
    "https://openrouter.ai/api/v1/chat/completions"
  );
  const [apiKey, setApiKey] = useState(""); // Leave blank for user to fill
  const [model, setModel] = useState("openchat/openchat-3.5-0106");
  const [prompt, setPrompt] = useState("Say hello to the world!");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="llm-modal-backdrop">
      <div className="llm-modal">
        <h3>Configure Custom LLM</h3>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          API Endpoint:
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </label>
        <label>
          API Key:
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => onClose()}
            style={{ marginRight: 8 }}
          >
            Save
          </button>
          <button onClick={() => onClose()}>Cancel</button>
        </div>
      </div>
    </div>
  );
}