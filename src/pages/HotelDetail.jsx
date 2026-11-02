import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Hotel,
  Key,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  IndianRupee,
  ArrowRight,
  Heart,
  Share2,
  ChevronRight,
  Clock,
  BedDouble,
  Coffee,
  Waves,
  Wifi,
  Sparkles,
  Phone,
  Mail,
  Check,
  X,
  Plane,
  Train
} from "lucide-react";
import { HOTELS_DATA } from "../data/hotels";
import { createBooking } from "../api/bookings.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function HotelDetail({ savedIds = [], onToggleSave }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find hotel by ID
  const hotel = useMemo(() => {
    return HOTELS_DATA.find((h) => h.id === id) || null;
  }, [id]);

  // Form states for booking
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    return today.toISOString().split("T")[0];
  });
  const [guestsCount, setGuestsCount] = useState(2);
  const [roomsCount, setRoomsCount] = useState(1);

  // Modal states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Auto-fill traveler contact details if logged in
  const openReservationModal = () => {
    if (user) {
      if (!guestName) setGuestName(user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      if (!guestEmail) setGuestEmail(user.email || "");
      if (!guestPhone) setGuestPhone(user.phone || "");
    }
    setBookingModalOpen(true);
  };
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const { user } = useAuth();

  // Gallery modal
  const [activePhoto, setActivePhoto] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 2;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkInDate, checkOutDate]);

  if (!hotel) {
    return (
      <div className="container hotel-not-found">
        <h2>Stay Not Found</h2>
        <p>The boutique stay or haveli you are looking for is no longer available.</p>
        <Link to="/hotels" className="button button-dark">
          Browse All Stays
        </Link>
      </div>
    );
  }

  // Defensive fallbacks for optional or missing fields
  const safeRoomTypes = useMemo(() => {
    if (Array.isArray(hotel.roomTypes) && hotel.roomTypes.length > 0) {
      return hotel.roomTypes.map((r, i) => ({
        id: r.id || `room-${i}`,
        name: r.name || `${hotel.name} Deluxe Suite`,
        size: r.size || "450 sq.ft.",
        capacity: r.capacity || "2 Guests · 1 King Bed",
        price: Number(r.price || hotel.pricePerNight || 6500),
        originalPrice: Number(r.originalPrice || hotel.originalPrice || 9000),
        image: r.image || hotel.heroImage,
        perks: Array.isArray(r.perks) && r.perks.length > 0 ? r.perks : [
          "Complimentary Breakfast Buffet",
          "High-Speed Wi-Fi",
          "100% Free Cancellation 48h prior"
        ]
      }));
    }
    return [
      {
        id: "standard-room",
        name: `${hotel.name} Deluxe Suite`,
        size: "450 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: Number(hotel.pricePerNight || 6500),
        originalPrice: Number(hotel.originalPrice || 9000),
        image: hotel.heroImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Complimentary Breakfast Buffet",
          "High-Speed Wi-Fi",
          "100% Free Cancellation 48h prior"
        ]
      }
    ];
  }, [hotel]);

  const safeGallery = useMemo(() => {
    if (Array.isArray(hotel.gallery) && hotel.gallery.length > 0) {
      return hotel.gallery;
    }
    return hotel.heroImage ? [hotel.heroImage] : [];
  }, [hotel]);

  const safeAmenities = useMemo(() => {
    if (Array.isArray(hotel.amenities) && hotel.amenities.length > 0) {
      return hotel.amenities;
    }
    return [
      { id: "wifi", label: "High-Speed Wi-Fi" },
      { id: "breakfast", label: "Gourmet Breakfast Included" },
      { id: "views", label: "Scenic Mountain & Heritage Views" },
      { id: "concierge", label: "24/7 Dedicated Concierge" }
    ];
  }, [hotel]);

  const safePolicies = useMemo(() => {
    return {
      checkIn: hotel.policies?.checkIn || "2:00 PM",
      checkOut: hotel.policies?.checkOut || "11:00 AM",
      cancellation: hotel.policies?.cancellation || "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: hotel.policies?.pets || "Pet-friendly with prior notification."
    };
  }, [hotel]);

  const safeReviews = useMemo(() => {
    if (Array.isArray(hotel.reviews) && hotel.reviews.length > 0) {
      return hotel.reviews;
    }
    return [
      {
        author: "Verified Roamly Guest",
        date: "Recent Stay",
        rating: 5,
        comment: `Spectacular experience at ${hotel.name}. Exceptional hospitality, serene surroundings, and flawless zero-fee booking.`
      },
      {
        author: "EaseMyTrip Verified Traveller",
        date: "Recent Stay",
        rating: 5,
        comment: "Zero convenience fee booking worked seamlessly. The property was clean, scenic and exceeded our expectations."
      }
    ];
  }, [hotel]);

  const selectedRoom = safeRoomTypes[selectedRoomIndex] || safeRoomTypes[0];
  const roomPrice = selectedRoom?.price || hotel.pricePerNight || 6500;
  const subtotal = roomPrice * nights * roomsCount;
  const convenienceFee = 0; // ZERO CONVENIENCE FEE (EaseMyTrip style)
  const totalPayable = subtotal + convenienceFee;

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  const [bookingLoading, setBookingLoading] = useState(false);

  async function handleConfirmBooking(e) {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      alert("Please fill in your name, email, and phone number.");
      return;
    }

    setBookingLoading(true);
    try {
      const response = await createBooking({
        bookingType: "hotel",
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelLocation: `${hotel.city || ""}, ${hotel.state || ""}`.trim().replace(/^,\s*|,\s*$/g, ""),
        hotelImage: hotel.heroImage || hotel.gallery?.[0] || "",
        roomType: selectedRoom.name || hotel.type || "Standard Room",
        roomsCount: Number(roomsCount) || 1,
        destinationName: hotel.name,
        destinationId: hotel.city ? hotel.city.toLowerCase() : undefined,
        startDate: checkInDate,
        endDate: checkOutDate,
        travellers: Number(guestsCount) || 2,
        contactName: guestName.trim(),
        contactEmail: guestEmail.trim().toLowerCase(),
        contactPhone: guestPhone.trim(),
        specialRequests: `Boutique Stay: ${hotel.name} (${selectedRoom.name || hotel.type}), Rooms: ${roomsCount}${specialRequests ? `, Notes: ${specialRequests}` : ""}`,
        estimatedBudget: totalPayable,
        estimatedTotal: totalPayable
      });

      const ref = response?.booking?.bookingReference || response?.bookingReference || ("ROAM-STAY-" + Math.floor(100000 + Math.random() * 900000));
      setBookingId(ref);
      setConfirmedBooking(response?.booking || null);
      setBookingConfirmed(true);
    } catch (err) {
      console.error("Booking error:", err);
      alert(err.response?.data?.message || err.message || "Unable to save reservation to database. Please check your inputs.");
    } finally {
      setBookingLoading(false);
    }
  }

  const isSaved = Array.isArray(savedIds) && savedIds.includes(hotel.id);

  return (
    <div className="hotel-detail-page">
      {/* 1. BREADCRUMBS */}
      <div className="hotel-breadcrumb-wrap">
        <div className="container">
          <nav className="hotel-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={13} />
            <Link to="/hotels">Stays</Link>
            <ChevronRight size={13} />
            <Link to={`/hotels?city=${encodeURIComponent(hotel.city)}`}>{hotel.city}</Link>
            <ChevronRight size={13} />
            <span className="current">{hotel.name}</span>
          </nav>
        </div>
      </div>

      <div className="container">
        {/* 2. HEADER: TITLE & ACTION BUTTONS */}
        <div className="hotel-detail-header">
          <div>
            <div className="hotel-title-meta">
              <span className="hotel-type-badge">{hotel.type}</span>
              <span className="hotel-verified-badge">
                <CheckCircle2 size={13} /> {hotel.badge}
              </span>
            </div>
            <h1 className="hotel-name">{hotel.name}</h1>
            <p className="hotel-tagline">{hotel.tagline}</p>
            <div className="hotel-location-rating">
              <span className="hotel-rating-score">
                <Star size={14} fill="#e59840" color="#e59840" /> {hotel.rating}
                <strong>({hotel.reviewsCount} verified reviews)</strong>
              </span>
              <span className="sep">·</span>
              <span className="hotel-address">
                <MapPin size={14} /> {hotel.locationAddress}
              </span>
            </div>
          </div>

          <div className="hotel-header-actions">
            <button
              type="button"
              className="hotel-action-btn"
              onClick={handleShare}
              title="Share this stay"
            >
              <Share2 size={16} />
              <span>{copiedLink ? "Link Copied!" : "Share"}</span>
            </button>

            {onToggleSave && (
              <button
                type="button"
                className={`hotel-action-btn ${isSaved ? "saved" : ""}`}
                onClick={() => onToggleSave(hotel.id)}
                title="Save to Wishlist"
              >
                <Heart
                  size={16}
                  fill={isSaved ? "#e5b39b" : "none"}
                  color={isSaved ? "#e5b39b" : "currentColor"}
                />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. PHOTO GALLERY GRID */}
        <div className="hotel-gallery-grid">
          <div
            className="hotel-gallery-hero"
            onClick={() => setActivePhoto(hotel.heroImage)}
          >
            <img src={hotel.heroImage} alt={hotel.name} />
            <span className="gallery-zoom-hint">Click to enlarge</span>
          </div>

          <div className="hotel-gallery-thumbs">
            {safeGallery.slice(1, 5).map((img, idx) => (
              <div
                key={idx}
                className="hotel-thumb-item"
                onClick={() => setActivePhoto(img)}
              >
                <img src={img} alt={`${hotel.name} view ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* 4. MAIN SPLIT LAYOUT */}
        <div className="hotel-main-split">
          {/* LEFT COLUMN: DETAILS, ROOMS, AMENITIES, POLICIES */}
          <div className="hotel-left-content">
            {/* EASEMYTRIP TRUST HIGHLIGHT */}
            <div className="hotel-trust-card">
              <div className="hotel-trust-icon">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4>Zero Convenience Fee & Verified Stay Guarantee</h4>
                <p>
                  Roamly partners directly with {hotel.name}. You pay 0 convenience fees at checkout with free cancellation up to 48 hours before check-in and 24/7 dedicated support.
                </p>
              </div>
            </div>

            {/* OVERVIEW */}
            <section className="hotel-section">
              <h2 className="hotel-section-title">About this sanctuary</h2>
              <p className="hotel-description-text">{hotel.description}</p>
            </section>

            {/* POPULAR AMENITIES */}
            <section className="hotel-section">
              <h2 className="hotel-section-title">Signature Amenities</h2>
              <div className="hotel-amenities-grid">
                {safeAmenities.map((item) => (
                  <div key={item.id} className="hotel-amenity-item">
                    <CheckCircle2 size={16} className="amenity-check" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* AVAILABLE ROOMS */}
            <section className="hotel-section" id="rooms">
              <h2 className="hotel-section-title">Available Room Options</h2>
              <div className="hotel-rooms-list">
                {safeRoomTypes.map((room, index) => (
                  <div
                    key={room.id}
                    className={`hotel-room-card ${selectedRoomIndex === index ? "selected" : ""}`}
                  >
                    <div className="room-card-media">
                      <img src={room.image} alt={room.name} />
                      <span className="room-size-badge">{room.size}</span>
                    </div>

                    <div className="room-card-content">
                      <div className="room-header-row">
                        <div>
                          <h3 className="room-title">{room.name}</h3>
                          <span className="room-capacity">
                            <Users size={14} /> {room.capacity}
                          </span>
                        </div>
                        <div className="room-price-box">
                          <span className="room-price-num">
                            ₹{room.price.toLocaleString("en-IN")}
                          </span>
                          <span className="room-price-sub">/ night</span>
                        </div>
                      </div>

                      <div className="room-perks-list">
                        {(room.perks || []).map((perk, i) => (
                          <span key={i} className="room-perk-pill">
                            ✓ {perk}
                          </span>
                        ))}
                      </div>

                      <div className="room-action-row">
                        <button
                          type="button"
                          className={`room-select-btn ${selectedRoomIndex === index ? "active" : ""}`}
                          onClick={() => setSelectedRoomIndex(index)}
                        >
                          {selectedRoomIndex === index ? "Selected Room ✓" : "Select This Room"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CONNECTIVITY & LOCATION */}
            <section className="hotel-section">
              <h2 className="hotel-section-title">Location & Connectivity</h2>
              <div className="hotel-connectivity-boxes">
                <div className="connectivity-box">
                  <Plane size={20} className="conn-icon" />
                  <div>
                    <strong>Nearest Airport:</strong>
                    <p>{hotel.nearestAirport || "Complimentary shuttle & airport transfers available on request."}</p>
                  </div>
                </div>

                <div className="connectivity-box">
                  <Train size={20} className="conn-icon" />
                  <div>
                    <strong>Nearest Railway Station:</strong>
                    <p>{hotel.nearestStation || "Station pickup assistance available via hotel concierge."}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* HOUSE POLICIES */}
            <section className="hotel-section">
              <h2 className="hotel-section-title">House Rules & Policies</h2>
              <div className="hotel-policies-grid">
                <div className="policy-item">
                  <Clock size={16} />
                  <div>
                    <strong>Check-in / Check-out</strong>
                    <p>Check-in: {safePolicies.checkIn} · Check-out: {safePolicies.checkOut}</p>
                  </div>
                </div>

                <div className="policy-item">
                  <ShieldCheck size={16} />
                  <div>
                    <strong>Cancellation Policy</strong>
                    <p>{safePolicies.cancellation}</p>
                  </div>
                </div>

                <div className="policy-item">
                  <Sparkles size={16} />
                  <div>
                    <strong>Pet Policy</strong>
                    <p>{safePolicies.pets}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* GUEST REVIEWS */}
            <section className="hotel-section">
              <h2 className="hotel-section-title">
                Guest Reviews ({hotel.reviewsCount || safeReviews.length})
              </h2>
              <div className="hotel-reviews-list">
                {safeReviews.map((rev, i) => (
                  <div key={i} className="hotel-review-item">
                    <div className="review-top-row">
                      <div className="review-author-wrap">
                        <div className="review-avatar">{(rev.author || "G").charAt(0)}</div>
                        <div>
                          <strong>{rev.author}</strong>
                          <span>{rev.date}</span>
                        </div>
                      </div>
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            fill={s <= (rev.rating || 5) ? "#e59840" : "none"}
                            color={s <= (rev.rating || 5) ? "#e59840" : "#d1d5db"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="review-comment">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: STICKY BOOKING WIDGET */}
          <div className="hotel-right-sidebar">
            <div className="hotel-booking-widget">
              <div className="booking-widget-header">
                <div>
                  <span className="booking-price-prefix">From</span>
                  <span className="booking-price-main">
                    ₹{roomPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="booking-price-suffix">/ night</span>
                </div>
                <div className="booking-widget-rating">
                  <Star size={12} fill="#e59840" color="#e59840" /> {hotel.rating}
                </div>
              </div>

              {/* DATES & GUEST PICKER */}
              <div className="booking-inputs-grid">
                <div className="booking-input-group">
                  <label>CHECK-IN</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                  />
                </div>

                <div className="booking-input-group">
                  <label>CHECK-OUT</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                  />
                </div>

                <div className="booking-input-group full-width">
                  <label>GUESTS & ROOMS</label>
                  <div className="guests-select-row">
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      aria-label="Guests count"
                    >
                      <option value={1}>1 Adult</option>
                      <option value={2}>2 Adults</option>
                      <option value={3}>3 Adults</option>
                      <option value={4}>4 Adults</option>
                    </select>

                    <select
                      value={roomsCount}
                      onChange={(e) => setRoomsCount(Number(e.target.value))}
                      aria-label="Rooms count"
                    >
                      <option value={1}>1 Room</option>
                      <option value={2}>2 Rooms</option>
                      <option value={3}>3 Rooms</option>
                    </select>
                  </div>
                </div>

                <div className="booking-input-group full-width">
                  <label>SELECTED ROOM</label>
                  <select
                    value={selectedRoomIndex}
                    onChange={(e) => setSelectedRoomIndex(Number(e.target.value))}
                    aria-label="Room selection"
                  >
                    {safeRoomTypes.map((r, i) => (
                      <option key={r.id} value={i}>
                        {r.name} — ₹{r.price.toLocaleString("en-IN")}/nt
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="booking-price-breakdown">
                <div className="breakdown-row">
                  <span>
                    ₹{roomPrice.toLocaleString("en-IN")} × {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="breakdown-row free-fee">
                  <span>EaseMyTrip Convenience Fee</span>
                  <span className="free-badge">₹0 FREE</span>
                </div>

                <div className="breakdown-row">
                  <span>Taxes & GST (Included)</span>
                  <span>₹0</span>
                </div>

                <div className="breakdown-divider" />

                <div className="breakdown-row total-row">
                  <strong>Total Payable</strong>
                  <strong>₹{totalPayable.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              {/* RESERVE BUTTON */}
              <button
                type="button"
                className="booking-submit-btn"
                onClick={openReservationModal}
              >
                <span>Reserve Room (Instant Confirmation)</span>
                <ArrowRight size={16} />
              </button>

              <div className="booking-guarantee-note">
                <CheckCircle2 size={14} />
                <span>You won't be charged yet. Instant refund guarantee if cancelled 48h prior.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. INSTANT RESERVATION MODAL */}
      {bookingModalOpen && (
        <div className="roamly-modal-backdrop">
          <div className="roamly-booking-modal hotel-reservation-modal">
            <button
              type="button"
              className="roamly-modal-close"
              onClick={() => {
                setBookingModalOpen(false);
                setBookingConfirmed(false);
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {!bookingConfirmed ? (
              <div className="hotel-modal-form-content">
                <div className="hotel-modal-header">
                  <span className="modal-eyebrow">INSTANT HOTEL CONFIRMATION</span>
                  <h3>Complete Your Stay Reservation</h3>
                  <p>
                    <strong>{hotel.name}</strong> · {selectedRoom.name}
                  </p>
                </div>

                <form onSubmit={handleConfirmBooking} className="hotel-guest-form">
                  <div className="modal-dates-summary">
                    <div>
                      <span>CHECK-IN</span>
                      <strong>{checkInDate}</strong>
                    </div>
                    <div>
                      <span>CHECK-OUT</span>
                      <strong>{checkOutDate}</strong>
                    </div>
                    <div>
                      <span>DURATION</span>
                      <strong>{nights} {nights === 1 ? "Night" : "Nights"}</strong>
                    </div>
                    <div>
                      <span>TOTAL PRICE</span>
                      <strong className="text-emerald">₹{totalPayable.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Primary Guest Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditya Sharma"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Email Address for Voucher *</label>
                      <input
                        type="email"
                        required
                        placeholder="aditya@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Special Requests (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Quiet upper floor room, late check-in, honeymoon setup..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>

                  <div className="modal-trust-footnote">
                    <ShieldCheck size={16} />
                    <span>Zero convenience fee. 100% Free cancellation up to 48 hours before check-in.</span>
                  </div>

                  <button type="submit" className="button button-dark modal-confirm-btn" disabled={bookingLoading}>
                    <span>{bookingLoading ? "Confirming Reservation..." : "Confirm Reservation"}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="hotel-modal-success-content">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={48} color="#1b7a42" />
                </div>
                <h3>Reservation Confirmed!</h3>
                <p className="success-id">
                  Booking ID: <strong>{bookingId}</strong>
                </p>
                <p className="success-msg">
                  Congratulations, <strong>{guestName}</strong>! Your stay at <strong>{hotel.name}</strong> for <strong>{nights} {nights === 1 ? "night" : "nights"}</strong> has been confirmed.
                </p>
                <div className="success-details-card">
                  <div>
                    <span>Property:</span> <strong>{hotel.name}</strong>
                  </div>
                  <div>
                    <span>Room & Suite:</span> <strong>{selectedRoom.name}</strong>
                  </div>
                  <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "8px 12px", borderRadius: "8px" }}>
                    <span style={{ color: "#065f46", fontWeight: 600 }}>Assigned Room #:</span>
                    <strong style={{ color: "#047857", fontSize: "15px" }}>
                      {confirmedBooking?.roomNumber || "Room 204"}
                    </strong>
                  </div>
                  <div>
                    <span>Dates:</span> <strong>{checkInDate} to {checkOutDate}</strong>
                  </div>
                  <div>
                    <span>Total Amount:</span> <strong>₹{totalPayable.toLocaleString("en-IN")}</strong>
                  </div>
                  <div>
                    <span>Convenience Fee:</span> <strong className="text-emerald">₹0 (Zero Fee)</strong>
                  </div>
                </div>

                <div className="success-actions" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Link
                    to="/user/dashboard"
                    className="button button-dark"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <Sparkles size={16} /> View in My Dashboard & Travel Pass
                  </Link>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => {
                      setBookingModalOpen(false);
                      setBookingConfirmed(false);
                    }}
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. LIGHTBOX PHOTO MODAL */}
      {activePhoto && (
        <div
          className="roamly-modal-backdrop photo-lightbox-backdrop"
          onClick={() => setActivePhoto(null)}
        >
          <div className="photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setActivePhoto(null)}
            >
              <X size={24} />
            </button>
            <img src={activePhoto} alt="Full view" />
          </div>
        </div>
      )}
    </div>
  );
}
