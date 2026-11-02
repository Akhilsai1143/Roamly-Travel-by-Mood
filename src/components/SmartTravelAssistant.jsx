import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Search,
  MapPin,
  Calendar,
  X,
  Compass,
  ArrowRight,
  Send,
  Clock,
  IndianRupee,
  Bot,
  Lightbulb,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { destinations } from "../data/destinations.js";

const QUICK_PROMPTS = [
  "Suggest a peaceful destination for a three-day trip",
  "Find mountain destinations for a family",
  "Show heritage places in Rajasthan",
  "Help me plan a five-day Kerala trip",
  "Beach destinations under ₹10,000"
];

// Rule-based Natural Language Discovery Matcher
function analyzeTravelQuery(query) {
  const q = query.toLowerCase();

  // Region / State detection
  let stateFilter = null;
  if (q.includes("rajasthan") || q.includes("jaipur") || q.includes("udaipur") || q.includes("jodhpur")) stateFilter = "rajasthan";
  else if (q.includes("kerala") || q.includes("munnar") || q.includes("alleppey") || q.includes("varkala")) stateFilter = "kerala";
  else if (q.includes("himachal") || q.includes("manali") || q.includes("spiti") || q.includes("shimla")) stateFilter = "himachal";
  else if (q.includes("ladakh") || q.includes("leh")) stateFilter = "ladakh";
  else if (q.includes("kashmir") || q.includes("gulmarg") || q.includes("srinagar")) stateFilter = "kashmir";
  else if (q.includes("goa")) stateFilter = "goa";
  else if (q.includes("karnataka") || q.includes("hampi") || q.includes("coorg") || q.includes("gokarna")) stateFilter = "karnataka";
  else if (q.includes("meghalaya") || q.includes("shillong")) stateFilter = "meghalaya";
  else if (q.includes("uttarakhand") || q.includes("rishikesh") || q.includes("mussoorie")) stateFilter = "uttarakhand";

  // Mood detection
  const moodFilters = [];
  if (q.includes("peace") || q.includes("calm") || q.includes("quiet") || q.includes("relax") || q.includes("wellness")) moodFilters.push("Peace");
  if (q.includes("adventure") || q.includes("trek") || q.includes("thrill") || q.includes("rafting")) moodFilters.push("Adventure");
  if (q.includes("nature") || q.includes("green") || q.includes("forest") || q.includes("wildlife")) moodFilters.push("Nature");
  if (q.includes("heritage") || q.includes("history") || q.includes("fort") || q.includes("palace") || q.includes("culture")) moodFilters.push("Culture");
  if (q.includes("romance") || q.includes("couple") || q.includes("honeymoon")) moodFilters.push("Romance");

  // Category detection
  let categoryFilter = null;
  if (q.includes("mountain") || q.includes("hill") || q.includes("himalaya") || q.includes("snow") || q.includes("valley")) categoryFilter = "Mountains";
  else if (q.includes("beach") || q.includes("sea") || q.includes("coast") || q.includes("ocean")) categoryFilter = "Beach";
  else if (q.includes("city") || q.includes("urban") || q.includes("shopping")) categoryFilter = "City";

  // Duration intent
  let daysIntent = null;
  if (q.includes("three-day") || q.includes("3-day") || q.includes("3 day") || q.includes("weekend")) daysIntent = 3;
  else if (q.includes("five-day") || q.includes("5-day") || q.includes("5 day")) daysIntent = 5;
  else if (q.includes("week") || q.includes("7 day")) daysIntent = 7;

  // Family intent
  const isFamily = q.includes("family") || q.includes("kids") || q.includes("parents");

  // Score all destinations
  const scored = destinations.map((dest) => {
    let score = 0;
    const reasons = [];

    // State / region match
    if (stateFilter) {
      if (
        dest.state?.toLowerCase().includes(stateFilter) ||
        dest.name?.toLowerCase().includes(stateFilter)
      ) {
        score += 35;
        reasons.push(`Located in ${dest.state}`);
      }
    }

    // Category match
    if (categoryFilter && dest.category?.toLowerCase() === categoryFilter.toLowerCase()) {
      score += 25;
      reasons.push(`${dest.category} environment`);
    }

    // Mood match
    if (moodFilters.length > 0 && Array.isArray(dest.mood)) {
      const matchedMoods = dest.mood.filter((m) =>
        moodFilters.some((f) => m.toLowerCase().includes(f.toLowerCase()))
      );
      if (matchedMoods.length > 0) {
        score += matchedMoods.length * 20;
        reasons.push(`Matches mood: ${matchedMoods.join(", ")}`);
      }
    }

    // General keyword in description or hiddenGem
    if (q.length > 3) {
      const words = q.split(" ").filter((w) => w.length > 3);
      words.forEach((w) => {
        if (dest.description?.toLowerCase().includes(w)) score += 5;
        if (dest.hiddenGem?.toLowerCase().includes(w)) score += 5;
      });
    }

    // Days compatibility
    if (daysIntent) {
      if (dest.days && dest.days.includes(String(daysIntent))) {
        score += 15;
        reasons.push(`Ideal for a ${daysIntent}-day itinerary`);
      }
    }

    // Family friendliness (calmer paces, peaceful, cultural)
    if (isFamily) {
      if (dest.mood?.includes("Peace") || dest.mood?.includes("Culture")) {
        score += 10;
        reasons.push("Suitable for relaxed family travel");
      }
    }

    return {
      destination: dest,
      score,
      reasons: reasons.slice(0, 3)
    };
  });

  // Filter and sort
  const results = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Construct response summary
  let explanation = "";
  if (results.length > 0) {
    explanation = `Found ${results.length} verified destinations that match your search`;
    if (stateFilter) explanation += ` in ${stateFilter.toUpperCase()}`;
    if (categoryFilter) explanation += ` (${categoryFilter})`;
    if (moodFilters.length > 0) explanation += ` with a focus on ${moodFilters.join(", ")}`;
    explanation += ". Here are curated suggestions based on our actual travel database:";
  } else {
    explanation = "I couldn't find an exact match for those specific keywords. Try asking about popular regions like Rajasthan, Kerala, Himachal, or moods like peace, adventure, or beaches.";
  }

  return { results, explanation };
}

