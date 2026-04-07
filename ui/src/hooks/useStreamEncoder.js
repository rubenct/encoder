import { useState, useRef, useCallback } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function useStreamEncoder() {
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState("idle");
  const controllerRef = useRef(null);

  const startEncoding = useCallback(async (text) => {
    if (streaming) return;

    setOutput("");
    setStreaming(true);
    setStatus("streaming");

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/api/encode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const char = line.replace("data: ", "").trim();
          if (char === "[DONE]") break;
          setOutput((prev) => prev + char);
        }
      }

      setStatus("done");
    } catch (err) {
      if (err.name === "AbortError") {
        setStatus("cancelled");
      } else {
        setStatus("error");
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }, [streaming]);

  const cancelEncoding = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  }, []);

  return { output, streaming, status, startEncoding, cancelEncoding };
}