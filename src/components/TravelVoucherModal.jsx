import React, { useRef, useEffect, useState } from "react";
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Printer,
  Download,
  X,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  Clock,
  Hotel,
  Key
} from "lucide-react";
import { generatePassPdf } from "../utils/generatePassPdf.js";

function formatDate(val) {
  if (!val) return "TBD";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function calculateNights(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = e - s;
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

// Generate simple deterministic SVG QR Code pattern for booking reference
function BookingQrCode({ code = "RMY-TRAVEL", size = 100 }) {
  // Deterministic 8x8 pattern based on characters in code
  const cells = [];
  const chars = code.split("").map((c) => c.charCodeAt(0));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      // Corners always dark for QR locator look
      const isCorner =
        (r < 2 && c < 2) ||
        (r < 2 && c > 5) ||
        (r > 5 && c < 2);
      const isFilled = isCorner || ((chars[(r * 8 + c) % chars.length] + r * 7 + c * 13) % 2 === 0);
      if (isFilled) {
        cells.push({ x: c * 12.5, y: r * 12.5 });
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="voucher-qr-svg"
      role="img"
      aria-label={`QR code for ${code}`}
    >
      <rect width="100" height="100" fill="#ffffff" rx="4" />
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.x}
          y={cell.y}
          width="11"
          height="11"
          fill="#1b4332"
          rx="1.5"
        />
      ))}
    </svg>
  );
}

