import { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Bed,
  Utensils,
  Car,
  ShieldCheck,
  Eye,
  ArrowRight,
  Clock,
  MapPin,
  X,
  Users
} from "lucide-react";
import { getPublicPackages } from "../api/packages";
import "./DestinationPackages.css";

export default function DestinationPackages({ destination, onBookPackage }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTierFilter, setActiveTierFilter] = useState("all"); // 'all' | 'standard' | 'comfort' | 'premium'
  const [previewPackage, setPreviewPackage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPackages() {
      if (!destination) return;
      try {
        setLoading(true);
        // Try to fetch packages by numeric destination.id or destination.name / state
        const destParam = destination.id || destination.name;
        const res = await getPublicPackages({ destinationId: destParam });

        if (isMounted) {
          if (res.packages && res.packages.length > 0) {
            setPackages(res.packages);
          } else {
            // If no destination-specific packages yet, provide curated standard tiers based on destination budget
            const rawBudget = destination.budget || destination.price || "15000";
            const match = String(rawBudget).replace(/[,\s]/g, "").match(/₹?(\d+)/);
            const basePrice = match ? parseInt(match[1], 10) : 15000;

            const fallbackPackages = [
              {
                id: `dyn-${destination.id}-std`,
                packageCode: `PKG-${(destination.name || "DEST").slice(0, 3).toUpperCase()}-STD`,
                destinationId: destination.id,
                name: `${destination.name} Explorer — Classic Highlights`,
                tagline: `Essential sightseeing and comfortable verified stays`,
                tier: "standard",
                durationDays: 4,
                durationNights: 3,
                accommodationType: "3-Star Boutique Hotel",
                mealPlan: "Breakfast Included (CP Plan)",
                transportType: "Dedicated AC Sedan",
                pickupDrop: "Designated Airport/Station Transfer",
                pricePerPerson: basePrice,
                originalPrice: Math.round(basePrice * 1.25),
                inclusions: [
                  "3 Nights accommodation on twin-sharing basis",
                  "Daily buffet breakfast at stay",
                  "Private AC vehicle for all transfers and itinerary",
                  "All toll taxes, parking, and driver allowances",
                  "24/7 dedicated Roamly concierge support"
                ],
                exclusions: [
                  "Airfare or train fare to arrival station",
                  "Monuments and activity entry tickets",
                  "Personal laundry and beverage charges"
                ],
                itinerary: [
                  { day: 1, title: `Arrival in ${destination.name}`, description: "Airport/railway station pickup, transfer to hotel, check-in, and evening leisure walk." },
                  { day: 2, title: "Iconic Highlights & Scenic Trails", description: "Guided sightseeing covering primary landmarks, local viewpoint, and artisan markets." },
                  { day: 3, title: "Culture & Nature Exploration", description: "Explore tranquil outskirts, local cuisine tasting, and scenic sunset spot." },
                  { day: 4, title: "Farewell & Departure", description: "Leisurely breakfast, souvenir shopping, and timely transfer to the airport or station." }
                ]
              },
              {
                id: `dyn-${destination.id}-comf`,
                packageCode: `PKG-${(destination.name || "DEST").slice(0, 3).toUpperCase()}-COMF`,
                destinationId: destination.id,
                name: `${destination.name} Comfort Escape — Scenic Valley Retreat`,
                tagline: `Superior handpicked resorts with curated experiences`,
                tier: "comfort",
                durationDays: 5,
                durationNights: 4,
                accommodationType: "4-Star Mountain/Lakeside Resort",
                mealPlan: "Breakfast & Dinner Included (MAP Plan)",
                transportType: "Private Innova Crysta / SUV",
                pickupDrop: "Private Airport/Station Chauffeur Transfer",
                pricePerPerson: Math.round(basePrice * 1.6),
                originalPrice: Math.round(basePrice * 1.95),
                inclusions: [
                  "4 Nights in premium valley-view or garden-view rooms",
                  "Daily buffet breakfast and multi-course dinners",
                  "Dedicated executive SUV with chilled refreshments",
                  "Curated nature walk or boat cruise passes",
                  "Experienced local storyteller for heritage landmarks",
                  "Priority concierge service throughout"
                ],
                exclusions: [
                  "Airfare/train fare to base destination",
                  "Personal purchases and room mini-bar charges"
                ],
                itinerary: [
                  { day: 1, title: `Scenic Arrival & Resort Check-in`, description: "Chauffeur meet and greet, scenic drive, welcome refreshments, and gourmet dinner." },
                  { day: 2, title: "Nature Sanctuary & Hidden Vistas", description: "Exclusive guided tour to offbeat nature trails, photography stops, and lunch at authentic regional bistro." },
                  { day: 3, title: "Heritage, Craft & Artisan Encounters", description: "Local artisan workshop tour, cultural performance or museum entry, and relaxation." },
                  { day: 4, title: "Sunset Leisure & Candlelight Dining", description: "Relaxing morning at leisure, scenic viewpoint tour, and celebration dinner." },
                  { day: 5, title: "Departure", description: "Complimentary breakfast and comfortable chauffeur drive back to departure hub." }
                ]
              },
              {
                id: `dyn-${destination.id}-prem`,
                packageCode: `PKG-${(destination.name || "DEST").slice(0, 3).toUpperCase()}-PREM`,
                destinationId: destination.id,
                name: `${destination.name} Premium Experience — Luxury Heritage Sanctuary`,
                tagline: `Ultra-luxury villas, private naturalist, and bespoke dining`,
                tier: "premium",
                durationDays: 6,
                durationNights: 5,
                accommodationType: "5-Star Heritage Estate / Luxury Villa",
                mealPlan: "All Gourmet Meals Included (Full Board)",
                transportType: "Executive Luxury SUV Chauffeur",
                pickupDrop: "VIP Airport Meet & Chauffeur Transfer",
                pricePerPerson: Math.round(basePrice * 2.5),
                originalPrice: Math.round(basePrice * 3.1),
                inclusions: [
                  "5 Nights in private luxury estate or palace suite",
                  "Chef-curated gourmet dining (Breakfast, Lunch & Dinner)",
                  "Executive Mercedes/Hycross private chauffeur service",
                  "Complimentary 90-minute signature spa rejuvenation",
                  "Private naturalist & personal guide for all excursions",
                  "VIP express access to all landmark monuments & parks"
                ],
                exclusions: [
                  "Domestic / International airfares",
                  "Customized helicopter charters (available on request)"
                ],
                itinerary: [
                  { day: 1, title: "VIP Royal Welcome", description: "Chauffeured arrival, luxury villa check-in, chef's bespoke welcome dinner." },
                  { day: 2, title: "Private Wildlife or Heritage Immersion", description: "Exclusive naturalist guided morning tour followed by colonial estate high tea." },
                  { day: 3, title: "Wellness & Holistic Rejuvenation", description: "Signature spa treatment, meditation/yoga session, and scenic tranquil picnic." },
                  { day: 4, title: "Cultural Masterclass & Gourmet Trails", description: "Private cooking demonstration with masterchef and landmark exploration." },
                  { day: 5, title: "Sunset Cruise / Private Panoramic Vista", description: "Scenic champagne sunset view, gourmet farewell dinner." },
                  { day: 6, title: "Farewell Transfer", description: "Luxury breakfast, gift hamper, and chauffeur drop-off at airport." }
                ]
              }
            ];

            setPackages(fallbackPackages);
          }
        }
      } catch (err) {
        console.error("Error loading destination packages:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPackages();

    return () => {
      isMounted = false;
    };
  }, [destination]);

  const filteredPackages = packages.filter((pkg) => {
    if (activeTierFilter === "all") return true;
    return pkg.tier === activeTierFilter;
  });

  const tierMeta = {
    standard: {
      badge: "Standard Experience",
      themeColor: "#1b4332",
      pillBg: "#f0fdf4",
      pillColor: "#166534",
      pillBorder: "#bbf7d0",
      vibe: "Classic Value & Comfort"
    },
    comfort: {
      badge: "Comfort Escape",
      themeColor: "#0369a1",
      pillBg: "#f0f9ff",
      pillColor: "#0284c7",
      pillBorder: "#bae6fd",
      vibe: "Most Popular · Elevated Stays"
    },
    premium: {
      badge: "Premium Experience",
      themeColor: "#7e22ce",
      pillBg: "#faf5ff",
      pillColor: "#6b21a8",
      pillBorder: "#e9d5ff",
      vibe: "Ultra Luxury · Private Sanctuary"
    }
  };

  return (
    <section className="dest-packages-section" id="special-packages">
      <div className="dest-packages-header">
        <div>
          <span className="dest-packages-eyebrow">
            <Sparkles size={14} /> SPECIAL TRAVEL PACKAGES
          </span>
          <h2>
            Curated Experiences for <span className="script-accent">{destination?.name || "Your Journey"}</span>
          </h2>
          <p>
            Choose from authentic tiered packages handcrafted with verified local partners, confirmed chauffeur transport, and guaranteed service snapshots.
          </p>
        </div>

        {/* FILTER PILLS */}
        <div className="dest-tier-filters">
          <button
            type="button"
            className={`tier-filter-btn ${activeTierFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveTierFilter("all")}
          >
            All Packages ({packages.length})
          </button>
          <button
            type="button"
            className={`tier-filter-btn ${activeTierFilter === "standard" ? "active" : ""}`}
            onClick={() => setActiveTierFilter("standard")}
          >
            Standard ({packages.filter((p) => p.tier === "standard").length})
          </button>
          <button
            type="button"
            className={`tier-filter-btn ${activeTierFilter === "comfort" ? "active" : ""}`}
            onClick={() => setActiveTierFilter("comfort")}
          >
            Comfort ({packages.filter((p) => p.tier === "comfort").length})
          </button>
          <button
            type="button"
            className={`tier-filter-btn ${activeTierFilter === "premium" ? "active" : ""}`}
            onClick={() => setActiveTierFilter("premium")}
          >
            Premium ({packages.filter((p) => p.tier === "premium").length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dest-packages-loading">
          <Clock size={28} className="admin-spinning" />
          <p>Loading available travel packages for {destination?.name}...</p>
        </div>
      ) : (
        <div className="dest-packages-grid">
          {filteredPackages.map((pkg) => {
            const meta = tierMeta[pkg.tier] || tierMeta.standard;
            const price = Number(pkg.pricePerPerson || pkg.price_per_person || 0);
            const orig = pkg.originalPrice || pkg.original_price;

            return (
              <div
                key={pkg.id}
                className={`dest-pkg-card tier-${pkg.tier} ${pkg.tier === "comfort" ? "featured-card" : ""}`}
              >
                {/* CARD TOP BADGE */}
                <div className="dest-pkg-card-top">
                  <span
                    className="dest-pkg-tier-badge"
                    style={{
                      background: meta.pillBg,
                      color: meta.pillColor,
                      borderColor: meta.pillBorder
                    }}
                  >
                    <Sparkles size={12} /> {meta.badge}
                  </span>

                  <span className="dest-pkg-duration-badge">
                    <Calendar size={13} /> {pkg.durationDays || 4}D / {pkg.durationNights || 3}N
                  </span>
                </div>

                {/* TITLE & TAGLINE */}
                <h3 className="dest-pkg-title">{pkg.name}</h3>
                <p className="dest-pkg-tagline">{pkg.tagline || meta.vibe}</p>

                {/* QUICK INCLUSIONS HIGHLIGHTS */}
                <div className="dest-pkg-highlights">
                  <div className="pkg-hl-item">
                    <Bed size={15} />
                    <span>{pkg.accommodationType || "Curated Stays"}</span>
                  </div>
                  <div className="pkg-hl-item">
                    <Utensils size={15} />
                    <span>{pkg.mealPlan || "Breakfast Included"}</span>
                  </div>
                  <div className="pkg-hl-item">
                    <Car size={15} />
                    <span>{pkg.transportType || "Private AC Cab"}</span>
                  </div>
                </div>

                {/* INCLUSIONS LIST */}
                <div className="dest-pkg-inc-preview">
                  <span className="inc-preview-title">Package Inclusions:</span>
                  <ul>
                    {Array.isArray(pkg.inclusions) &&
                      pkg.inclusions.slice(0, 3).map((inc, i) => (
                        <li key={i}>
                          <CheckCircle2 size={13} className="inc-check" />
                          <span>{inc}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* PRICING & ACTIONS */}
                <div className="dest-pkg-footer">
                  <div className="dest-pkg-price-box">
                    {orig && <span className="orig-price">₹{Number(orig).toLocaleString("en-IN")}</span>}
                    <div className="main-price-row">
                      <strong className="main-price">₹{price.toLocaleString("en-IN")}</strong>
                      <span className="price-unit">/ person</span>
                    </div>
                  </div>

                  <div className="dest-pkg-actions">
                    <button
                      type="button"
                      className="dest-pkg-view-btn"
                      onClick={() => setPreviewPackage(pkg)}
                      title="View complete itinerary and inclusions"
                    >
                      <Eye size={14} /> View Details
                    </button>

                    <button
                      type="button"
                      className="dest-pkg-book-btn"
                      onClick={() => onBookPackage(pkg)}
                    >
                      Book Package <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewPackage && (
        <div className="dest-preview-backdrop" onClick={() => setPreviewPackage(null)}>
          <div className="dest-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dest-preview-header">
              <div>
                <span className="dest-pkg-tier-badge">
                  <Sparkles size={12} /> {previewPackage.tier?.toUpperCase()} TIER
                </span>
                <h2>{previewPackage.name}</h2>
                <p>{previewPackage.tagline}</p>
              </div>
              <button
                type="button"
                className="dest-preview-close"
                onClick={() => setPreviewPackage(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="dest-preview-body">
              <div className="dest-preview-meta-row">
                <span>
                  <Calendar size={15} /> {previewPackage.durationDays || 4} Days / {previewPackage.durationNights || 3} Nights
                </span>
                <span>
                  <Bed size={15} /> {previewPackage.accommodationType}
                </span>
                <span>
                  <Utensils size={15} /> {previewPackage.mealPlan}
                </span>
                <span>
                  <Car size={15} /> {previewPackage.transportType}
                </span>
              </div>

              {/* ITINERARY */}
              <div className="dest-preview-itinerary">
                <h4>Day-by-Day Itinerary</h4>
                {Array.isArray(previewPackage.itinerary) &&
                  previewPackage.itinerary.map((it, idx) => (
                    <div key={idx} className="preview-it-row">
                      <span className="preview-it-day">Day {it.day || idx + 1}</span>
                      <div>
                        <strong>{it.title}</strong>
                        <p>{it.description}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* INCLUSIONS */}
              <div className="dest-preview-inc">
                <h4>All Included Services</h4>
                <ul>
                  {Array.isArray(previewPackage.inclusions) &&
                    previewPackage.inclusions.map((inc, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={14} color="#16a34a" /> <span>{inc}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="dest-preview-footer">
              <div className="dest-preview-price">
                <small>Package Price</small>
                <strong>₹{Number(previewPackage.pricePerPerson || previewPackage.price_per_person || 0).toLocaleString("en-IN")}</strong>
                <span> / person</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="button button-dark"
                  onClick={() => setPreviewPackage(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    const toBook = previewPackage;
                    setPreviewPackage(null);
                    onBookPackage(toBook);
                  }}
                  style={{ background: "#1b4332", color: "#ffffff" }}
                >
                  Book This Package <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
