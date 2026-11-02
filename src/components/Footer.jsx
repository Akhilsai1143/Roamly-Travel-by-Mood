import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Headphones,
  Award,
  Calendar,
  Heart,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="site-footer emt-black-footer">
      {/* 1. PRE-FOOTER FLOATING ASSISTANCE RIBBON (MATCHING USER REFERENCE SCREENSHOT) */}
      <div className="footer-assistance-wrap">
        <div className="container">
          <div className="footer-assistance-box">
            <span className="assistance-tag-pill">Hassle Free. On-trip assistance</span>
            <div className="assistance-contacts-row">
              <div className="assistance-contact-item">
                <span className="contact-label">Email ID:</span>
                <a href="mailto:concierge@roamly.com" className="contact-val">
                  concierge@roamly.com
                </a>
              </div>
              <span className="assistance-sep">|</span>
              <div className="assistance-contact-item">
                <span className="contact-label">Contact No:</span>
                <a href="tel:+91800762659" className="contact-val">
                  +91-800-ROAMLY (Toll-Free)
                </a>
              </div>
              <span className="assistance-sep">|</span>
              <div className="assistance-contact-item">
                <span className="contact-label">WhatsApp Helpline:</span>
                <a
                  href="https://wa.me/919455078160"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-val"
                >
                  +91-9455078160
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN OBSIDIAN BLACK ENTERPRISE FOOTER */}
      <div className="container footer-main-grid">
        {/* Column 1: Brand & Philosophy */}
        <div className="footer-col brand-col">
          <Link to="/" className="brand brand-light" aria-label="Roamly home">
            <span className="brand-mark brand-mark-emerald">
              <Compass size={22} strokeWidth={2.4} />
            </span>
            <span>
              roamly<span className="brand-dot">.</span>
              <small>TRAVEL BY MOOD</small>
            </span>
          </Link>

          <p className="footer-mission-text">
            India's premier mood-engineered holiday platform. Curated multi-day packages,
            handpicked mountain chalets, backwater houseboats & verified itineraries
            tailored to your inner emotional frequency.
          </p>

          <div className="footer-trust-perks">
            <div className="perk-pill">
              <ShieldCheck size={14} className="perk-icon" />
              <span>100% Verified Boutique Stays & Resorts</span>
            </div>
            <div className="perk-pill">
              <Award size={14} className="perk-icon" />
              <span>Govt. Recognized Travel Standards</span>
            </div>
            <div className="perk-pill">
              <Headphones size={14} className="perk-icon" />
              <span>24/7 Dedicated Personal Travel Concierge</span>
            </div>
          </div>
        </div>

        {/* Column 2: Popular Holiday Packages */}
        <div className="footer-col links-col">
          <h4 className="footer-col-title">Popular Tour Packages</h4>
          <ul className="footer-links-list">
            <li>
              <Link to="/discover?region=himachal&q=Manali">
                <span>🏔️ Himachal & Manali Packages</span>
              </Link>
            </li>
            <li>
              <Link to="/discover?region=himachal&q=Spiti">
                <span>❄️ Spiti Valley High-Pass Treks</span>
              </Link>
            </li>
            <li>
              <Link to="/discover?region=south&q=Munnar">
                <span>🌴 Kerala Backwaters & Munnar Tea Hills</span>
              </Link>
            </li>
            <li>
              <Link to="/discover?region=heritage&q=Udaipur">
                <span>🏰 Rajasthan Royal Palaces & Deserts</span>
              </Link>
            </li>
            <li>
              <Link to="/discover?region=coastal&q=Goa">
                <span>🌊 Goa Beach Holidays & Catamarans</span>
              </Link>
            </li>
            <li>
              <Link to="/discover?region=kashmir">
                <span>🏔️ Kashmir & Ladakh High-Altitude Tours</span>
              </Link>
            </li>
            <li>
              <Link to="/discover?region=uttarakhand">
                <span>🛕 Spiritual Rishikesh & Kedarnath</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Travel Tools & Explorer Services */}
        <div className="footer-col links-col">
          <h4 className="footer-col-title">Traveler Hub & Planning</h4>
          <ul className="footer-links-list">
            <li>
              <Link to="/hotels">
                <span>🏨 Boutique Stays, Havelis & Chalets</span>
              </Link>
            </li>
            <li>
              <Link to="/discover">
                <span>✨ Mood-Based Package Search</span>
              </Link>
            </li>
            <li>
              <Link to="/planner">
                <span>📅 AI Trip Outline Planner</span>
              </Link>
            </li>
            <li>
              <Link to="/surprise">
                <span>🎲 Serendipity Escapes (Surprise Me)</span>
              </Link>
            </li>
            <li>
              <Link to="/wishlist">
                <span>❤️ Saved Escapes & Wishlist</span>
              </Link>
            </li>
            <li>
              <Link to="/reviews">
                <span>⭐ Verified Traveler Reviews (4.8★)</span>
              </Link>
            </li>
            <li>
              <Link to="/stories">
                <span>📖 Curated Travel Journals & Field Notes</span>
              </Link>
            </li>
            <li>
              <Link to="/user/dashboard">
                <span>🎫 Manage Bookings & Boarding Passes</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: 24/7 Concierge Support Card */}
        <div className="footer-col support-col">
          <h4 className="footer-col-title">24/7 On-Trip Assistance</h4>
          <div className="footer-support-card">
            <div className="support-status-line">
              <span className="live-pulse-dot" />
              <span className="status-label">Live Concierge Desk Active</span>
            </div>

            <div className="support-info-row">
              <Phone size={15} className="info-icon" />
              <div>
                <strong>+91 800-ROAMLY</strong>
                <small>Toll-Free Across All Indian Networks</small>
              </div>
            </div>

            <div className="support-info-row">
              <Mail size={15} className="info-icon" />
              <div>
                <strong>concierge@roamly.com</strong>
                <small>Instant booking & date change support</small>
              </div>
            </div>

            <div className="support-info-row">
              <Clock size={15} className="info-icon" />
              <div>
                <strong>24 Hours • 7 Days a Week</strong>
                <small>Under 3 minutes average response</small>
              </div>
            </div>

            <div className="support-info-row">
              <MapPin size={15} className="info-icon" />
              <div>
                <strong>DLF Cyber City, Tower B</strong>
                <small>Roamly Escapes Global HQ, Gurugram, India</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ACCREDITATIONS & GOVERNMENT TRUST SEALS (MATCHING USER SCREENSHOT) */}
      <div className="footer-trust-section">
        <div className="container">
          <div className="trust-strip-inner">
            <div className="trust-item">
              <span className="trust-flag">🇮🇳</span>
              <span className="trust-name">Incredible India</span>
              <small>Approved Partner</small>
            </div>
            <div className="trust-sep">•</div>
            <div className="trust-item">
              <span className="trust-name">IATA</span>
              <small>Accredited Travel Agent</small>
            </div>
            <div className="trust-sep">•</div>
            <div className="trust-item">
              <span className="trust-name">UFTAA</span>
              <small>Global Travel Federation</small>
            </div>
            <div className="trust-sep">•</div>
            <div className="trust-item">
              <span className="trust-name">TAFI & TAAI</span>
              <small>Recognized Member</small>
            </div>
            <div className="trust-sep">•</div>
            <div className="trust-item">
              <span className="trust-name">ISO 9001:2015</span>
              <small>Quality Management Certified</small>
            </div>
            <div className="trust-sep">•</div>
            <div className="trust-item">
              <span className="trust-name">WTAAA</span>
              <small>World Alliance</small>
            </div>
          </div>
        </div>
      </div>

      {/* 4. COPYRIGHT & LEGAL POLICIES (MATCHING USER SCREENSHOT) */}
      <div className="footer-copyright-bar">
        <div className="container footer-copyright-inner">
          <div className="copyright-left">
            <span className="division-badge">
              Division of <strong>Roamly Escapes Global</strong>
            </span>
            <span className="copyright-sep">|</span>
            <span>
              Copyright © {new Date().getFullYear()} <strong>EasyDarshan / Roamly</strong>. All Rights Reserved.
            </span>
          </div>

          <div className="legal-links">
            <Link to="/discover">Privacy Policy</Link>
            <Link to="/discover">Terms & Conditions</Link>
            <Link to="/discover">Refund Policy</Link>
            <Link to="/discover">Security</Link>
            <Link to="/discover">Sitemap</Link>
          </div>
        </div>
      </div>

      {/* 5. FLOATING 'PLAN MY TRIP' ACTION BUTTON */}
      <button
        type="button"
        className="floating-plan-trip-btn"
        onClick={() => navigate("/planner")}
        title="Plan your custom trip itinerary"
        aria-label="Plan My Trip"
      >
        <span className="plan-trip-icon">
          <Calendar size={16} />
        </span>
        <span className="plan-trip-label">Plan My Trip</span>
      </button>
    </footer>
  );
}

