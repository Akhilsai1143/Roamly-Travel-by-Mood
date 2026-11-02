/**
 * Roamly Concierge Travel Pass PDF Generator
 * Generates a valid, beautifully formatted PDF 1.4 document client-side without heavy external dependencies.
 * Outputs a downloaded file named: Roamly-Pass-BOOKING_REFERENCE.pdf
 */

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

// Sanitize text for standard PDF literal strings
function escapePdfText(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");
}

/**
 * Generates and triggers download of the official Roamly travel pass PDF
 * @param {Object} booking The booking object from database
 */
export function generatePassPdf(booking) {
  if (!booking) return false;

  const refCode = booking.bookingReference || booking.booking_reference || `RMY-${booking.id}`;
  const destName = booking.destinationName || booking.destination_name_snapshot || "Roamly Destination";
  const isHotel = booking.bookingType === "hotel" || Boolean(booking.hotelName);
  const destLoc = isHotel ? (booking.hotelLocation || booking.destinationState || "India") : (booking.destinationState || booking.destinationCountry || "India");
  const displayTitle = isHotel ? (booking.hotelName || destName) : destName;
  const roomInfo = isHotel ? `${booking.roomType || "Suite"} | Room: ${booking.roomNumber || "Assigned on Check-in"}` : "";
  const nights = calculateNights(booking.startDate, booking.endDate);
  const guestName = booking.contactName || booking.userName || "Valued Traveler";
  const guestEmail = booking.contactEmail || booking.userEmail || "traveler@roamly.com";
  const guestPhone = booking.contactPhone || "+91 Concierge Verified";
  const budgetVal = Number(booking.estimatedBudget || booking.estimatedTotal || 0);
  const isConfirmed = booking.status === "confirmed";
  const isPaid = booking.paymentStatus === "paid";
  const agentName = booking.confirmedByName || "Roamly Central Concierge";

  const statusLabel = isConfirmed ? "CONFIRMED RESERVATION" : "RESERVATION PENDING";
  const paymentLabel = isPaid ? "PAYMENT CAPTURED (PAID)" : "PAYMENT PENDING";

  // Build PDF Content Stream (A4: 595.28 x 841.89 points)
  const streamLines = [
    // 1. Header Emerald Banner (y: 730 to 805)
    "q",
    "0.106 0.263 0.196 rg", // Deep Forest Green #1b4332
    "36 730 523 75 re f",
    "Q",

    // Brand Logo & Subtitle
    "BT",
    "/F2 22 Tf",
    "1 1 1 rg",
    "52 770 Td",
    "(roamly.) Tj",
    "ET",

    "BT",
    "/F1 8 Tf",
    "0.89 0.95 0.91 rg",
    "52 748 Td",
    "(CONCIERGE TRAVEL PASS & RESERVATION VOUCHER) Tj",
    "ET",

    // Status Pill on Header Right
    "q",
    isConfirmed ? "0.133 0.545 0.133 rg" : "0.85 0.55 0.1 rg",
    "390 750 154 26 re f",
    "Q",
    "BT",
    "/F2 8.5 Tf",
    "1 1 1 rg",
    "400 759 Td",
    `(${escapePdfText(statusLabel)}) Tj`,
    "ET",

    // 2. Destination Card (y: 635 to 715)
    "q",
    "0.96 0.98 0.96 rg",
    "36 635 523 80 re f",
    "0.82 0.88 0.83 RG",
    "1 w",
    "36 635 523 80 re S",
    "Q",

    "BT",
    "/F1 8 Tf",
    "0.4 0.48 0.43 rg",
    "52 696 Td",
    `(${isHotel ? "BOUTIQUE STAY RESERVATION" : "DESTINATION"}) Tj`,
    "ET",

    "BT",
    "/F2 15 Tf",
    "0.11 0.26 0.2 rg",
    "52 674 Td",
    `(${escapePdfText(displayTitle)}) Tj`,
    "ET",

    "BT",
    "/F1 9.5 Tf",
    "0.15 0.45 0.25 rg",
    "52 654 Td",
    `(${escapePdfText(isHotel ? (roomInfo + " | " + destLoc) : destLoc)}) Tj`,
    "ET",

    // Ref box on right side of destination card
    "q",
    "1 1 1 rg",
    "410 650 134 48 re f",
    "0.82 0.88 0.83 RG",
    "1 w",
    "410 650 134 48 re S",
    "Q",
    "BT",
    "/F1 7.5 Tf",
    "0.45 0.5 0.47 rg",
    "422 680 Td",
    "(BOOKING REFERENCE) Tj",
    "ET",
    "BT",
    "/F2 12 Tf",
    "0.11 0.26 0.2 rg",
    "422 662 Td",
    `(${escapePdfText(refCode)}) Tj`,
    "ET",

    // 3. Travel Dates Bar (y: 570 to 620)
    "q",
    "0.92 0.95 0.93 rg",
    "36 570 523 50 re f",
    "0.8 0.86 0.82 RG",
    "1 w",
    "36 570 523 50 re S",
    "Q",

    "BT",
    "/F1 8 Tf",
    "0.4 0.48 0.43 rg",
    "52 602 Td",
    "(CHECK-IN / START DATE) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.11 0.26 0.2 rg",
    "52 584 Td",
    `(${escapePdfText(formatDate(booking.startDate))}) Tj`,
    "ET",

    "BT",
    "/F2 9.5 Tf",
    "0.18 0.45 0.32 rg",
    "245 590 Td",
    `(${nights} NIGHTS DURATION) Tj`,
    "ET",

    "BT",
    "/F1 8 Tf",
    "0.4 0.48 0.43 rg",
    "400 602 Td",
    "(CHECK-OUT / END DATE) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.11 0.26 0.2 rg",
    "400 584 Td",
    `(${escapePdfText(formatDate(booking.endDate))}) Tj`,
    "ET",

    // 4. Passenger & Reservation Details Box (y: 390 to 555)
    "q",
    "1 1 1 rg",
    "36 390 523 165 re f",
    "0.85 0.88 0.86 RG",
    "1 w",
    "36 390 523 165 re S",
    "Q",

    // Row 1: Primary Traveler & Party Size
    "BT",
    "/F1 8 Tf",
    "0.45 0.5 0.47 rg",
    "52 532 Td",
    "(PRIMARY TRAVELER) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.15 0.2 0.18 rg",
    "52 516 Td",
    `(${escapePdfText(guestName)}) Tj`,
    "ET",

    "BT",
    "/F1 8 Tf",
    "0.45 0.5 0.47 rg",
    "320 532 Td",
    "(PARTY SIZE / TRAVELERS) Tj",
    "ET",
    "BT",
    "/F2 11 Tf",
    "0.15 0.2 0.18 rg",
    "320 516 Td",
    `(${booking.travellers || 1} Guests) Tj`,
    "ET",

    // Row 2: Contact Email & Contact Phone
    "BT",
    "/F1 8 Tf",
    "0.45 0.5 0.47 rg",
    "52 486 Td",
    "(CONTACT EMAIL) Tj",
    "ET",
    "BT",
    "/F1 10 Tf",
    "0.2 0.25 0.22 rg",
    "52 470 Td",
    `(${escapePdfText(guestEmail)}) Tj`,
    "ET",

    "BT",
    "/F1 8 Tf",
    "0.45 0.5 0.47 rg",
    "320 486 Td",
    "(CONTACT PHONE) Tj",
    "ET",
    "BT",
    "/F1 10 Tf",
    "0.2 0.25 0.22 rg",
    "320 470 Td",
    `(${escapePdfText(guestPhone)}) Tj`,
    "ET",

    // Row 3: Estimated Total & Payment Status
    "BT",
    "/F1 8 Tf",
    "0.45 0.5 0.47 rg",
    "52 440 Td",
    "(ESTIMATED TOTAL BUDGET) Tj",
    "ET",
    "BT",
    "/F2 12 Tf",
    "0.11 0.26 0.2 rg",
    "52 422 Td",
    `(${budgetVal > 0 ? "INR " + budgetVal.toLocaleString("en-IN") : "Complimentary / Custom"}) Tj`,
    "ET",

    "BT",
    "/F1 8 Tf",
    "0.45 0.5 0.47 rg",
    "320 440 Td",
    "(PAYMENT STATUS) Tj",
    "ET",
    "BT",
    "/F2 10.5 Tf",
    isPaid ? "0.08 0.45 0.18 rg" : "0.7 0.4 0.05 rg",
    "320 422 Td",
    `(${escapePdfText(paymentLabel)}) Tj`,
    "ET",

    // Concierge Verification Signoff (y: 396)
    "BT",
    "/F1 8 Tf",
    "0.45 0.5 0.47 rg",
    "52 402 Td",
    `(${escapePdfText("Verified by: " + agentName + " | Pass Valid for Presentation")}) Tj`,
    "ET",

    // 5. Special Requests or Notes Callout (y: 320 to 375)
    booking.specialRequests ? [
      "q",
      "0.98 0.98 0.95 rg",
      "36 320 523 55 re f",
      "0.88 0.88 0.8 RG",
      "1 w",
      "36 320 523 55 re S",
      "Q",
      "BT",
      "/F1 7.5 Tf",
      "0.45 0.48 0.4 rg",
      "52 358 Td",
      "(SPECIAL REQUESTS & TRAVEL NOTES) Tj",
      "ET",
      "BT",
      "/F1 9 Tf",
      "0.2 0.25 0.22 rg",
      "52 338 Td",
      `(${escapePdfText(String(booking.specialRequests).slice(0, 85))}) Tj`,
      "ET"
    ].join("\n") : "",

    // 6. Tear-off perforated divider line (y: 298)
    "q",
    "[4 3] 0 d",
    "0.7 0.75 0.72 RG",
    "1 w",
    "36 298 m 559 298 l S",
    "Q",

    // 7. Security Stub & Verification Stamp (y: 190 to 285)
    "q",
    "0.96 0.98 0.96 rg",
    "36 190 523 95 re f",
    "0.85 0.89 0.86 RG",
    "1 w",
    "36 190 523 95 re S",
    "Q",

    "BT",
    "/F2 9.5 Tf",
    "0.11 0.26 0.2 rg",
    "52 262 Td",
    "(ROAMLY BOARDING STUB & DIGITAL SEAL) Tj",
    "ET",

    "BT",
    "/F1 8.5 Tf",
    "0.35 0.4 0.36 rg",
    "52 244 Td",
    `(${escapePdfText("Security Code: " + refCode + "-SEC")}) Tj`,
    "ET",

    "BT",
    "/F1 8 Tf",
    "0.4 0.45 0.42 rg",
    "52 226 Td",
    `(${escapePdfText("Holder: " + guestName + " | Destination: " + destName)}) Tj`,
    "ET",

    "BT",
    "/F2 8.5 Tf",
    "0.09 0.45 0.2 rg",
    "52 206 Td",
    "(CRYPTOGRAPHICALLY VALIDATED BY ROAMLY TRAVEL PLATFORM) Tj",
    "ET",

    // 8. Concierge Help & Emergency Footer (y: 115 to 175)
    "BT",
    "/F2 8.5 Tf",
    "0.11 0.26 0.2 rg",
    "52 160 Td",
    "(Concierge 24/7 Helpline: +91 800-ROAMLY (Toll-Free) | support@roamly.com) Tj",
    "ET",

    "BT",
    "/F1 7.5 Tf",
    "0.48 0.52 0.5 rg",
    "52 144 Td",
    "(Please present this printed pass or downloaded document at concierge reception upon arrival.) Tj",
    "ET",

    "BT",
    "/F1 7 Tf",
    "0.58 0.62 0.6 rg",
    "52 130 Td",
    `(${escapePdfText("Generated on: " + new Date().toLocaleString("en-IN") + " | Ref: " + refCode)}) Tj`,
    "ET"
  ].filter(Boolean).join("\n");

  const streamBytes = new TextEncoder().encode(streamLines);
  const streamLength = streamBytes.length;

  // Build PDF 1.4 Object Structure
  const objects = [];
  const offsets = [];

  // 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  // 2: Pages
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  // 3: Page (A4: 595.28 x 841.89 pt)
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n"
  );
  // 4: Stream
  objects.push(
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamLines}\nendstream\nendobj\n`
  );
  // 5: Font F1 (Helvetica)
  objects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n"
  );
  // 6: Font F2 (Helvetica-Bold)
  objects.push(
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n"
  );

  let header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  let pdfString = header;
  let currentOffset = new TextEncoder().encode(header).length;

  // Calculate xref offsets
  offsets.push(currentOffset);
  for (let i = 0; i < objects.length; i++) {
    const objBytes = new TextEncoder().encode(objects[i]);
    currentOffset += objBytes.length;
    if (i < objects.length - 1) {
      offsets.push(currentOffset);
    }
  }

  pdfString += objects.join("");

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += String(off).padStart(10, "0") + " 00000 n \n";
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  pdfString += xref + trailer;

  // Create Blob & trigger download
  const blob = new Blob([pdfString], { type: "application/pdf" });
  const downloadUrl = URL.createObjectURL(blob);
  const filename = `Roamly-Pass-${refCode}.pdf`;

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, 200);

  return true;
}
