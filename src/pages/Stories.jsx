import { ArrowUpRight, BookOpen, Compass, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const stories = [
  {
    number: "01",
    tag: "SLOW TRAVEL",
    mood: "Peace",
    title: "The art of doing absolutely nothing on holiday",
    text: "A reminder that a meaningful trip doesn't require an exhaustive hour-by-hour itinerary. Sometimes the most restorative moments happen over an unhurried tea overlooking misty hills.",
    image:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1000&q=85",
    read: "4 MIN READ",
    place: "Munnar, Kerala",
  },
  {
    number: "02",
    tag: "HIDDEN GEMS",
    mood: "Adventure",
    title: "How to find the quiet side of a popular place",
    text: "Trade crowded lookouts for the lesser-known cliff trails and dawn village walks. A few gentle ways to discover corners that feel deeply personal and untouched.",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85",
    read: "5 MIN READ",
    place: "Spiti Valley, Himachal",
  },
  {
    number: "03",
    tag: "TRAVEL BETTER",
    mood: "Romance",
    title: "Leave a little empty space in your itinerary",
    text: "The most vivid memory of your journey will likely be the serendipitous detour you never planned: a hidden café, an unexpected sunset, or a conversation with a local artisan.",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85",
    read: "3 MIN READ",
    place: "Udaipur, Rajasthan",
  },
  {
    number: "04",
    tag: "NATURE RETREAT",
    mood: "Nature",
    title: "Why walking through a forest heals creative burnout",
    text: "Shinrin-yoku, or forest bathing, is more than a wellness trend. Discover how deep green canopies, pine scents, and winding Western Ghat paths recalibrate your senses.",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=85",
    read: "6 MIN READ",
    place: "Coorg, Karnataka",
  },
];

export default function Stories() {
  return (
    <main className="page-main stories-page">
      <section className="page-hero stories-hero">
        <div className="container page-hero-inner">
          <div className="eyebrow">
            <span className="eyebrow-line" /> FIELD NOTES FOR CURIOUS MINDS
          </div>
          <h1>
            Little stories.
            <br />
            <em>Big Memories.</em>
          </h1>
          <p>
            Observations, reflections, and quiet reminders for a more mindful,
            scenic way of traversing the world.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stories-intro">
            <div>
              <BookOpen size={18} />
              <span>THE ROAMLY FIELD ARCHIVE</span>
            </div>
            <p>
              Not a checklist of sights to tick off. Rather, an invitation to see familiar landscapes with fresh eyes.
            </p>
          </div>

          <div className="story-grid">
            {stories.map((s) => (
              <article className="story-card" key={s.number}>
                <Link to={`/discover?mood=${s.mood}`} className="story-image">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/hero-poster.jpg";
                    }}
                  />
                  <span className="story-number">{s.number}</span>
                </Link>

                <div className="story-card-copy">
                  <div className="story-meta">
                    <span className="story-tag">{s.tag}</span>
                    <span className="story-read">
                      <Clock size={12} /> {s.read}
                    </span>
                  </div>

                  <Link to={`/discover?mood=${s.mood}`} className="story-title">
                    <h2>{s.title}</h2>
                    <ArrowUpRight size={18} />
                  </Link>

                  <p>{s.text}</p>

                  <div className="story-footer-link">
                    <Link to={`/discover?mood=${s.mood}`} className="story-read-link">
                      Explore {s.place} escapes <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="stories-cta">
            <Compass size={28} />
            <div>
              <h3>Ready to write your own travel chapter?</h3>
              <p>Start with how you want to feel and let Roamly guide your next journey.</p>
            </div>
            <Link to="/discover" className="button button-dark">
              Explore places ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
