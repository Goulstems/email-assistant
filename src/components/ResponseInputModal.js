// src/components/ResponseInputModal.js
import React, { useState } from "react";
import './styles/LLMModal.css';

export default function ResponseInputModal({ onClose, responseInput, setResponseInput }) {
  const [localInput, setLocalInput] = useState(responseInput?.customText || "");

  const handleSave = () => {
    setResponseInput({ ...responseInput, customText: localInput });
    onClose();
  };

  return (
    <div className="llm-modal-backdrop">
      <div className="llm-modal">
        <button
          className="llm-modal-close"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="llm-modal-title">Response Input:</div>
        <div className="llm-modal-form">
          <textarea
            value={localInput}
            onChange={e => setLocalInput(e.target.value)}
            placeholder="Enter any information you want included in the response (e.g., your name, preferences, etc.)"
            rows={7}
            style={{
              width: "100%",
              resize: "vertical",
              fontSize: "1.1em",
              padding: "12px",
              borderRadius: "8px",
              border: "1.5px solid #ccc",
              marginBottom: "18px"
            }}
          />
          <button type="button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}