export default function SmartTravelAssistant({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [activePrompt, setActivePrompt] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    {
      id: "welcome",
      type: "assistant",
      text: "Namaste! I am your Roamly Travel Assistant. Ask me anything about Indian destinations, seasonal recommendations, duration, or moods.",
      results: []
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isOpen]);

  const handleSendQuery = (userText) => {
    const textToSubmit = userText || query;
    if (!textToSubmit.trim()) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: textToSubmit
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setQuery("");
    setIsAnalyzing(true);

    // Analyze using the destination engine (with slight delay for realistic feel)
    setTimeout(() => {
      const { results, explanation } = analyzeTravelQuery(textToSubmit);
      const assistantMessage = {
        id: `assist-${Date.now()}`,
        type: "assistant",
        text: explanation,
        results
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
      setIsAnalyzing(false);
    }, 450);
  };

  const handleQuickPrompt = (promptText) => {
    setActivePrompt(promptText);
    handleSendQuery(promptText);
  };

  if (!isOpen) return null;

  return (
    <div className="smart-assistant-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="smart-assistant-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Roamly Smart Travel Assistant"
      >
        {/* Drawer Header */}
        <div className="assistant-header">
          <div className="assistant-header-title">
            <div className="assistant-avatar-badge">
              <Sparkles size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="assistant-title-text">Smart Travel Assistant</h3>
              <p className="assistant-subtitle-text">Curated travel discovery powered by authentic Indian destination data</p>
            </div>
          </div>
          <button
            type="button"
            className="assistant-close-btn"
            onClick={onClose}
            aria-label="Close Travel Assistant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="assistant-quick-prompts-bar">
          <span className="quick-prompts-label">Try asking:</span>
          <div className="quick-prompts-scroll">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-prompt-pill"
                onClick={() => handleQuickPrompt(prompt)}
              >
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message History */}
        <div className="assistant-messages-container">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`assistant-bubble-row ${msg.type}`}>
              {msg.type === "assistant" && (
                <div className="bubble-avatar">
                  <Bot size={15} />
                </div>
              )}

              <div className={`assistant-bubble-content ${msg.type}`}>
                <p className="bubble-text">{msg.text}</p>

                {/* Destination Cards matched */}
                {msg.results && msg.results.length > 0 && (
                  <div className="assistant-results-grid">
                    {msg.results.map(({ destination: dest, reasons }) => (
                      <div key={dest.id} className="assistant-card">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="assistant-card-img"
                          loading="lazy"
                        />
                        <div className="assistant-card-body">
                          <div className="card-top-tags">
                            <span className="card-category-tag">{dest.category}</span>
                            <span className="card-days-tag">{dest.days}</span>
                          </div>
                          <h4 className="assistant-card-title">{dest.name}</h4>
                          <p className="assistant-card-state">{dest.state}</p>

                          {reasons && reasons.length > 0 && (
                            <div className="assistant-card-reasons">
                              {reasons.map((r, i) => (
                                <div key={i} className="reason-item">
                                  <CheckCircle2 size={11} className="text-emerald-500" />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="assistant-card-footer">
                            <div className="card-price-info">
                              <span className="price-label">Est. Budget</span>
                              <span className="price-val">{dest.budget}</span>
                            </div>
                            <Link
                              to={`/destination/${dest.id}`}
                              className="assistant-card-link"
                              onClick={onClose}
                            >
                              <span>Explore</span>
                              <ArrowRight size={13} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing / Analyzing Indicator */}
          {isAnalyzing && (
            <div className="assistant-bubble-row assistant">
              <div className="bubble-avatar">
                <Bot size={15} />
              </div>
              <div className="assistant-bubble-content assistant typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Composer */}
        <form
          className="assistant-input-composer"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
        >
          <input
            type="text"
            className="assistant-input-field"
            placeholder="E.g. Suggest mountain spots for 4 days or quiet beaches..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            className="assistant-send-btn"
            disabled={!query.trim() || isAnalyzing}
            aria-label="Send query"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
