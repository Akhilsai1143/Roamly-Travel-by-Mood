import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Calendar,
  Users,
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Clock,
  Compass,
  Printer,
  CreditCard,
  Lock,
  Download,
  Hotel,
  Utensils,
  Car,
  ChevronDown,
  ChevronUp,
  Bed
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { createBooking } from "../api/bookings.js";
import { createPaymentOrder, verifyPayment } from "../api/payments.js";
import { getPublicPackages } from "../api/packages.js";
import { loadRazorpayScript } from "../utils/loadRazorpay.js";
import { destinations as staticDestinations } from "../data/destinations.js";
import TravelVoucherModal from "./TravelVoucherModal.jsx";
import { generatePassPdf } from "../utils/generatePassPdf.js";

// Helper to format date as YYYY-MM-DD for HTML input
function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Add days to date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Curated 3-tier package builder for any destination (Standard, Comfort, Premium)
function getCuratedTiers(dest) {
  if (!dest) return [];
  const rawBudget = dest.budget || dest.price || "12000";
  const match = String(rawBudget).replace(/[,\s]/g, "").match(/₹?(\d+)/);
  const basePrice = match ? parseInt(match[1], 10) : 12000;
  const destName = dest.name || "Destination";
  const codePrefix = destName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "DST";

  return [
    {
      id: `dyn-${dest.id || "dest"}-std`,
      packageCode: `PKG-${codePrefix}-STD`,
      destinationId: dest.id,
      name: `${destName} Explorer — Classic Highlights`,
      tagline: "Essential sightseeing, verified boutique hotel & dedicated cab",
      tier: "standard",
      durationDays: 4,
      durationNights: 3,
      accommodationType: "3-Star Boutique Hotel",
      mealPlan: "Breakfast Included (CP Plan)",
      transportType: "Dedicated AC Sedan",
      pickupDrop: "Designated Airport / Railway Station Transfer",
      pricePerPerson: basePrice,
      originalPrice: Math.round(basePrice * 1.25),
      inclusions: [
        "3 Nights stay in verified boutique hotel on twin sharing",
        "Daily complimentary buffet breakfast",
        "Private AC vehicle for all local transfers & sightseeing",
        "All toll taxes, parking fees, and driver allowances",
        "24/7 dedicated Roamly trip concierge support"
      ],
      exclusions: [
        "Airfare or train tickets to arrival hub",
        "Monument, museum, and activity entry tickets",
        "Personal laundry, room service, and beverage charges"
      ],
      itinerary: [
        { day: 1, title: `Arrival in ${destName} & Check-in`, description: "Chauffeur meet & greet at airport/station, transfer to hotel, check-in, and evening leisure stroll through local bazaar." },
        { day: 2, title: "Iconic Landmarks & Scenic Trails", description: "Guided sightseeing covering primary landmarks, picturesque viewpoint, and artisan craft heritage stores." },
        { day: 3, title: "Culture, Cuisine & Nature Exploration", description: "Explore scenic outskirts, regional cuisine tasting, panoramic sunset point, and relaxation." },
        { day: 4, title: "Farewell & Departure Transfer", description: "Leisurely breakfast, souvenir shopping, and timely chauffeur transfer to airport or railway station." }
      ]
    },
    {
      id: `dyn-${dest.id || "dest"}-comf`,
      packageCode: `PKG-${codePrefix}-COMF`,
      destinationId: dest.id,
      name: `${destName} Comfort Escape — Scenic Valley Retreat`,
      tagline: "Superior 4★ scenic resort, breakfast & dinner, and executive SUV",
      tier: "comfort",
      durationDays: 5,
      durationNights: 4,
      accommodationType: "4-Star Mountain / Lakeside Resort",
      mealPlan: "Breakfast & Dinner Included (MAP Plan)",
      transportType: "Private Innova Crysta / SUV",
      pickupDrop: "Private Airport / Station Chauffeur Transfer",
      pricePerPerson: Math.round(basePrice * 1.55),
      originalPrice: Math.round(basePrice * 1.95),
      inclusions: [
        "4 Nights in premium valley-view or garden-view rooms",
        "Daily buffet breakfast and chef-curated multi-course dinners",
        "Dedicated executive SUV with chilled bottled refreshments",
        "Curated nature walk or boat cruise sightseeing passes",
        "Experienced local storyteller for heritage landmarks",
        "Priority 24/7 concierge assistance throughout"
      ],
      exclusions: [
        "Airfare or train tickets to base destination",
        "Personal purchases, laundry, and mini-bar charges",
        "Optional adventure sports and personal guide gratuities"
      ],
      itinerary: [
        { day: 1, title: "Scenic Arrival & Resort Check-in", description: "Chauffeur meet & greet, scenic drive, welcome refreshments, resort check-in, and welcome dinner." },
        { day: 2, title: "Nature Sanctuary & Hidden Vistas", description: "Guided tour to offbeat nature trails, photography stops, and lunch at authentic regional bistro." },
        { day: 3, title: "Heritage, Craft & Artisan Encounters", description: "Local artisan workshop tour, cultural performance or museum entry, and leisure." },
        { day: 4, title: "Sunset Leisure & Candlelight Dining", description: "Relaxing morning at leisure, scenic viewpoint excursion, and special multi-course dinner." },
        { day: 5, title: "Farewell Departure Hub Drop", description: "Complimentary breakfast and comfortable chauffeur drive back to airport/station." }
      ]
    },
    {
      id: `dyn-${dest.id || "dest"}-prem`,
      packageCode: `PKG-${codePrefix}-PREM`,
      destinationId: dest.id,
      name: `${destName} Premium Experience — Luxury Heritage Sanctuary`,
      tagline: "Ultra-luxury villas, private naturalist, all meals & luxury chauffeur",
      tier: "premium",
      durationDays: 6,
      durationNights: 5,
      accommodationType: "5-Star Heritage Estate / Luxury Villa",
      mealPlan: "All Gourmet Meals Included (Full Board)",
      transportType: "Executive Luxury SUV Chauffeur",
      pickupDrop: "VIP Airport Meet & Chauffeur Transfer",
      pricePerPerson: Math.round(basePrice * 2.3),
      originalPrice: Math.round(basePrice * 2.9),
      inclusions: [
        "5 Nights in private luxury estate or royal palace suite",
        "Chef-curated gourmet dining (Breakfast, Lunch & Dinner)",
        "Executive Mercedes / Innova Hycross private chauffeur service",
        "Complimentary 90-minute signature spa rejuvenation therapy",
        "Private naturalist and personal guide for all excursions",
        "VIP express access to all landmark monuments & sanctuaries"
      ],
      exclusions: [
        "Domestic / International flight tickets",
        "Customized helicopter charters (available on request)"
      ],
      itinerary: [
        { day: 1, title: "VIP Royal Welcome & Palace Check-in", description: "Chauffeured arrival, luxury suite check-in, and chef's bespoke welcome dinner." },
        { day: 2, title: "Private Wildlife or Heritage Immersion", description: "Exclusive naturalist guided morning tour followed by estate high tea." },
        { day: 3, title: "Wellness & Holistic Rejuvenation", description: "Signature spa treatment, meditation/yoga session, and scenic tranquil picnic." },
        { day: 4, title: "Cultural Masterclass & Gourmet Trails", description: "Private cooking masterclass with executive chef and landmark exploration." },
        { day: 5, title: "Sunset Cruise & Farewell Banquet", description: "Scenic champagne sunset view, photography session, and gourmet farewell dinner." },
        { day: 6, title: "VIP Airport Farewell Transfer", description: "Luxury breakfast, gift hamper, and chauffeur drop-off at departure terminal." }
      ]
    }
  ];
}

