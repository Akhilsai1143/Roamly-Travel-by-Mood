import { Link } from "react-router-dom";
import { Compass, Home, MapPin, Sparkles, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon-wrap" aria-hidden="true">
          <Compass size={54} className="not-found-compass" />
        </div>

        <span className="eyebrow">
          <span className="eyebrow-line" /> OFF THE BEATEN TRACK
        </span>

        <h1>You’ve wandered off the map.</h1>

        <p className="not-found-desc">
          Even the most seasoned travellers take an unexpected detour now and then.
          The page you’re looking for doesn’t exist or has moved to new terrain.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="button button-dark">
            <Home size={16} /> Return to Home
          </Link>
          <Link to="/discover" className="button button-outline">
            <MapPin size={16} /> Explore Destinations
          </Link>
          <Link to="/surprise" className="button button-subtle">
            <Sparkles size={16} /> Surprise Me
          </Link>
        </div>

        <div className="not-found-footer-tips">
          <span>Popular starting points:</span>
          <div className="not-found-pills">
            <Link to="/discover?mood=peace" className="not-found-pill">
              🕊️ Peaceful Escapes
            </Link>
            <Link to="/discover?mood=adventure" className="not-found-pill">
              🏔️ Mountain Trails
            </Link>
            <Link to="/discover?mood=nature" className="not-found-pill">
              🌿 Nature Retreats
            </Link>
            <Link to="/stories" className="not-found-pill">
              📖 Field Stories
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}