export default function TravelVoucherModal({ booking, onClose }) {
  const printAreaRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll while modal is visible
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!booking) return null;

  const isConfirmed = booking.status === "confirmed";
  const refCode = booking.bookingReference || booking.booking_reference || `RMY-${booking.id}`;
  const destName = booking.destinationName || booking.destination_name_snapshot || "Roamly Destination";
  const destLoc = booking.destinationState || booking.destinationCountry || "India";
  const nights = calculateNights(booking.startDate, booking.endDate);
  const guestName = booking.contactName || booking.userName || "Valued Traveler";
  const guestEmail = booking.contactEmail || booking.userEmail || "traveler@roamly.com";
  const guestPhone = booking.contactPhone || "+91 Concierge Verified";
  const budgetVal = Number(booking.estimatedBudget || booking.estimatedTotal || 0);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      generatePassPdf(booking);
    } catch (err) {
      console.error("Failed to generate pass PDF:", err);
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="roamly-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-topbar-heading"
    >
      <div
        className="voucher-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL ACTIONS BAR (Hidden when printing) */}
        <div className="voucher-modal-topbar no-print">
          <div className="voucher-topbar-title" id="voucher-topbar-heading">
            <Sparkles size={18} color="#d97706" />
            <span>Official Roamly Travel Voucher</span>
          </div>

          <div className="voucher-topbar-actions">
            <button
              type="button"
              className="voucher-download-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
              title="Download official booking pass as PDF document"
            >
              <Download size={16} />
              <span>{downloading ? "Preparing PDF..." : "Download Pass"}</span>
            </button>

            <button
              type="button"
              className="voucher-print-btn"
              onClick={handlePrint}
              title="Print booking pass cleanly on A4 paper"
            >
              <Printer size={16} />
              <span>Print Pass</span>
            </button>

            <button
              type="button"
              className="voucher-close-btn"
              onClick={onClose}
              aria-label="Close voucher"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER BOARDING PASS */}
        <div className="voucher-pass-wrapper" ref={printAreaRef}>
          {/* HEADER BRANDING */}
          <div className="voucher-header">
            <div className="voucher-brand">
              <div className="voucher-brand-icon">
                <Compass size={22} color="#ffffff" />
              </div>
              <div>
                <h2>
                  roamly<span className="brand-dot">.</span>
                </h2>
                <small>CONCIERGE TRAVEL PASS & RESERVATION VOUCHER</small>
              </div>
            </div>

            <div className="voucher-status-stamp">
              {isConfirmed ? (
                <div className="stamp-badge confirmed">
                  <CheckCircle2 size={16} />
                  <span>OFFICIALLY CONFIRMED</span>
                </div>
              ) : (
                <div className="stamp-badge pending">
                  <Clock size={16} />
                  <span>RESERVATION PENDING</span>
                </div>
              )}
            </div>
          </div>

          {/* MAIN BOARDING PASS BODY */}
          <div className="voucher-body">
            {/* LEFT MAIN TICKET */}
            <div className="voucher-main-section">
              {/* DESTINATION BANNER */}
              <div
                className="voucher-dest-card"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(14,29,22,0.3) 0%, rgba(14,29,22,0.85) 100%), url("${booking.destinationImage || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'}")`
                }}
              >
                <div className="voucher-dest-info">
                  <span className="voucher-eyebrow">
                    {booking.bookingType === "hotel" || booking.hotelName ? "🏨 BOUTIQUE STAY RESERVATION" : "DESTINATION"}
                  </span>
                  <h3>{booking.hotelName || destName}</h3>
                  <p>
                    <MapPin size={13} /> {booking.hotelLocation || destLoc}
                  </p>
                </div>

                <div className="voucher-code-pill">
                  <span>REF NO.</span>
                  <strong>{refCode}</strong>
                </div>
              </div>

              {/* FLIGHT/TRIP TIMELINE */}
              <div className="voucher-timeline-grid">
                <div className="timeline-item">
                  <span className="timeline-label">START DATE (CHECK-IN)</span>
                  <strong className="timeline-value">{formatDate(booking.startDate)}</strong>
                  <small>Concierge Reception</small>
                </div>

                <div className="timeline-duration">
                  <div className="duration-pill">
                    <span>{nights} NIGHTS</span>
                  </div>
                  <div className="duration-line" />
                </div>

                <div className="timeline-item">
                  <span className="timeline-label">END DATE (CHECK-OUT)</span>
                  <strong className="timeline-value">{formatDate(booking.endDate)}</strong>
                  <small>Until 11:00 AM</small>
                </div>
              </div>

              {/* PASSENGER & PARTY DETAILS */}
              <div className="voucher-passenger-grid">
                {(booking.bookingType === "hotel" || booking.hotelName) && (
                  <>
                    <div className="pass-field" style={{ gridColumn: "1 / -1", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px" }}>
                      <span className="field-label" style={{ color: "#166534" }}>VERIFIED PROPERTY & HOTEL</span>
                      <strong className="field-value" style={{ color: "#166534", fontSize: "15px" }}>
                        🏨 {booking.hotelName} ({booking.hotelLocation || destLoc})
                      </strong>
                    </div>

                    <div className="pass-field">
                      <span className="field-label">ROOM & SUITE TYPE</span>
                      <strong className="field-value">{booking.roomType || "Standard Suite"}</strong>
                    </div>

                    <div className="pass-field" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "6px 12px", borderRadius: "8px" }}>
                      <span className="field-label" style={{ color: "#065f46" }}>ASSIGNED ROOM NUMBER</span>
                      <strong className="field-value" style={{ color: "#047857", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
                        <Key size={14} /> {booking.roomNumber || "Assigned on Arrival"}
                      </strong>
                    </div>
                  </>
                )}

                <div className="pass-field">
                  <span className="field-label">PRIMARY TRAVELER</span>
                  <strong className="field-value">{guestName}</strong>
                </div>

                <div className="pass-field">
                  <span className="field-label">PARTY SIZE</span>
                  <strong className="field-value">
                    {booking.travellers || 1} {Number(booking.travellers) === 1 ? "Guest" : "Guests"}
                  </strong>
                </div>

                <div className="pass-field">
                  <span className="field-label">CONTACT EMAIL</span>
                  <span className="field-text">{guestEmail}</span>
                </div>

                <div className="pass-field">
                  <span className="field-label">CONTACT PHONE</span>
                  <span className="field-text">{guestPhone}</span>
                </div>

                {budgetVal > 0 && (
                  <div className="pass-field">
                    <span className="field-label">TOTAL ESTIMATED BUDGET</span>
                    <strong className="field-value amount">
                      ₹{budgetVal.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}

                {booking.confirmedByName && (
                  <div className="pass-field">
                    <span className="field-label">CONCIERGE AGENT</span>
                    <span className="field-text">
                      <ShieldCheck size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      {booking.confirmedByName}
                    </span>
                  </div>
                )}
              </div>

              {/* SPECIAL NOTES */}
              {booking.specialRequests && typeof booking.specialRequests === "string" && (
                <div className="voucher-special-requests">
                  <span className="field-label">TRAVEL NOTES & SPECIAL REQUESTS</span>
                  <p>"{booking.specialRequests}"</p>
                </div>
              )}
            </div>

            {/* TEAR-OFF PERFORATION DIVIDER */}
            <div className="voucher-perforation">
              <div className="perf-circle top" />
              <div className="perf-line" />
              <div className="perf-circle bottom" />
            </div>

            {/* RIGHT STUB / BOARDING PASS SLIP */}
            <div className="voucher-stub-section">
              <div className="stub-header">
                <Compass size={18} color="#1b4332" />
                <span>BOARDING STUB</span>
              </div>

              <div className="stub-qr-box">
                <BookingQrCode code={refCode} size={92} />
                <code className="stub-ref-code">{refCode}</code>
              </div>

              <div className="stub-details">
                <div className="stub-item">
                  <small>GUEST</small>
                  <strong>{guestName.split(" ")[0]}</strong>
                </div>

                <div className="stub-item">
                  <small>{booking.bookingType === "hotel" || booking.hotelName ? "HOTEL" : "DESTINATION"}</small>
                  <strong title={booking.hotelName || destName}>
                    {(booking.hotelName || destName).slice(0, 16)}{(booking.hotelName || destName).length > 16 ? "..." : ""}
                  </strong>
                </div>

                {(booking.bookingType === "hotel" || booking.hotelName) && (
                  <div className="stub-item" style={{ background: "#ecfdf5", padding: "3px 6px", borderRadius: "4px" }}>
                    <small style={{ color: "#065f46" }}>ROOM #</small>
                    <strong style={{ color: "#047857" }}>{booking.roomNumber || "TBD"}</strong>
                  </div>
                )}

                <div className="stub-item">
                  <small>DATES</small>
                  <span>{formatDate(booking.startDate)}</span>
                </div>

                <div className="stub-item">
                  <small>STATUS</small>
                  <span className={`stub-status ${booking.status}`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="stub-seal">
                <ShieldCheck size={14} color="#10b981" />
                <span>ROAMLY VERIFIED</span>
              </div>
            </div>
          </div>

          {/* VOUCHER FOOTER INSTRUCTIONS */}
          <div className="voucher-footer">
            <div className="voucher-helpline">
              <Phone size={13} />
              <span>Concierge Helpline: +91 800-ROAMLY (Toll-Free 24/7)</span>
            </div>
            <div className="voucher-disclaimer">
              Present this pass or reference code upon arrival. Verified by Roamly Travel Experiences.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
