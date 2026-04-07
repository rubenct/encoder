import { useState, useEffect } from "react";
import { useStreamEncoder } from "./hooks/useStreamEncoder";
import "./App.css";

const CREDENTIALS = {
  username: "admin",
  password: "encoder2026"
};

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

  if (!isLoggedIn) {
    return (
      <div className="container">
        <header className="header">
          <div className="logo">
            <span className="logo-text">[b64]</span>
            <span className="status-dot"></span>
          </div>
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
          <button 
            className="btn-logout"
            onClick={() => setIsLoggedIn(false)}
          >
            Logout
          </button>
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