import React from "react";

export default function StatusBar({ status }) {
  return (
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
  );
}