import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  X,
  Minus,
  Send,
  RotateCcw,
  Compass,
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Bot
} from "lucide-react";
import { sendChatMessage } from "../api/ai.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AIChat.css";

// Helper to format timestamps
function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "numeric",
    hour12: true
  }).format(date);
}

// Lightweight, safe markdown formatter for assistant text
function renderMarkdown(content = "") {
  if (!content) return null;

  // Split lines
  const lines = content.split("\n");
  const renderedElements = [];
  let inTable = false;
  let tableRows = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      // Skip markdown divider line |---|---|
      if (trimmed.includes("---")) return;
      const cols = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cols);
      return;
    } else if (inTable) {
      // Flush table
      if (tableRows.length > 0) {
        renderedElements.push(
          <div key={`table-${index}`} style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  {tableRows[0].map((th, i) => (
                    <th key={i}>{th.replace(/\*\*/g, "")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{cell.replace(/\*\*/g, "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      inTable = false;
      tableRows = [];
    }

    if (!trimmed) {
      renderedElements.push(<div key={`br-${index}`} style={{ height: "6px" }} />);
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      renderedElements.push(
        <h3 key={`h3-${index}`}>{trimmed.replace("### ", "")}</h3>
      );
      return;
    }
    if (trimmed.startsWith("#### ")) {
      renderedElements.push(
        <h4 key={`h4-${index}`}>{trimmed.replace("#### ", "")}</h4>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const cleanLine = trimmed.replace(/^[-*]\s+/, "");
      renderedElements.push(
        <li key={`li-${index}`} style={{ listStyleType: "disc" }}>
          {formatInlineStyles(cleanLine)}
        </li>
      );
      return;
    }

    // Standard paragraph
    renderedElements.push(
      <p key={`p-${index}`}>{formatInlineStyles(trimmed)}</p>
    );
  });

  // Flush remaining table if at the end of content
  if (inTable && tableRows.length > 0) {
    renderedElements.push(
      <div key="table-end" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              {tableRows[0].map((th, i) => (
                <th key={i}>{th.replace(/\*\*/g, "")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell.replace(/\*\*/g, "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return renderedElements;
}

// Replaces **bold**, *italic*, and `code` with styled React nodes
function formatInlineStyles(text = "") {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function AIChat() {
  const { user, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState("");

  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I am **Aria**, your Roamly AI Travel Specialist.\n\nWhere is your mood guiding you today? Whether you're craving peaceful mountain mist, serene backwaters, heritage palaces, or need a day-by-day itinerary with verified package rates, I'm here to help you plan.",
      packages: [],
      destinations: [],
      suggestions: [
        "Suggest peaceful mountain places",
        "I have ₹20,000 for a 4-day trip",
        "Show verified packages in Kerala",
        "Create a 3-day itinerary for Munnar",
        "Compare standard vs comfort packages"
      ],
      time: formatTime()
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || inputText).trim();
    if (!text || isLoading) return;

    setLastError(null);
    setInputText("");

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        text,
        time: formatTime()
      }
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation history payload
      const history = newMessages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text
      }));

      const response = await sendChatMessage(text, history);

      if (response && response.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: response.reply,
            packages: response.packages || [],
            destinations: response.destinations || [],
            suggestions: response.suggestions || [],
            time: formatTime()
          }
        ]);
      } else {
        throw new Error(response?.message || "Failed to get recommendations.");
      }
    } catch (err) {
      console.error("AIChat Error:", err);
      setLastError(err.response?.data?.message || err.message || "Failed to get recommendations.");
      setLastFailedMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSend(lastFailedMessage);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        text: "Fresh canvas! What kind of journey would you like to explore next?",
        packages: [],
        destinations: [],
        suggestions: [
          "Suggest peaceful mountain places",
          "I have ₹20,000 for a 4-day trip",
          "Show verified packages in Kerala"
        ],
        time: formatTime()
      }
    ]);
    setLastError(null);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          className="roamly-ai-launcher"
          onClick={() => setIsOpen(true)}
          title="Ask Aria, your Roamly AI Travel Specialist"
          aria-label="Open Roamly AI Assistant"
        >
          <div className="roamly-ai-launcher-icon">
            <Sparkles size={16} />
            <span className="roamly-ai-pulse-dot" />
          </div>
          <span>AI Assistant</span>
        </button>
      )}


      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="roamly-ai-panel" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="roamly-ai-header">
            <div className="roamly-ai-header-info">
              <div className="roamly-ai-avatar">
                <Compass size={22} />
                <span className="roamly-ai-avatar-badge" />
              </div>
              <div>
                <div className="roamly-ai-header-title">
                  Aria • Roamly AI
                  <Sparkles size={14} color="#d98255" />
                </div>
                <div className="roamly-ai-header-subtitle">
                  Travel Specialist & Mood Curator
                </div>
              </div>
            </div>

            <div className="roamly-ai-header-actions">
              <button
                type="button"
                className="roamly-ai-icon-btn"
                onClick={handleClearChat}
                title="Restart conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="roamly-ai-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                className="roamly-ai-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="roamly-ai-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`roamly-ai-message-row ${msg.role}`}>
                <div className={`roamly-ai-bubble ${msg.role}`}>
                  {renderMarkdown(msg.text)}

                  {/* Verified MySQL Packages Display */}
                  {msg.packages && msg.packages.length > 0 && (
                    <div className="roamly-ai-cards-container">
                      {msg.packages.map((pkg) => (
                        <div key={pkg.id || pkg.packageCode} className="roamly-ai-pkg-card">
                          <div className="roamly-ai-pkg-header">
                            <span className="roamly-ai-pkg-name">{pkg.name}</span>
                            <span className={`roamly-ai-tier-tag ${pkg.tier}`}>
                              {pkg.tier}
                            </span>
                          </div>

                          <div style={{ fontSize: "11px", color: "#64748b", display: "flex", gap: "10px" }}>
                            <span>⏱️ {pkg.durationDays}D / {pkg.durationNights}N</span>
                            <span>📍 {pkg.destinationName}</span>
                          </div>

                          <div className="roamly-ai-pkg-price-row">
                            <div className="roamly-ai-pkg-price">
                              ₹{Number(pkg.pricePerPerson).toLocaleString("en-IN")}{" "}
                              <span>/ person</span>
                            </div>
                            <Link
                              to={`/destination/${pkg.destinationId}`}
                              className="roamly-ai-pkg-btn"
                              onClick={() => setIsOpen(false)}
                            >
                              Explore <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Destination Thumbnails Scroll */}
                  {msg.destinations && msg.destinations.length > 0 && (
                    <div className="roamly-ai-dest-scroll">
                      {msg.destinations.map((dest) => (
                        <Link
                          key={dest.id}
                          to={`/destination/${dest.id}`}
                          className="roamly-ai-dest-card"
                          onClick={() => setIsOpen(false)}
                        >
                          {dest.image ? (
                            <img
                              src={dest.image}
                              alt={dest.name}
                              className="roamly-ai-dest-img"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="roamly-ai-dest-img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <MapPin size={20} color="#737971" />
                            </div>
                          )}
                          <div className="roamly-ai-dest-info">
                            <div className="roamly-ai-dest-name">{dest.name}</div>
                            <div className="roamly-ai-dest-meta">{dest.state}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <span className="roamly-ai-message-time">{msg.time}</span>

                {/* Suggestion Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="roamly-ai-suggestions-grid">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        className="roamly-ai-suggestion-chip"
                        onClick={() => handleSend(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="roamly-ai-message-row assistant">
                <div className="roamly-ai-typing">
                  <div className="roamly-ai-typing-dots">
                    <span className="roamly-ai-typing-dot" />
                    <span className="roamly-ai-typing-dot" />
                    <span className="roamly-ai-typing-dot" />
                  </div>
                  <span>Aria is curating recommendations...</span>
                </div>
              </div>
            )}

            {/* Error & Retry Box */}
            {lastError && (
              <div className="roamly-ai-error-box">
                <span>{lastError}</span>
                <button
                  type="button"
                  className="roamly-ai-retry-btn"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="roamly-ai-footer">
            <div className="roamly-ai-input-wrap">
              <input
                ref={inputRef}
                type="text"
                className="roamly-ai-input"
                placeholder="Ask about destinations, budget, mood, or packages..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                type="button"
                className="roamly-ai-send-btn"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                aria-label="Send query"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="roamly-ai-footer-note">
              Verified travel packages from Roamly database • Prices in INR
            </div>
          </div>
        </div>
      )}
    </>
  );
}
