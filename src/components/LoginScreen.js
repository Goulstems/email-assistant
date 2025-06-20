import React from "react";

export default function LoginScreen({loginSelectionList}) {
  console.log(loginSelectionList);
  let handleGMailLogin = loginSelectionList.handleGMailLogin;
  let handleImapLogin = loginSelectionList.handleImapLogin;
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="mail-header">Email Assistant</h1>
        <button className="start-btn google-btn" onClick={handleGMailLogin}>
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
            onClick={handleImapLogin}
            // tabIndex={-1}
            // style={{ pointerEvents: "none" }}
          >
            <img className="btn-logo" src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Mail_%28iOS%29.svg" alt="IMAP/SMTP" />
            Sign In with IMAP/SMTP
          </button>
          {/* <div className="todo-overlay">TODO</div> */}
        </div>
      </div>
    </div>
  );
}