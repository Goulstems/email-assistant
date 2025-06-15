import React from "react";

export default function LLMModal({ customLLM, setCustomLLM, setShowLLMModal }) {
  return (
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
  );
}