export default function BookingModal({
  isOpen,
  onClose,
  destination: initialDestination = null,
  packageData = null,
  onBookingSuccess
}) {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Resolved destination object
  const destination = useMemo(() => {
    if (!initialDestination) return staticDestinations[0];
    if (typeof initialDestination === "object" && initialDestination.name) {
      return initialDestination;
    }
    const found = staticDestinations.find(
      (d) =>
        String(d.id).toLowerCase() === String(initialDestination).toLowerCase() ||
        d.name.toLowerCase() === String(initialDestination).toLowerCase()
    );
    return found || staticDestinations[0];
  }, [initialDestination]);

  const [availablePackages, setAvailablePackages] = useState(() => getCuratedTiers(destination));
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(() => packageData || getCuratedTiers(destination)[0] || null);
  const [showItineraryDetails, setShowItineraryDetails] = useState(true);

  // Minimum date is tomorrow
  const minDate = useMemo(() => {
    const tomorrow = addDays(new Date(), 1);
    return toDateString(tomorrow);
  }, []);

  // Default dates: starts in 7 days, ends in 11 days (4 nights)
  const defaultStartDate = useMemo(() => {
    return toDateString(addDays(new Date(), 7));
  }, []);

  const defaultEndDate = useMemo(() => {
    return toDateString(addDays(new Date(), 11));
  }, []);

  // Form states
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [travellers, setTravellers] = useState(2);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);

  // Razorpay payment states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paymentId, setPaymentId] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Sync default user details when user is logged in
  useEffect(() => {
    if (user) {
      setContactName(user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      setContactEmail(user.email || "");
      if (user.phone) setContactPhone(user.phone);
    }
  }, [user]);

  // Reset form and load live packages when modal opens with destination
  useEffect(() => {
    if (isOpen && destination) {
      setError("");
      setSuccessBooking(null);
      setCopiedRef(false);
      setShowVoucher(false);
      setPaymentLoading(false);
      setPaymentStatus("unpaid");
      setPaymentId("");
      setPaymentError("");
      setShowItineraryDetails(true);

      const fallbackTiers = getCuratedTiers(destination);
      setAvailablePackages(fallbackTiers);

      const chosenInitial = packageData || fallbackTiers[0];
      setSelectedPkg(chosenInitial);

      const sDate = toDateString(addDays(new Date(), 7));
      setStartDate(sDate);
      const nNights = chosenInitial?.durationNights || 3;
      setEndDate(toDateString(addDays(new Date(), 7 + nNights)));

      if (user) {
        setContactName(user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim());
        setContactEmail(user.email || "");
        if (user.phone) setContactPhone(user.phone);
      }

      // Fetch live packages from MySQL backend if available
      let isMounted = true;
      async function loadLivePackages() {
        try {
          setPackagesLoading(true);
          const destParam = destination.id || destination.name;
          const res = await getPublicPackages({ destinationId: destParam });
          if (isMounted && res.packages && res.packages.length > 0) {
            // Strictly match packages belonging to the selected destination
            const destMatches = res.packages.filter((p) => {
              if (destination.id && p.destination_id) {
                return Number(p.destination_id) === Number(destination.id) || String(p.destination_id).toLowerCase() === String(destination.id).toLowerCase();
              }
              if (p.destination_name && destination.name) {
                return (
                  p.destination_name.toLowerCase().includes(destination.name.toLowerCase()) ||
                  destination.name.toLowerCase().includes(p.destination_name.toLowerCase())
                );
              }
              return false;
            });

            // Ensure exactly ONE package per tier (Standard, Comfort, Premium)
            const tierMap = new Map();
            destMatches.forEach((p) => {
              const t = (p.tier || "").toLowerCase();
              if (t && !tierMap.has(t)) tierMap.set(t, p);
            });
            fallbackTiers.forEach((fb) => {
              const t = (fb.tier || "").toLowerCase();
              if (t && !tierMap.has(t)) tierMap.set(t, fb);
            });

            const cleanTiers = ["standard", "comfort", "premium"]
              .map((t) => tierMap.get(t))
              .filter(Boolean);

            setAvailablePackages(cleanTiers);
            if (!packageData) {
              const matched = cleanTiers.find((p) => (p.tier || "").toLowerCase() === (chosenInitial?.tier || "").toLowerCase()) || cleanTiers[0];
              setSelectedPkg(matched);
            }
          }
        } catch (err) {
          // Gracefully fallback to curated tiers
        } finally {
          if (isMounted) setPackagesLoading(false);
        }
      }

      loadLivePackages();

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, destination, packageData, user]);

  function handleSelectPackage(pkg) {
    setSelectedPkg(pkg);
    if (startDate && pkg.durationNights) {
      setEndDate(toDateString(addDays(new Date(startDate), pkg.durationNights)));
    }
  }

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Calculate estimated budget (using selected package rate if package is chosen)
  const estimatedCost = useMemo(() => {
    if (selectedPkg && (selectedPkg.pricePerPerson || selectedPkg.price_per_person)) {
      const pkgRate = Number(selectedPkg.pricePerPerson || selectedPkg.price_per_person);
      return pkgRate * (Number(travellers) || 1);
    }
    const rawBudget = destination?.budget || destination?.price;
    if (!rawBudget) return null;
    const match = String(rawBudget).replace(/[,\s]/g, "").match(/₹?(\d+)/);
    const basePerPerson = match ? parseInt(match[1], 10) : 8000;
    const count = Number(travellers) || 1;
    return basePerPerson * count;
  }, [selectedPkg, destination, travellers]);

  // Calculate nights
  const durationNights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isLoggedIn) {
      setError("Please log in to submit your trip booking request.");
      return;
    }

    // Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < today) {
      setError("Start date cannot be in the past.");
      return;
    }

    if (end <= start) {
      setError("End date must be after the start date.");
      return;
    }

    if (travellers < 1 || travellers > 50) {
      setError("Number of travellers must be between 1 and 50.");
      return;
    }

    if (!contactName.trim()) {
      setError("Please provide a contact name.");
      return;
    }

    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      setError("Please provide a valid contact email.");
      return;
    }

    setLoading(true);

    try {
      const response = await createBooking({
        destinationId: destination.id,
        destinationName: destination.name,
        packageId: selectedPkg?.id && !String(selectedPkg.id).startsWith("dyn-") ? selectedPkg.id : null,
        packageName: selectedPkg?.name || null,
        packageTier: selectedPkg?.tier || null,
        packageDetailsSnapshot: selectedPkg || null,
        startDate,
        endDate,
        travellers: Number(travellers),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim() || null,
        specialRequests: specialRequests.trim() || null,
        estimatedBudget: estimatedCost,
        estimatedTotal: estimatedCost
      });

      setSuccessBooking(response.booking || {
        bookingReference: response.bookingReference,
        destinationName: destination.name,
        startDate,
        endDate,
        travellers
      });

      if (typeof onBookingSuccess === "function") {
        onBookingSuccess(response.booking);
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to submit booking request.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayWithRazorpay() {
    if (!successBooking?.id) {
      setPaymentError("Booking information is missing. Please view your trips in Dashboard.");
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout SDK. Please check your internet connection.");
      }

      const orderData = await createPaymentOrder(successBooking.id);

      if (!orderData?.success || !orderData?.orderId) {
        throw new Error(orderData?.message || "Failed to initiate payment order.");
      }

      const { keyId, orderId, amount, currency } = orderData;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "Roamly — Travel by Mood",
        description: `Booking for ${destination.name} (${successBooking.bookingReference})`,
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=256&q=80",
        order_id: orderId,
        prefill: {
          name: contactName || user?.name || "",
          email: contactEmail || user?.email || "",
          contact: contactPhone || user?.phone || ""
        },
        notes: {
          bookingId: String(successBooking.id),
          bookingReference: String(successBooking.bookingReference)
        },
        theme: {
          color: "#1b4332"
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: successBooking.id
            });

            if (verifyResult?.success) {
              setPaymentStatus("paid");
              setPaymentId(response.razorpay_payment_id);
              setSuccessBooking((prev) => ({
                ...prev,
                status: "confirmed",
                paymentStatus: "paid",
                paymentId: response.razorpay_payment_id
              }));
            } else {
              setPaymentError(verifyResult?.message || "Payment verification failed.");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setPaymentError(err.response?.data?.message || err.message || "Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (response) {
        console.warn("Razorpay payment failed:", response.error);
        setPaymentLoading(false);
        setPaymentError(response.error?.description || "Payment failed. Please try again.");
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      setPaymentError(err.response?.data?.message || err.message || "Could not open payment window.");
      setPaymentLoading(false);
    }
  }

  function handleCopyReference(ref) {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  }

  return (
    <div className="roamly-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="roamly-booking-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL CLOSE BUTTON */}
        <button
          type="button"
          className="roamly-modal-close"
          onClick={onClose}
          aria-label="Close booking modal"
        >
          <X size={20} />
        </button>

        {/* SUCCESS STATE */}
        {successBooking ? (
          <div className="booking-success-view">
            <div className="booking-success-icon-wrap">
              <CheckCircle2 size={46} className="success-icon" />
            </div>

            <span className="booking-success-kicker">CONCIERGE REQUEST SUBMITTED</span>
            <h2>Your escape is in motion.</h2>
            <p className="booking-success-subtitle">
              We’ve logged your request for <strong>{destination.name}</strong>.
              Our concierge team is reviewing dates and reservations.
            </p>

            <div className="booking-ref-card">
              <div className="booking-ref-header">
                <Sparkles size={16} />
                <span>OFFICIAL BOOKING REFERENCE</span>
              </div>
              <div className="booking-ref-code-row">
                <span className="booking-ref-code">{successBooking.bookingReference}</span>
                <button
                  type="button"
                  className="copy-ref-btn"
                  onClick={() => handleCopyReference(successBooking.bookingReference)}
                  title="Copy reference code"
                >
                  {copiedRef ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  <span>{copiedRef ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <small>
                Status:{" "}
                {paymentStatus === "paid" ? (
                  <span className="status-pill status-confirmed" style={{ background: "#dcfce7", color: "#166534", fontWeight: 700 }}>
                    Confirmed & Paid
                  </span>
                ) : (
                  <span className="status-pill status-pending">Pending Concierge Review</span>
                )}
              </small>
            </div>

            <div className="booking-success-details-grid">
              <div className="success-detail-item">
                <Calendar size={16} />
                <div>
                  <strong>Travel Dates</strong>
                  <span>{startDate} to {endDate} ({durationNights} nights)</span>
                </div>
              </div>
              <div className="success-detail-item">
                <Users size={16} />
                <div>
                  <strong>Party Size</strong>
                  <span>{travellers} {travellers === 1 ? "Traveler" : "Travelers"}</span>
                </div>
              </div>
              {estimatedCost && (
                <div className="success-detail-item">
                  <Sparkles size={16} />
                  <div>
                    <strong>Estimated Total</strong>
                    <span>₹{estimatedCost.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* RAZORPAY TEST PAYMENT CARD */}
            {paymentStatus === "paid" ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px", margin: "16px 0", display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}>
                <ShieldCheck size={28} color="#16a34a" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, color: "#166534", fontSize: "0.95rem", fontWeight: 700 }}>Payment Confirmed (Razorpay Test Mode)</h4>
                  <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#15803d" }}>Transaction ID: <code>{paymentId}</code>. Your booking is officially secured.</p>
                </div>
              </div>
            ) : (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", margin: "18px 0", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CreditCard size={18} color="#1b4332" />
                    <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>Complete Payment Online</strong>
                  </div>
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "999px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Test Mode</span>
                </div>
                <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Pay securely using Razorpay UPI, Netbanking, or Test Cards to immediately confirm your trip reservations.
                </p>

                {paymentError && (
                  <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", fontSize: "0.82rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{paymentError}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="button button-primary"
                  style={{ width: "100%", justifyContent: "center", gap: "8px", padding: "12px 20px", fontSize: "0.95rem", fontWeight: 600, background: "#1b4332", color: "#ffffff", border: "none", borderRadius: "8px", cursor: paymentLoading ? "not-allowed" : "pointer" }}
                  onClick={handlePayWithRazorpay}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Connecting to Razorpay...
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Pay ₹{(estimatedCost || 0).toLocaleString("en-IN")} via Razorpay
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="booking-success-actions">
              <button
                type="button"
                className="button button-dark"
                onClick={() => {
                  onClose();
                  navigate("/user/dashboard");
                }}
              >
                View in My Trips <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setShowVoucher(true)}
                style={{ borderColor: "#bbf7d0", color: "#166534", background: "#f0fdf4" }}
                title="Preview & print official Roamly travel pass"
              >
                <Printer size={15} /> Travel Pass
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={() => generatePassPdf(successBooking)}
                style={{ borderColor: "#bbf7d0", color: "#166534", background: "#f0fdf4", display: "inline-flex", alignItems: "center", gap: "6px" }}
                title="Download official Roamly travel pass PDF"
              >
                <Download size={15} /> Download Pass
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <div className="booking-form-view">
            {/* DESTINATION PREVIEW BANNER */}
            <div
              className="booking-destination-banner"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(18,29,25,0.4) 0%, rgba(18,29,25,0.85) 100%), url("${destination.image}")`
              }}
            >
              <div className="dest-banner-content">
                <span className="dest-banner-eyebrow">
                  <Compass size={14} /> TRIP BOOKING REQUEST
                </span>
                <h3>{destination.name}</h3>
                <p>
                  <MapPin size={14} /> {destination.state || destination.country}
                </p>
              </div>
              <span className="dest-banner-category">
                {destination.category || "Escape"}
              </span>
            </div>

            {/* 3-TIER TRAVEL PACKAGE SELECTION (STANDARD, COMFORT, PREMIUM) */}
            <div className="booking-modal-package-picker">
              <div className="pkg-picker-header">
                <div className="pkg-picker-title">
                  <Sparkles size={14} className="sparkle-icon" />
                  <span>Select Travel Tier</span>
                </div>
                <span className="pkg-picker-hint">Choose Standard, Comfort, or Premium to tailor your experience</span>
              </div>

              {/* CLEAN 3-SEGMENT TIER SELECTOR */}
              <div className="pkg-tier-segment-bar" role="tablist" aria-label="Select Package Tier">
                {availablePackages.map((pkg, idx) => {
                  const selectedId = selectedPkg?.id || selectedPkg?.packageCode;
                  const currentId = pkg.id || pkg.packageCode;
                  const isSelected = selectedId && currentId
                    ? String(selectedId) === String(currentId)
                    : selectedPkg === pkg ||
                      (selectedPkg?.tier &&
                        pkg?.tier &&
                        String(selectedPkg.tier).toLowerCase() === String(pkg.tier).toLowerCase() &&
                        availablePackages.find(
                          (p) => String(p.tier || "").toLowerCase() === String(selectedPkg.tier).toLowerCase()
                        ) === pkg);
                  const rate = Number(pkg.pricePerPerson || pkg.price_per_person || 0);
                  const tierLabel = pkg.tier ? pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1) : "Tier";

                  return (
                    <button
                      key={pkg.id || pkg.packageCode || `${pkg.tier}-${idx}`}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`pkg-tier-segment-btn tier-${pkg.tier} ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectPackage(pkg)}
                    >
                      <div className="tier-segment-top">
                        <span className="tier-segment-name">{tierLabel}</span>
                        {pkg.tier === "comfort" && <span className="tier-pill-badge pop">★ Popular</span>}
                        {pkg.tier === "premium" && <span className="tier-pill-badge lux">👑 Luxury</span>}
                      </div>

                      <div className="tier-segment-duration">
                        <Clock size={11} /> {pkg.durationDays || 4}D / {pkg.durationNights || 3}N
                      </div>

                      <div className="tier-segment-rate">
                        <strong>₹{rate.toLocaleString("en-IN")}</strong>
                        <small>/person</small>
                      </div>

                      <div className="tier-segment-indicator">
                        {isSelected ? (
                          <span className="indicator-pill selected">
                            <Check size={11} /> Selected
                          </span>
                        ) : (
                          <span className="indicator-pill unselected">
                            Choose
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* SELECTED PACKAGE SHOWCASE & DAY-BY-DAY ITINERARY */}
              {selectedPkg && (
                <div className="pkg-selected-showcase">
                  <div className="pkg-showcase-heading">
                    <div className="pkg-showcase-title-col">
                      <div className="pkg-showcase-tag">
                        <span className={`tag-dot dot-${selectedPkg.tier}`} />
                        {selectedPkg.tier?.toUpperCase()} PACKAGE DETAILS
                      </div>
                      <h4 className="pkg-showcase-title">{selectedPkg.name}</h4>
                    </div>

                    <div className="pkg-showcase-price-tag">
                      {selectedPkg.originalPrice && (
                        <span className="pkg-showcase-orig">
                          ₹{Number(selectedPkg.originalPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                      <div className="pkg-showcase-final-price">
                        <strong>₹{Number(selectedPkg.pricePerPerson || 0).toLocaleString("en-IN")}</strong>
                        <small>/ person</small>
                      </div>
                    </div>
                  </div>

                  {/* HIGHLIGHT INCLUSIONS CHIPS */}
                  <div className="pkg-showcase-chips">
                    <span className="showcase-chip" title="Hotel Tier">
                      <Hotel size={13} />
                      <span>{selectedPkg.accommodationType || "Verified Stay"}</span>
                    </span>
                    <span className="showcase-chip" title="Meal Plan">
                      <Utensils size={13} />
                      <span>{selectedPkg.mealPlan || "Breakfast Included"}</span>
                    </span>
                    <span className="showcase-chip" title="Transit">
                      <Car size={13} />
                      <span>{selectedPkg.transportType || "Private AC Vehicle"}</span>
                    </span>
                    <span className="showcase-chip" title="Pickup / Drop">
                      <Compass size={13} />
                      <span>{selectedPkg.pickupDrop || "Airport / Station Transfers"}</span>
                    </span>
                  </div>

                  {/* ITINERARY COLLAPSIBLE ACCORDION */}
                  <div className="pkg-itinerary-accordion-box">
                    <button
                      type="button"
                      className="pkg-itinerary-accordion-toggle"
                      onClick={() => setShowItineraryDetails(!showItineraryDetails)}
                    >
                      <div className="toggle-left">
                        <Calendar size={14} color="#166534" />
                        <strong>Day-by-Day Itinerary ({selectedPkg.durationDays || 4} Days / {selectedPkg.durationNights || 3} Nights)</strong>
                      </div>
                      <span className="toggle-right">
                        {showItineraryDetails ? "Hide Schedule ▲" : "View Day-by-Day Schedule ▼"}
                      </span>
                    </button>

                    {showItineraryDetails && (
                      <div className="pkg-itinerary-timeline-wrap">
                        {Array.isArray(selectedPkg.itinerary) && selectedPkg.itinerary.length > 0 ? (
                          selectedPkg.itinerary.map((it, idx) => (
                            <div key={idx} className="pkg-timeline-step-row">
                              <div className="pkg-timeline-marker">
                                <span className="day-badge">Day {it.day || idx + 1}</span>
                                {idx < selectedPkg.itinerary.length - 1 && <span className="day-stem" />}
                              </div>
                              <div className="pkg-timeline-content">
                                <h5 className="day-step-title">{it.title}</h5>
                                <p className="day-step-desc">{it.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="pkg-timeline-step-row">
                            <div className="pkg-timeline-marker">
                              <span className="day-badge">Day 1–{selectedPkg.durationDays || 4}</span>
                            </div>
                            <div className="pkg-timeline-content">
                              <h5 className="day-step-title">Curated Sightseeing & Scenic Trails</h5>
                              <p className="day-step-desc">
                                {selectedPkg.description || "Daily scheduled sightseeing, verified stays, and 24/7 dedicated concierge support."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Inclusions list */}
                        {Array.isArray(selectedPkg.inclusions) && selectedPkg.inclusions.length > 0 && (
                          <div className="pkg-inclusions-summary">
                            <strong>Inclusions in {selectedPkg.tier || "this"} tier:</strong>
                            <div className="pkg-inclusions-grid">
                              {selectedPkg.inclusions.map((inc, i) => (
                                <div key={i} className="inc-pill-item">
                                  <Check size={12} color="#16a34a" />
                                  <span>{inc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ERROR NOTIFICATION */}
            {error && (
              <div className="booking-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* AUTH PROMPT IF NOT LOGGED IN */}
            {!isLoggedIn ? (
              <div className="booking-auth-required">
                <div className="auth-req-box">
                  <ShieldCheck size={38} className="auth-req-icon" />
                  <h4>Log in to request this trip</h4>
                  <p>
                    Roamly trip requests are saved to your account so you can track concierge
                    confirmations and manage itineraries seamlessly.
                  </p>
                  <div className="auth-req-buttons">
                    <Link
                      to="/login"
                      className="button button-dark"
                      onClick={onClose}
                    >
                      Sign In to Continue <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/register"
                      className="button button-outline"
                      onClick={onClose}
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTUAL BOOKING FORM */
              <form className="booking-modal-form" onSubmit={handleSubmit}>
                <div className="booking-fields-grid">
                  {/* DATES ROW */}
                  <div className="booking-field-group">
                    <label htmlFor="travelStartDate">
                      <Calendar size={15} /> Travel Start Date *
                    </label>
                    <input
                      id="travelStartDate"
                      type="date"
                      min={minDate}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="booking-field-group">
                    <label htmlFor="travelEndDate">
                      <Calendar size={15} /> Travel End Date *
                    </label>
                    <input
                      id="travelEndDate"
                      type="date"
                      min={startDate || minDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* TRAVELERS COUNT */}
                  <div className="booking-field-group">
                    <label htmlFor="travelersCount">
                      <Users size={15} /> Number of Travelers *
                    </label>
                    <div className="traveler-stepper">
                      <button
                        type="button"
                        onClick={() => setTravellers((prev) => Math.max(1, prev - 1))}
                        disabled={travellers <= 1}
                        aria-label="Decrease travelers"
                      >
                        -
                      </button>
                      <input
                        id="travelersCount"
                        type="number"
                        min="1"
                        max="50"
                        value={travellers}
                        onChange={(e) => setTravellers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setTravellers((prev) => Math.min(50, prev + 1))}
                        aria-label="Increase travelers"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* CONTACT NAME */}
                  <div className="booking-field-group">
                    <label htmlFor="bookingContactName">
                      <User size={15} /> Contact Name *
                    </label>
                    <input
                      id="bookingContactName"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  {/* CONTACT EMAIL */}
                  <div className="booking-field-group">
                    <label htmlFor="bookingContactEmail">
                      <Mail size={15} /> Contact Email *
                    </label>
                    <input
                      id="bookingContactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  {/* CONTACT PHONE */}
                  <div className="booking-field-group">
                    <label htmlFor="bookingContactPhone">
                      <Phone size={15} /> Contact Phone Number
                    </label>
                    <input
                      id="bookingContactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* SPECIAL REQUESTS */}
                <div className="booking-field-group full-width">
                  <label htmlFor="bookingSpecialRequests">
                    <MessageSquare size={15} /> Special Requests or Travel Notes (Optional)
                  </label>
                  <textarea
                    id="bookingSpecialRequests"
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="E.g., Preferred hotel style, celebrating an anniversary, airport pickup inquiry, dietary preferences..."
                    maxLength={2000}
                  />
                  <small className="char-count">{specialRequests.length}/2000</small>
                </div>

                {/* ESTIMATED BUDGET & SUMMARY CALLOUT */}
                <div className="booking-summary-strip">
                  <div className="summary-left">
                    <div className="summary-pill">
                      <Clock size={14} />
                      <span>{durationNights} {durationNights === 1 ? "Night" : "Nights"} stay</span>
                    </div>
                    <div className="summary-pill">
                      <Users size={14} />
                      <span>{travellers} {travellers === 1 ? "Guest" : "Guests"}</span>
                    </div>
                  </div>

                  {estimatedCost && (
                    <div className="summary-right">
                      <span className="summary-estimate-label">Estimated Trip Budget</span>
                      <strong className="summary-estimate-val">
                        ₹{estimatedCost.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="booking-disclaimer">
                  <ShieldCheck size={16} />
                  <span>
                    No advance payment required. Submitting this request sends your itinerary to
                    the Roamly Concierge for availability and rate confirmation.
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="booking-modal-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="button button-dark booking-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="btn-spinner" /> Submitting Request...
                      </>
                    ) : (
                      <>
                        Request Trip Booking <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* OFFICIAL ROAMLY TRAVEL VOUCHER / BOARDING PASS */}
      {showVoucher && successBooking && (
        <TravelVoucherModal
          booking={{
            ...successBooking,
            destinationName: destination.name,
            destinationImage: destination.image,
            destinationState: destination.state,
            destinationCountry: destination.country,
            startDate,
            endDate,
            travellers,
            contactName,
            contactEmail,
            contactPhone,
            specialRequests,
            estimatedBudget: estimatedCost,
            status: "pending"
          }}
          onClose={() => setShowVoucher(false)}
        />
      )}
    </div>
  );
}
