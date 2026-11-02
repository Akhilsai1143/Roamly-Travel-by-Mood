import { moods } from "../data/destinations";

export default function MoodPicker({ selected, onSelect }) {
  return (
    <div className="mood-grid">
      {moods.map((mood) => (
        <button
          key={mood.name}
          className={`mood-card mood-${mood.color} ${selected === mood.name ? "mood-selected" : ""}`}
          onClick={() => onSelect(selected === mood.name ? "" : mood.name)}
        >
          <span className="mood-symbol">{mood.emoji}</span>
          <span className="mood-name">{mood.name}</span>
          <span className="mood-line">{mood.line}</span>
          <span className="mood-arrow">↗</span>
        </button>
      ))}
    </div>
  );
}
