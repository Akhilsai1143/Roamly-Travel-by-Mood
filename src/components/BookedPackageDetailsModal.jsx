import { useEffect, useState } from "react";
import {
  X,
  Sparkles,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Printer,
  Copy,
  Check,
  Bed,
  Utensils,
  Car,
  Navigation,
  FileText,
  AlertTriangle,
  Receipt
} from "lucide-react";
import { getBookingPackageDetails } from "../api/bookings";
import "./BookedPackageDetailsModal.css";

export default function BookedPackageDetailsModal({ booking, onClose, onPayNow, onPrintPass }) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary"); // 'itinerary' | 'inclusions' | 'policies' | 'pricing'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDetails() {
      if (!booking?.id) return;
      try {
        setLoading(true);
        const data = await getBookingPackageDetails(booking.id);
        if (isMounted) {
          setDetails(data);
        }
      } catch (err) {
        console.error("Failed to fetch package snapshot details:", err);
        // Fallback to booking's local snapshot if available
        if (isMounted) {
          setDetails({
            bookingReference: booking.bookingReference || booking.booking_reference,
            destinationName: booking.destinationName || booking.destination_name_snapshot,
            destinationState: booking.destinationState,
            startDate: booking.startDate,
            endDate: booking.endDate,
            travellers: booking.travellers,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            totalAmount: booking.estimatedTotal || booking.estimatedBudget,
            package: booking.packageDetailsSnapshot
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [booking]);

  if (!booking) return null;

  const pkg = details?.package || booking.packageDetailsSnapshot || {};
  const bookingRef = details?.bookingReference || booking.bookingReference || booking.booking_reference || `RMY-${booking.id}`;
  const tier = (pkg.tier || booking.packageTier || "standard").toLowerCase();

  const tierBadges = {
    standard: { label: "Standard Experience", bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    comfort: { label: "Comfort Escape", bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
    premium: { label: "Premium Experience", bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff" },
    custom: { label: "Curated Custom Journey", bg: "#fffbeb", color: "#92400e", border: "#fde68a" }
  };

  const currentTier = tierBadges[tier] || tierBadges.standard;

  function handleCopy() {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(val) {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="pkg-modal-backdrop" onClick={onClose}>
      <div
        className="pkg-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="package-details-title"
      >
        {/* HEADER */}
        <div className="pkg-modal-header">
          <div className="pkg-modal-header-info">
            <div className="pkg-modal-tags">
              <span
                className="pkg-tier-pill"
                style={{
                  background: currentTier.bg,
                  color: currentTier.color,
                  borderColor: currentTier.border
                }}
              >
                <Sparkles size={13} /> {currentTier.label}
              </span>

              <button
                type="button"
                className="pkg-ref-code"
                onClick={handleCopy}
                title="Click to copy booking reference"
              >
                <code>{bookingRef}</code>
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              </button>

              <span className={`pkg-status-pill status-${details?.status || booking.status}`}>
                {details?.status === "confirmed" || booking.status === "confirmed" ? (
                  <>
                    <CheckCircle2 size={13} /> Confirmed
                  </>
                ) : (
                  <>
                    <Clock size={13} /> {booking.status || "Pending"}
                  </>
                )}
              </span>

              {details?.paymentStatus === "paid" || booking.paymentStatus === "paid" ? (
                <span className="pkg-paid-pill">
                  <ShieldCheck size={13} /> Paid in Full
                </span>
              ) : (
                <span className="pkg-unpaid-pill">
                  <Clock size={13} /> Payment Pending
                </span>
              )}
            </div>

            <h2 id="package-details-title" className="pkg-modal-title">
              {pkg.name || `${details?.destinationName || "Destination"} Travel Package`}
            </h2>

            {pkg.tagline && <p className="pkg-modal-tagline">{pkg.tagline}</p>}

            <div className="pkg-modal-trip-meta">
              <span>
                <MapPin size={15} /> {details?.destinationName || "Destination"},{" "}
                {details?.destinationState || "India"}
              </span>
              <span>
                <Calendar size={15} /> {formatDate(details?.startDate || booking.startDate)} —{" "}
                {formatDate(details?.endDate || booking.endDate)} ({pkg.durationDays || 4} Days / {pkg.durationNights || 3} Nights)
              </span>
              <span>
                <Users size={15} /> {details?.travellers || booking.travellers || 1} Traveler(s)
              </span>
            </div>
          </div>

          <button
            type="button"
            className="pkg-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* QUICK SERVICE HIGHLIGHTS */}
        <div className="pkg-services-strip">
          <div className="pkg-service-item">
            <Bed size={18} className="svc-icon" />
            <div>
              <small>Accommodation</small>
              <strong>{pkg.accommodationType || "Curated Verified Stays"}</strong>
            </div>
          </div>
          <div className="pkg-service-item">
            <Utensils size={18} className="svc-icon" />
            <div>
              <small>Meal Plan</small>
              <strong>{pkg.mealPlan || "Daily Breakfast Included"}</strong>
            </div>
          </div>
          <div className="pkg-service-item">
            <Car size={18} className="svc-icon" />
            <div>
              <small>Transport</small>
              <strong>{pkg.transportType || "Private AC Vehicle"}</strong>
            </div>
          </div>
          <div className="pkg-service-item">
            <Navigation size={18} className="svc-icon" />
            <div>
              <small>Transfers</small>
              <strong>{pkg.pickupDrop || "Airport / Station Transfers"}</strong>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="pkg-tab-nav">
          <button
            type="button"
            className={`pkg-tab-btn ${activeTab === "itinerary" ? "active" : ""}`}
            onClick={() => setActiveTab("itinerary")}
          >
            <Calendar size={15} /> Day-by-Day Itinerary ({Array.isArray(pkg.itinerary) ? pkg.itinerary.length : 0})
          </button>
          <button
            type="button"
            className={`pkg-tab-btn ${activeTab === "inclusions" ? "active" : ""}`}
            onClick={() => setActiveTab("inclusions")}
          >
            <CheckCircle2 size={15} /> Inclusions & Exclusions
          </button>
          <button
            type="button"
            className={`pkg-tab-btn ${activeTab === "policies" ? "active" : ""}`}
            onClick={() => setActiveTab("policies")}
          >
            <AlertTriangle size={15} /> Guidelines & Cancellation
          </button>
          <button
            type="button"
            className={`pkg-tab-btn ${activeTab === "pricing" ? "active" : ""}`}
            onClick={() => setActiveTab("pricing")}
          >
            <Receipt size={15} /> Itemized Price Breakdown
          </button>
        </div>

        {/* CONTENT TABS */}
        <div className="pkg-tab-content">
          {loading ? (
            <div className="pkg-loading-wrap">
              <Clock size={28} className="admin-spinning" />
              <p>Loading your verified travel package snapshot...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: ITINERARY */}
              {activeTab === "itinerary" && (
                <div className="pkg-itinerary-tab">
                  {pkg.description && (
                    <div className="pkg-overview-box">
                      <h4>Experience Overview</h4>
                      <p>{pkg.description}</p>
                    </div>
                  )}

                  <div className="pkg-timeline">
                    {Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0 ? (
                      pkg.itinerary.map((item, idx) => (
                        <div key={idx} className="pkg-timeline-item">
                          <div className="pkg-timeline-badge">
                            <span>Day {item.day || idx + 1}</span>
                          </div>
                          <div className="pkg-timeline-body">
                            <h4>{item.title}</h4>
                            <p>{item.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="pkg-muted-empty">Custom day-by-day itinerary will be finalized with your dedicated concierge.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: INCLUSIONS & EXCLUSIONS */}
              {activeTab === "inclusions" && (
                <div className="pkg-inc-exc-grid">
                  <div className="pkg-inc-card">
                    <div className="pkg-inc-header green-header">
                      <CheckCircle2 size={18} />
                      <h3>What is Included</h3>
                    </div>
                    <ul className="pkg-inc-list">
                      {Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 ? (
                        pkg.inclusions.map((inc, i) => (
                          <li key={i}>
                            <CheckCircle2 size={15} className="inc-tick" />
                            <span>{inc}</span>
                          </li>
                        ))
                      ) : (
                        <li>Standard Roamly concierge package inclusions apply.</li>
                      )}
                    </ul>
                  </div>

                  <div className="pkg-inc-card">
                    <div className="pkg-inc-header red-header">
                      <XCircle size={18} />
                      <h3>What is Excluded</h3>
                    </div>
                    <ul className="pkg-exc-list">
                      {Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0 ? (
                        pkg.exclusions.map((exc, i) => (
                          <li key={i}>
                            <XCircle size={15} className="exc-cross" />
                            <span>{exc}</span>
                          </li>
                        ))
                      ) : (
                        <li>Personal expenses, optional activities, airfare.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 3: GUIDELINES & CANCELLATION */}
              {activeTab === "policies" && (
                <div className="pkg-policies-tab">
                  <div className="pkg-policy-box">
                    <h4>Important Instructions for Travelers</h4>
                    <ul className="pkg-bullet-list">
                      {Array.isArray(pkg.importantInstructions) && pkg.importantInstructions.length > 0 ? (
                        pkg.importantInstructions.map((ins, i) => <li key={i}>{ins}</li>)
                      ) : (
                        <>
                          <li>Please carry valid government-issued photo IDs (Aadhaar, Passport, or Voter ID).</li>
                          <li>Standard hotel check-in time is 14:00 hrs and check-out is 11:00 hrs.</li>
                          <li>Keep your digital Roamly confirmation handy during airport/railway transfers.</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="pkg-policy-box">
                    <h4>Cancellation & Refund Policy</h4>
                    <ul className="pkg-bullet-list">
                      {Array.isArray(pkg.cancellationPolicy) && pkg.cancellationPolicy.length > 0 ? (
                        pkg.cancellationPolicy.map((pol, i) => <li key={i}>{pol}</li>)
                      ) : (
                        <>
                          <li>100% refund if cancelled at least 15 days before travel start date.</li>
                          <li>50% refund if cancelled between 7 and 14 days before travel start date.</li>
                          <li>Non-refundable if cancelled less than 7 days prior to travel start date.</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="pkg-snapshot-integrity-note">
                    <ShieldCheck size={16} />
                    <span>
                      <strong>Immutable Snapshot Notice:</strong> The terms, inclusions, itinerary, and pricing shown here represent the exact package snapshot locked at your time of booking ({formatDate(pkg.capturedAt || booking.createdAt)}). Any future modifications by Roamly administrators will not alter your booked experience.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 4: PRICING BREAKDOWN */}
              {activeTab === "pricing" && (
                <div className="pkg-pricing-tab">
                  <div className="pkg-pricing-summary-card">
                    <h3>Itemized Fare Breakdown</h3>

                    <div className="pkg-price-row">
                      <span>Package Base Rate (per traveler)</span>
                      <strong>
                        ₹{Number(pkg.pricing?.pricePerPerson || Math.round((details?.totalAmount || booking.estimatedTotal || 0) / (details?.travellers || booking.travellers || 1))).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="pkg-price-row">
                      <span>Number of Travelers Accommodated</span>
                      <strong>× {details?.travellers || booking.travellers || 1}</strong>
                    </div>

                    <div className="pkg-price-row">
                      <span>Accommodations, Private Cab & Meal Inclusions</span>
                      <span className="pkg-badge-free">Covered in Package</span>
                    </div>

                    <div className="pkg-price-row">
                      <span>Concierge & On-Ground Support Fee</span>
                      <span className="pkg-badge-free">Complimentary</span>
                    </div>

                    <div className="pkg-price-divider" />

                    <div className="pkg-price-total-row">
                      <span>Total Trip Amount (INR)</span>
                      <strong className="pkg-total-amount">
                        ₹{Number(details?.totalAmount || booking.estimatedTotal || booking.estimatedBudget || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="pkg-payment-status-box">
                      {details?.paymentStatus === "paid" || booking.paymentStatus === "paid" ? (
                        <div className="payment-cleared-alert">
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>Payment Captured & Verified</strong>
                            <p>This trip is fully paid. Your booking confirmation and hotel vouchers are active.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="payment-pending-alert">
                          <Clock size={18} />
                          <div>
                            <strong>Pending Payment: ₹{Number(details?.totalAmount || booking.estimatedTotal || 0).toLocaleString("en-IN")}</strong>
                            <p>Complete your payment via Razorpay to lock in guaranteed partner reservations.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pkg-modal-footer">
          <div className="pkg-footer-left">
            {onPrintPass && (
              <button
                type="button"
                className="button button-outline pkg-pass-btn"
                onClick={() => onPrintPass(booking)}
              >
                <Printer size={15} /> Print Travel Pass
              </button>
            )}
          </div>

          <div className="pkg-footer-right">
            {details?.paymentStatus !== "paid" &&
              booking.paymentStatus !== "paid" &&
              booking.status !== "cancelled" &&
              booking.status !== "rejected" &&
              onPayNow && (
                <button
                  type="button"
                  className="button button-primary pkg-pay-btn"
                  onClick={() => onPayNow(booking)}
                >
                  <CreditCard size={15} /> Pay with Razorpay (₹{Number(details?.totalAmount || booking.estimatedTotal || 0).toLocaleString("en-IN")})
                </button>
              )}

            <button type="button" className="button button-dark" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
