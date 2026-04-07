import { useState } from "react";
import { useStreamEncoder } from "./hooks/useStreamEncoder";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const { output, streaming, status, startEncoding, cancelEncoding } = useStreamEncoder();

  const handleConvert = () => {
    if (!input.trim()) return;
    startEncoding(input);
  };

  const handleCancel = () => {
    cancelEncoding();
  };

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <span className="logo-text">[b64]</span>
          <span className={`status-dot ${streaming ? "active" : ""}`}></span>
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