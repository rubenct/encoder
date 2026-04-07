import { useState, useEffect } from "react";
import { useStreamEncoder } from "./hooks/useStreamEncoder";
import "./App.css";

const CREDENTIALS = {
  username: "admin",
  password: "encoder2026"
};

const GITHUB_ICON = (
  <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);

const HOME_ICON = (
  <svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [input, setInput] = useState("");
  
  const { output, streaming, status, startEncoding, cancelEncoding } = useStreamEncoder();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      setIsLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleConvert = () => {
    if (!input.trim()) return;
    startEncoding(input);
  };

  const handleCancel = () => {
    cancelEncoding();
  };

  const renderHeaderButtons = () => (
    <div className="header-buttons">
      <a 
        href="https://www.rcarino.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="header-btn"
        title="Home"
      >
        {HOME_ICON}
      </a>
      <a 
        href="https://github.com/rubenct/encoder" 
        target="_blank" 
        rel="noopener noreferrer"
        className="header-btn"
        title="GitHub"
      >
        {GITHUB_ICON}
      </a>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="container">
        <header className="header">
          <div className="logo">
            <span className="logo-text">[b64]</span>
            <span className="status-dot"></span>
          </div>
          {renderHeaderButtons()}
        </header>

        <main className="main">
          <div className="login-container">
            <h2 className="login-title">Access Required</h2>
            
            <div className="credentials-display">
              <div className="credential-item">
                <span className="credential-label">Username:</span>
                <span className="credential-value">{CREDENTIALS.username}</span>
              </div>
              <div className="credential-item">
                <span className="credential-label">Password:</span>
                <span className="credential-value">{CREDENTIALS.password}</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="label">
                  <span className="prompt">&gt;</span> Username
                </label>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="label">
                  <span className="prompt">&gt;</span> Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <div className="error-message">Invalid credentials</div>
              )}

              <button type="submit" className="btn btn-convert">
                Login
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-row">
          <div className="logo">
            <span className="logo-text">[b64]</span>
            <span className={`status-dot ${streaming ? "active" : ""}`}></span>
          </div>
          <div className="header-right">
            {renderHeaderButtons()}
            <button 
              className="btn-logout"
              onClick={() => setIsLoggedIn(false)}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="input-section">
          <label className="label">
            <span className="prompt">&gt;</span> Input Text
          </label>
          <textarea
            className="textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to encode..."
            disabled={streaming}
          />
        </div>

        <div className="button-group">
          <button
            className="btn btn-convert"
            onClick={handleConvert}
            disabled={streaming || !input.trim()}
          >
            Convert
          </button>
          <button
            className="btn btn-cancel"
            onClick={handleCancel}
            disabled={!streaming}
          >
            Cancel
          </button>
        </div>

        <div className="output-section">
          <label className="label">
            <span className="prompt">&gt;</span> Output
            {status === "streaming" && <span className="cursor">_</span>}
          </label>
          <div className="output-display">
            <pre className="output-text">{output}</pre>
            {status === "streaming" && <span className="blinking-cursor">█</span>}
          </div>
          {status === "cancelled" && <span className="status-indicator cancelled">[cancelled]</span>}
        </div>

        {status === "streaming" && (
          <div className="progress-bar">
            <div className="progress indeterminate"></div>
          </div>
        )}

        <div className="log-line">
          <span className="timestamp">{new Date().toLocaleTimeString()}</span>
          <span className="status-message">
            {status === "idle" && "Ready"}
            {status === "streaming" && "Encoding..."}
            {status === "done" && "Completed"}
            {status === "cancelled" && "Cancelled"}
            {status === "error" && "Error"}
          </span>
        </div>
      </main>
    </div>
  );
}

export default App;