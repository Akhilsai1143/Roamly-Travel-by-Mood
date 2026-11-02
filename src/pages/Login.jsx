import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from "lucide-react";

import { loginUser } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

// Curated high-resolution destination photography across India with place names
// Categorized into 3 distinct vertical columns for alternating continuous scroll
const galleryColumns = [
  // Column 1 (Scrolls Up): Ladakh, Munnar, Udaipur, Goa, Meghalaya, Varanasi
  [
    {
      id: "c1-ladakh",
      name: "Ladakh, India",
      alt: "Pangong Tso high-altitude lake and mountains in Ladakh",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=85",
      height: 250
    },
    {
      id: "c1-munnar",
      name: "Kerala, India",
      alt: "Misty rolling green tea plantations in Munnar, Kerala",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=85",
      height: 310
    },
    {
      id: "c1-udaipur",
      name: "Udaipur, India",
      alt: "Lake Pichola and historic City Palace in Udaipur",
      image:
        "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=85",
      height: 230
    },
    {
      id: "c1-goa",
      name: "Goa, India",
      alt: "Sunset over golden palm shores in South Goa",
      image:
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=85",
      height: 280
    },
    {
      id: "c1-meghalaya",
      name: "Meghalaya, India",
      alt: "Lush tropical waterfalls and living root bridges in Meghalaya",
      image:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=85",
      height: 240
    },
    {
      id: "c1-varanasi",
      name: "Varanasi, India",
      alt: "Atmospheric dawn light over the ancient river ghats of Varanasi",
      image:
        "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=85",
      height: 290
    }
  ],
  // Column 2 (Scrolls Down): Spiti Valley, Varkala, Jaipur, Manali, Andaman, Coorg
  [
    {
      id: "c2-spiti",
      name: "Spiti Valley, India",
      alt: "Rugged Himalayan terrain and snow ridges in Spiti Valley",
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85",
      height: 290
    },
    {
      id: "c2-varkala",
      name: "Varkala, India",
      alt: "Red sea cliffs and azure Arabian sea in Varkala, Kerala",
      image:
        "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=800&q=85",
      height: 240
    },
    {
      id: "c2-jaipur",
      name: "Jaipur, India",
      alt: "Ornate pink architecture and royal courtyards in Jaipur",
      image:
        "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=85",
      height: 300
    },
    {
      id: "c2-manali",
      name: "Manali, India",
      alt: "Evergreen pine forests and snowline in Solang, Manali",
      image:
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=85",
      height: 230
    },
    {
      id: "c2-andaman",
      name: "Andaman, India",
      alt: "Turquoise lagoons and untouched sandbars in Andaman Islands",
      image:
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=85",
      height: 270
    },
    {
      id: "c2-coorg",
      name: "Coorg, India",
      alt: "Misty Western Ghats and dense coffee hills in Coorg",
      image:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=85",
      height: 250
    }
  ],
  // Column 3 (Scrolls Up): Alleppey Backwaters, Rishikesh, Gokarna, Darjeeling, Ooty, Nubra
  [
    {
      id: "c3-kerala",
      name: "Alleppey, India",
      alt: "Tranquil backwater canals and houseboats in Alleppey, Kerala",
      image:
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=85",
      height: 240
    },
    {
      id: "c3-rishikesh",
      name: "Rishikesh, India",
      alt: "Scenic river gorge and Himalayan foothills in Rishikesh",
      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=85",
      height: 290
    },
    {
      id: "c3-gokarna",
      name: "Gokarna, India",
      alt: "Cliffside trails and secluded cove beaches in Gokarna",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=85",
      height: 230
    },
    {
      id: "c3-darjeeling",
      name: "Darjeeling, India",
      alt: "Tea garden slopes facing Himalayan peaks in Darjeeling",
      image:
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=85",
      height: 300
    },
    {
      id: "c3-ooty",
      name: "Ooty, India",
      alt: "Verdant Nilgiri hill ranges and eucalyptus mist in Ooty",
      image:
        "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=85",
      height: 240
    },
    {
      id: "c3-nubra",
      name: "Nubra Valley, India",
      alt: "High-altitude mountain vistas and shadows in Ladakh",
      image:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=85",
      height: 280
    }
  ]
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { saveSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        email: cleanEmail,
        password
      });

      saveSession(result);

      if (result.user.role === "admin") {
        navigate("/admin/destinations", {
          replace: true
        });
      } else {
        navigate("/user/dashboard", {
          replace: true
        });
      }
    } catch (err) {
      setError(err.message || "Unable to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="roamly-login">
      {/* LEFT: INFINITE MULTI-COLUMN DESTINATION GALLERY WITH DESTINATION NAMES */}
      <section
        className="login-journey"
        aria-label="Infinite destination image gallery"
      >
        <div className="login-gallery-wrapper">
          {galleryColumns.map((column, colIdx) => {
            const isDown = colIdx % 2 === 1;
            const directionClass = isDown
              ? "gallery-track-down"
              : "gallery-track-up";
            const colClass = `gallery-col-${colIdx + 1}`;

            return (
              <div
                className={`gallery-column ${colClass}`}
                key={`gallery-col-${colIdx}`}
              >
                <div className={`gallery-track ${directionClass}`}>
                  {/* Primary Image Sequence */}
                  <div className="gallery-group">
                    {column.map((item) => (
                      <div
                        className="gallery-card"
                        key={item.id}
                        style={{ height: `${item.height}px` }}
                      >
                        <img
                          src={item.image}
                          alt={item.alt}
                          loading="eager"
                        />
                        <span className="gallery-card-name">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Duplicated Image Sequence for Seamless Infinite Looping */}
                  <div className="gallery-group" aria-hidden="true">
                    {column.map((item) => (
                      <div
                        className="gallery-card"
                        key={`${item.id}-loop`}
                        style={{ height: `${item.height}px` }}
                      >
                        <img
                          src={item.image}
                          alt=""
                          loading="lazy"
                        />
                        <span className="gallery-card-name">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RIGHT: STATIONARY LOGIN PANEL */}
      <aside className="login-panel">
        <div className="login-panel-top">
          <span className="login-panel-caption">
            YOUR PERSONAL TRAVEL SPACE
          </span>

          <span className="login-panel-sparkle">
            <Sparkles size={17} />
          </span>
        </div>

        <div className="login-panel-content">
          <Link to="/" className="login-mobile-brand">
            <Compass size={25} />

            <span>
              roamly<span className="login-brand-dot">.</span>
            </span>
          </Link>

          <div className="login-welcome">
            <span className="login-kicker">WELCOME BACK</span>

            <h1>
              Find your way
              <br />
              back to <em>adventure.</em>
            </h1>

            <p>
              Your saved places, dream destinations and next
              great escape are just a sign-in away.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="loginEmail">Email address</label>

              <input
                id="loginEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="loginPassword">Password</label>

              <div className="login-password-wrap">
                <input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading ? "Finding your way in..." : "Welcome back"}
              </span>

              {!loading && (
                <span className="login-submit-arrow">
                  <ArrowRight size={19} />
                </span>
              )}
            </button>

            <div className="login-secure-note">
              <ShieldCheck size={15} />
              <span>Your journey starts with a secure sign-in.</span>
            </div>
          </form>

          <div className="login-divider">
            <span />
            <span>NEW TO ROAMLY?</span>
            <span />
          </div>

          <Link to="/register" className="login-create-account">
            Create your account
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="login-panel-footer">
          <Link to="/">Back to Roamly</Link>
          <span>TRAVEL FEELS DIFFERENT HERE.</span>
        </div>
      </aside>
    </main>
  );
}
