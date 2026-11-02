import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquareText,
  Star,
  Sparkles,
  MapPin,
  ThumbsUp,
  CheckCircle2,
  Filter,
  User,
  Plus,
  Compass,
  Send,
  LogIn,
  Clock,
  IndianRupee,
  CalendarDays,
  Lightbulb,
  Camera,
  X,
  Maximize2
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { destinations } from "../data/destinations.js";
import { initialReviews } from "../data/reviews.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Reviews() {
  const [params] = useSearchParams();
  const preselectedDest = params.get("destination") || params.get("id") || "";

  const { token, user, isLoggedIn } = useAuth();

  // Selected destination for reviewing
  const [destinationId, setDestinationId] = useState(() => {
    if (preselectedDest) {
      const match = destinations.find(
        (d) =>
          String(d.id).toLowerCase() === String(preselectedDest).toLowerCase() ||
          String(d.name).toLowerCase() === String(preselectedDest).toLowerCase()
      );
      return match ? match.id : destinations[0]?.id || "";
    }
    return destinations[0]?.id || "";
  });

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [mood, setMood] = useState("Peace");
  const [duration, setDuration] = useState("3 Days / 2 Nights");
  const [budget, setBudget] = useState("₹8,500");
  const [season, setSeason] = useState("October (Post-Monsoon)");
  const [insiderTip, setInsiderTip] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lightbox state for expanding traveler photos
  const [activePhoto, setActivePhoto] = useState(null);

  // Community reviews state (initialized from persistent storage or curated catalog)
  const [reviewsList, setReviewsList] = useState(() => {
    try {
      const saved = localStorage.getItem("roamly-community-reviews");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge rich media, duration, budget, season, and insider tips from initial catalog
          const upgraded = parsed.map((rev) => {
            const rich = initialReviews.find((r) => r.id === rev.id);
            return rich
              ? {
                  ...rich,
                  ...rev,
                  images: (rev.images && rev.images.length > 0) ? rev.images : rich.images,
                  duration: rev.duration || rich.duration,
                  budget: rev.budget || rich.budget,
                  season: rev.season || rich.season,
                  insiderTip: rev.insiderTip || rich.insiderTip
                }
              : rev;
          });
          // Include any newly added curated reviews from initialReviews
          const existingIds = new Set(upgraded.map((r) => r.id));
          const missing = initialReviews.filter((r) => !existingIds.has(r.id));
          return [...upgraded, ...missing];
        }
      }
    } catch {}
    return initialReviews;
  });

  // Upvotes state
  const [upvotedIds, setUpvotedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("roamly-upvoted-reviews");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Filter states for reviews feed
  const [filterDest, setFilterDest] = useState(preselectedDest ? preselectedDest.toLowerCase() : "all");
  const [filterRating, setFilterRating] = useState("all");

  // Sync if URL query param changes
  useEffect(() => {
    if (preselectedDest) {
      const match = destinations.find(
        (d) =>
          String(d.id).toLowerCase() === String(preselectedDest).toLowerCase() ||
          String(d.name).toLowerCase() === String(preselectedDest).toLowerCase()
      );
      if (match) {
        setDestinationId(match.id);
        setFilterDest(match.id);
      }
    }
  }, [preselectedDest]);

  // Fetch community reviews from backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadApiReviews() {
      try {
        const res = await fetch(`${API_URL}/reviews`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.reviews) && data.reviews.length > 0 && isMounted) {
          setReviewsList((current) => {
            const apiReviewIds = new Set(data.reviews.map((r) => String(r.id)));
            // Retain local reviews that are not yet on backend
            const retained = current.filter((r) => !apiReviewIds.has(String(r.id)));
            return [...data.reviews, ...retained];
          });
        }
      } catch {
        /* Fallback silently to local cache */
      }
    }
    loadApiReviews();
    return () => { isMounted = false; };
  }, []);

  function persistReviews(list) {
    setReviewsList(list);
    try {
      localStorage.setItem("roamly-community-reviews", JSON.stringify(list));
    } catch {}
  }

  function handleUpvote(reviewId) {
    if (upvotedIds.includes(reviewId)) return;

    // Call API upvote endpoint asynchronously
    fetch(`${API_URL}/reviews/${reviewId}/upvote`, { method: "PATCH" }).catch(() => null);

    const updated = reviewsList.map((r) => {
      if (r.id === reviewId) {
        return { ...r, helpfulCount: (r.helpfulCount || 0) + 1 };
      }
      return r;
    });

    const nextUpvotes = [...upvotedIds, reviewId];
    setUpvotedIds(nextUpvotes);
    persistReviews(updated);
    try {
      localStorage.setItem("roamly-upvoted-reviews", JSON.stringify(nextUpvotes));
    } catch {}
  }

  async function submitReview(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!isLoggedIn) {
      setError("Please log in to share your journey review.");
      return;
    }

    if (!destinationId || !comment.trim()) {
      setError("Please pick a destination and write your experience.");
      return;
    }

    setLoading(true);

    const selectedPlace = destinations.find((d) => d.id === destinationId);

    // Format budget
    let formattedBudget = budget.trim();
    if (formattedBudget && !formattedBudget.startsWith("₹")) {
      formattedBudget = `₹${formattedBudget}`;
    }

    // Create local review object
    let newReview = {
      id: `rev-${Date.now()}`,
      destinationId: selectedPlace ? selectedPlace.id : destinationId,
      destinationName: selectedPlace ? selectedPlace.name : "Custom Escape",
      author: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.name || "Fellow Traveler"),
      avatar: user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      location: user?.city || "India",
      rating: Number(rating),
      title: title.trim() || `${selectedPlace?.name || "Travel"} Experience`,
      comment: comment.trim(),
      mood: mood,
      duration: duration.trim() || "3 Days",
      budget: formattedBudget || "₹8,000 / person",
      season: season.trim() || "Recent Trip",
      insiderTip: insiderTip.trim(),
      images: photoUrl.trim() ? [photoUrl.trim()] : [],
      date: "Just now",
      helpfulCount: 0,
      verified: true
    };

    // Try API first if available, otherwise persist locally
    try {
      if (token) {
        const response = await fetch(`${API_URL}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            destination_id: destinationId,
            destination_name: selectedPlace ? selectedPlace.name : "Custom Escape",
            rating: Number(rating),
            title: title.trim(),
            comment: comment.trim(),
            mood,
            duration: duration.trim(),
            budget: formattedBudget,
            season: season.trim(),
            insider_tip: insiderTip.trim(),
            photo_url: photoUrl.trim()
          })
        });

        if (response.ok) {
          const apiData = await response.json();
          if (apiData && apiData.review) {
            newReview = apiData.review;
          }
        }
      }
    } catch {
      /* Fallback gracefully to local review object */
    }

    const updated = [newReview, ...reviewsList];
    persistReviews(updated);

    setMessage(`Thank you! Your travel story for ${selectedPlace?.name || "this escape"} was published.`);
    setTitle("");
    setComment("");
    setInsiderTip("");
    setPhotoUrl("");
    setRating(5);
    setLoading(false);
  }

  // Filtered reviews
  const displayedReviews = useMemo(() => {
    return reviewsList.filter((r) => {
      const matchDest =
        filterDest === "all" ||
        r.destinationId?.toLowerCase() === filterDest.toLowerCase() ||
        r.destinationName?.toLowerCase() === filterDest.toLowerCase();

      const matchRating =
        filterRating === "all" ||
        (filterRating === "5" && r.rating === 5) ||
        (filterRating === "4" && r.rating >= 4);

      return matchDest && matchRating;
    });
  }, [reviewsList, filterDest, filterRating]);

  // Overall stats
  const avgRating = useMemo(() => {
    if (!reviewsList.length) return "4.9";
    const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviewsList.length).toFixed(1);
  }, [reviewsList]);

  return (
    <main className="page-main reviews-page">
      {/* HERO BANNER */}
      <section className="reviews-hero">
        <div className="container">
          <Link to="/user/dashboard" className="reviews-back-link">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>

          <div className="reviews-eyebrow">
            <MessageSquareText size={16} />
            <span>COMMUNITY TRAVEL STORIES & EXPERIENCES</span>
          </div>

          <h1>
            Every journey has a <span className="script-accent">story.</span>
          </h1>
          <p className="reviews-hero-sub">
            Read verified advice, authentic trip photos, and candid insider reviews from fellow Indian travelers,
            or share your own stories from the road.
          </p>

          {/* METRIC CARDS ROW */}
          <div className="reviews-metrics-bar">
            <div className="metric-badge">
              <Star size={18} fill="#dfa849" color="#dfa849" />
              <strong>{avgRating}</strong>
              <span>Average Rating</span>
            </div>
            <div className="metric-badge">
              <CheckCircle2 size={18} color="#2b5037" />
              <strong>{reviewsList.length}+</strong>
              <span>Verified Stories</span>
            </div>
            <div className="metric-badge">
              <Camera size={18} color="#45785c" />
              <strong>100%</strong>
              <span>Real Traveler Photos</span>
            </div>
            <div className="metric-badge">
              <Sparkles size={18} color="#c96d44" />
              <strong>Zero</strong>
              <span>Sponsored Ad Clutter</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container reviews-content-grid">
        {/* WRITE A REVIEW PANEL */}
        <aside className="reviews-form-card">
          <div className="form-card-header">
            <h3>Share Your Experience</h3>
            <p>Help other travelers with duration, expenses, secret viewpoints, and honest tips.</p>
          </div>

          {!isLoggedIn ? (
            <div className="review-login-prompt">
              <LogIn size={28} className="prompt-icon" />
              <h4>Log in to write a review</h4>
              <p>Sign in to your Roamly account to publish your travel stories with photos and earn traveler badges.</p>
              <Link to="/login" className="button button-dark full-width">
                Log in now
              </Link>
            </div>
          ) : (
            <form onSubmit={submitReview} className="review-submit-form">
              {message && (
                <div className="review-feedback-box success">
                  <CheckCircle2 size={16} />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="review-feedback-box error">
                  <span>{error}</span>
                </div>
              )}

              {/* Destination Picker */}
              <label className="form-label">
                <span>Select Destination</span>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="destination-select"
                  required
                >
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.state || d.country} ({d.category})
                    </option>
                  ))}
                </select>
              </label>

              {/* Star Rating Picker */}
              <div className="form-group">
                <label className="form-label">
                  <span>Your Rating: <strong>{rating} Stars</strong></span>
                </label>
                <div className="star-picker-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setRating(val)}
                      className="star-pick-btn"
                      aria-label={`${val} Stars`}
                    >
                      <Star
                        size={26}
                        fill={val <= rating ? "#dfa849" : "none"}
                        color={val <= rating ? "#dfa849" : "#cbd5cb"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Fast-Facts Grid: Duration & Budget */}
              <div className="form-two-cols">
                <label className="form-label">
                  <span>Trip Duration</span>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 Days / 2 Nights"
                  />
                </label>

                <label className="form-label">
                  <span>Approx Spend (₹)</span>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. ₹9,500"
                  />
                </label>
              </div>

              {/* Season & Travel Vibe */}
              <div className="form-two-cols">
                <label className="form-label">
                  <span>Travel Season</span>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="e.g. October (Post-Monsoon)"
                  />
                </label>

                <label className="form-label">
                  <span>Travel Vibe</span>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="mood-select"
                  >
                    <option value="Peace">🕊️ Peace & Calm</option>
                    <option value="Adventure">🏔️ Adventure & Thrill</option>
                    <option value="Romance">🌅 Romance & Sunsets</option>
                    <option value="Nature">🌿 Nature & Hills</option>
                    <option value="Culture">🏛️ Heritage & Culture</option>
                    <option value="Spiritual">🛕 Spiritual & Sacred</option>
                    <option value="Relaxation">🌊 Coastal & Waves</option>
                  </select>
                </label>
              </div>

              {/* Headline */}
              <label className="form-label">
                <span>Story Headline</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunrise view at Kolukkumalai was unforgettable!"
                  maxLength={120}
                />
              </label>

              {/* Detailed Review */}
              <label className="form-label">
                <span>Your Travel Story</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What was the highlight? What should other travelers know about road conditions, food, viewpoints, or best hours to visit?"
                  rows={4}
                  maxLength={1500}
                  required
                />
                <span className="char-count">{comment.length} / 1500 characters</span>
              </label>

              {/* Insider Tip */}
              <label className="form-label">
                <span>💡 Traveler's Insider Pro-Tip</span>
                <input
                  type="text"
                  value={insiderTip}
                  onChange={(e) => setInsiderTip(e.target.value)}
                  placeholder="e.g. Hire the hand-rowed boat at dawn from Assi Ghat"
                />
              </label>

              {/* Photo URL */}
              <label className="form-label">
                <span>📸 Photo Image URL (Optional)</span>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Paste a link to your scenic photo (Unsplash / Cloud)"
                />
              </label>

              <button
                type="submit"
                className="button button-dark submit-review-btn"
                disabled={loading}
              >
                <Send size={16} />
                <span>{loading ? "Publishing story…" : "Post your travel story"}</span>
              </button>
            </form>
          )}
        </aside>

        {/* REVIEWS FEED SECTION */}
        <section className="reviews-feed-column">
          {/* FEED FILTERS BAR */}
          <div className="feed-filter-bar">
            <div className="filter-group">
              <Filter size={16} />
              <span>Destination:</span>
              <select
                value={filterDest}
                onChange={(e) => setFilterDest(e.target.value)}
              >
                <option value="all">All Escapes ({reviewsList.length})</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <span>Rating:</span>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars only</option>
                <option value="4">4+ Stars</option>
              </select>
            </div>
          </div>

          {/* REVIEWS LIST */}
          <div className="reviews-cards-list">
            {displayedReviews.length === 0 ? (
              <div className="empty-reviews-box">
                <Compass size={36} />
                <h4>No reviews match this filter yet</h4>
                <p>Be the first traveler to share your story for this escape!</p>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setFilterDest("all");
                    setFilterRating("all");
                  }}
                >
                  Show all stories
                </button>
              </div>
            ) : (
              displayedReviews.map((rev) => {
                const hasUpvoted = upvotedIds.includes(rev.id);

                return (
                  <article key={rev.id} className="community-review-card">
                    {/* Header */}
                    <div className="review-card-top">
                      <div className="reviewer-info">
                        <img
                          src={rev.avatar}
                          alt={rev.author}
                          className="reviewer-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                          }}
                        />
                        <div>
                          <div className="reviewer-name-row">
                            <strong>{rev.author}</strong>
                            {rev.verified && (
                              <span className="verified-badge" title="Verified Traveler">
                                <CheckCircle2 size={12} /> Verified Traveler
                              </span>
                            )}
                          </div>
                          <span className="reviewer-location">
                            <MapPin size={11} /> {rev.location || "India"} · {rev.date}
                          </span>
                        </div>
                      </div>

                      {/* Destination & Mood Tag */}
                      <div className="review-tags-box">
                        <Link
                          to={`/destination/${rev.destinationId}`}
                          className="review-dest-chip"
                        >
                          {rev.destinationName}
                        </Link>
                        {rev.mood && (
                          <span className="review-mood-chip">{rev.mood}</span>
                        )}
                      </div>
                    </div>

                    {/* Trip Fast-Facts Bar (Tripoto-inspired metadata) */}
                    <div className="review-fast-facts">
                      {rev.duration && (
                        <div className="fast-fact-pill">
                          <Clock size={13} className="fact-icon" />
                          <span>{rev.duration}</span>
                        </div>
                      )}
                      {rev.budget && (
                        <div className="fast-fact-pill">
                          <IndianRupee size={13} className="fact-icon" />
                          <span>{rev.budget}</span>
                        </div>
                      )}
                      {rev.season && (
                        <div className="fast-fact-pill">
                          <CalendarDays size={13} className="fact-icon" />
                          <span>{rev.season}</span>
                        </div>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="review-stars-row">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={15}
                          fill={i < rev.rating ? "#dfa849" : "none"}
                          color={i < rev.rating ? "#dfa849" : "#cbd5cb"}
                        />
                      ))}
                    </div>

                    {/* Content */}
                    <h4 className="review-title">{rev.title}</h4>
                    <p className="review-body">{rev.comment}</p>

                    {/* Insider Pro-Tip Callout Box */}
                    {rev.insiderTip && (
                      <div className="review-insider-tip">
                        <div className="tip-icon-wrap">
                          <Lightbulb size={16} />
                        </div>
                        <div className="tip-text-wrap">
                          <strong>Insider Traveler Pro-Tip:</strong>
                          <p>{rev.insiderTip}</p>
                        </div>
                      </div>
                    )}

                    {/* Traveler Photos Grid */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="review-photos-grid">
                        {rev.images.map((img, idx) => (
                          <button
                            type="button"
                            key={idx}
                            className="review-photo-btn"
                            onClick={() =>
                              setActivePhoto({
                                url: img,
                                caption: rev.title,
                                author: rev.author,
                                destination: rev.destinationName
                              })
                            }
                            aria-label={`Enlarge photo from ${rev.destinationName}`}
                          >
                            <img
                              src={img}
                              alt={`${rev.destinationName} landscape by ${rev.author}`}
                              loading="lazy"
                            />
                            <span className="photo-zoom-hint">
                              <Maximize2 size={13} /> View Photo
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Footer / Upvote */}
                    <div className="review-card-footer">
                      <button
                        type="button"
                        className={`upvote-btn ${hasUpvoted ? "has-upvoted" : ""}`}
                        onClick={() => handleUpvote(rev.id)}
                        disabled={hasUpvoted}
                      >
                        <ThumbsUp size={14} />
                        <span>{hasUpvoted ? "Helpful story" : "Helpful"} ({rev.helpfulCount || 0})</span>
                      </button>

                      <Link
                        to={`/destination/${rev.destinationId}`}
                        className="explore-dest-link"
                      >
                        Explore {rev.destinationName} guide →
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>

      {/* LIGHTBOX MODAL FOR TRAVELER PHOTOS */}
      {activePhoto && (
        <div
          className="review-lightbox-backdrop"
          onClick={() => setActivePhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="review-lightbox-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setActivePhoto(null)}
              aria-label="Close photo"
            >
              <X size={20} />
            </button>

            <img
              src={activePhoto.url}
              alt={activePhoto.caption || "Traveler photograph"}
              className="lightbox-main-img"
            />

            <div className="lightbox-caption">
              <span className="lightbox-dest-badge">
                <MapPin size={13} /> {activePhoto.destination}
              </span>
              <h4>{activePhoto.caption}</h4>
              <p>Shared by {activePhoto.author} · Verified Roamly Explorer</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
