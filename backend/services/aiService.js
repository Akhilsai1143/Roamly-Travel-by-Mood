const { GoogleGenerativeAI } = require("@google/generative-ai");
const travelService = require("./travelRecommendationService");

// Get configured Gemini model or default
function getGeminiModel() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  const modelName = process.env.AI_MODEL || "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  return genAI.getGenerativeModel({ model: modelName });
}

// Build system prompt with instructions and targeted ground-truth MySQL context
function buildPromptContext({ userMessage, history, dbData, user }) {
  const { analysis, packages, destinations, userBookings, highestPackage, lowestPackage, comparedPackages, specificDestination } = dbData;
  const { intent, parameters } = analysis;

  let contextSnippet = `### DETECTED USER INTENT: ${intent}\n`;
  contextSnippet += "### VERIFIED DATABASE CONTEXT (GROUND TRUTH FROM MYSQL):\n";

  if (highestPackage) {
    contextSnippet += `[HIGHEST PRICED PACKAGE IN MYSQL]: Name: "${highestPackage.name}" | Code: ${highestPackage.packageCode} | Price: ₹${highestPackage.pricePerPerson}/person | Tier: ${highestPackage.tier} | Duration: ${highestPackage.durationDays}D/${highestPackage.durationNights}N | Destination: ${highestPackage.destinationName}\n`;
  }

  if (lowestPackage) {
    contextSnippet += `[LOWEST PRICED (CHEAPEST) PACKAGE IN MYSQL]: Name: "${lowestPackage.name}" | Code: ${lowestPackage.packageCode} | Price: ₹${lowestPackage.pricePerPerson}/person | Tier: ${lowestPackage.tier} | Duration: ${lowestPackage.durationDays}D/${lowestPackage.durationNights}N | Destination: ${lowestPackage.destinationName}\n`;
  }

  if (packages && packages.length > 0) {
    contextSnippet += `[VERIFIED PACKAGES FOUND (${packages.length})]:\n`;
    packages.forEach((p, idx) => {
      contextSnippet += `${idx + 1}. Code: ${p.packageCode} | Name: "${p.name}" | Tier: ${p.tier} | Duration: ${p.durationDays}D/${p.durationNights}N | Price: ₹${p.pricePerPerson}/person | Destination: ${p.destinationName}, ${p.destinationState}\n`;
      contextSnippet += `   - Accommodation: ${p.accommodationType} | Transport: ${p.transportType}\n`;
      contextSnippet += `   - Inclusions: ${Array.isArray(p.inclusions) ? p.inclusions.join(", ") : p.inclusions}\n`;
    });
  } else if (intent === "PACKAGE_SEARCH" && parameters.budget) {
    contextSnippet += `[PACKAGES MATCHING BUDGET (Under ₹${parameters.budget})]: NONE found in MySQL. (Cheapest package in database is ₹${lowestPackage?.pricePerPerson || '18,500'}).\n`;
  }

  if (comparedPackages && Object.keys(comparedPackages).length > 0) {
    contextSnippet += `[PACKAGES BY DESTINATION COMPARISON]:\n`;
    for (const [dest, pkgs] of Object.entries(comparedPackages)) {
      if (pkgs.length > 0) {
        contextSnippet += `- ${dest.toUpperCase()}: ${pkgs.length} package(s) found -> ${pkgs.map(p => `"${p.name}" (₹${p.pricePerPerson})`).join(", ")}\n`;
      } else {
        contextSnippet += `- ${dest.toUpperCase()}: 0 packages currently available in MySQL.\n`;
      }
    }
  }

  if (destinations && destinations.length > 0) {
    contextSnippet += `[VERIFIED DESTINATIONS IN MYSQL (${destinations.length})]:\n`;
    destinations.forEach((d, idx) => {
      contextSnippet += `${idx + 1}. ${d.name} (${d.state}, ${d.country}) | Moods: ${d.mood.join(", ")} | Category: ${d.category} | Estimated Budget: ${d.budget} | Ideal Duration: ${d.days} | Best Season: ${d.bestTime}\n`;
      contextSnippet += `   - Highlight: ${d.description.slice(0, 140)}...\n`;
    });
  }

  if (specificDestination) {
    contextSnippet += `[SPECIFIC DESTINATION RECORD (${specificDestination.name})]: State: ${specificDestination.state} | Category: ${specificDestination.category} | Mood: ${specificDestination.mood.join(", ")} | Best Season: ${specificDestination.bestTime} | Typical Budget: ${specificDestination.budget}\n`;
  }

  if (user && userBookings && userBookings.length > 0) {
    contextSnippet += `[USER BOOKINGS FOR ${user.name}]:\n`;
    userBookings.forEach((b, idx) => {
      contextSnippet += `${idx + 1}. Ref: ${b.booking_reference || b.id} | Destination: ${b.destination_name_snapshot} | Package: ${b.package_name_snapshot || 'Custom'} | Dates: ${b.start_date} to ${b.end_date} | Status: ${b.status} | Payment: ${b.payment_status}\n`;
    });
  }

  const systemInstructions = `
You are Aria, the Senior AI Travel Specialist and Mood Curator at Roamly ("Roamly — Travel by Mood").
You are warm, intelligent, precise, and conversational.

STRICT OPERATIONAL RULES:
1. ANSWER THE EXACT QUESTION: Focus solely on what the user asked.
   - If asked for the HIGHEST priced package: State the exact name and price of the highest package from context. Do not dump a generic package list.
   - If asked for the CHEAPEST package: State the exact name and price of the lowest-priced package from context.
   - If user asks about a SPECIFIC DESTINATION (e.g., "i want to visit ladakh", "tell me about goa"): Provide a comprehensive, inspiring guide for THAT destination using the verified details (best season, typical budget, mood, highlights, hidden gems, and local tips). NEVER default or divert to Kerala or unrelated destinations!
   - If asked for packages under a budget and none exist: Honestly say no packages exist in the database under that budget, mention the lowest package price in the database, and suggest budget destinations for independent travel.
   - If asked for DESTINATIONS (e.g. peaceful mountains): Recommend destinations. DO NOT recommend or force travel packages.
   - If asked for WEATHER: Explicitly clarify that live real-time weather feeds are not connected, and provide seasonal climate overview.
   - If user says "Hello" or greetings: Reply with a warm, natural greeting without any package recommendations.
   - If asked to COMPARE packages across places: Compare only what exists in the database context, and honestly state if a destination has no packages.
2. GROUND TRUTH HONESTY: Never invent package names, rates, or bookings. Use only the ground truth provided above.
3. FORMATTING: Use clean GitHub markdown with bold titles, bullet points, and appropriate emojis.
`;

  return { systemInstructions, contextSnippet };
}

// ----------------------------------------------------------------------------
// Intelligent Rule-Based Fallback Engine (Operates directly on MySQL data)
// ----------------------------------------------------------------------------
function generateIntelligentFallback({ userMessage, dbData, user }) {
  const { analysis, packages, destinations, userBookings, highestPackage, lowestPackage, comparedPackages, specificDestination } = dbData;
  const { intent, parameters } = analysis;
  const { budget, duration, destinationMention, destinationsMentioned, moods } = parameters;

  // 1. GENERAL_CHAT (Greetings, identity, pleasantries)
  if (intent === "GENERAL_CHAT") {
    return {
      reply: "Hello! 👋 I am **Aria**, your Roamly AI Travel Specialist.\n\nI can help you discover destinations based on your travel mood, check real package prices, find itineraries, or assist with your travel questions.\n\nHow can I help you plan your journey today?",
      packages: [],
      destinations: [],
      suggestions: [
        "What is the cheapest package?",
        "What is the highest cost in your packages?",
        "I want to visit Ladakh",
        "Show packages in Goa"
      ],
      intent: "GENERAL_CHAT"
    };
  }

  // 2. PACKAGE_PRICE_HIGHEST
  if (intent === "PACKAGE_PRICE_HIGHEST") {
    if (!highestPackage) {
      return {
        reply: "We currently do not have any active travel packages listed in our database.",
        packages: [],
        destinations: [],
        suggestions: ["Suggest destinations", "Create a 3-day itinerary"],
        intent: "PACKAGE_PRICE_HIGHEST"
      };
    }

    const priceFormatted = Number(highestPackage.pricePerPerson).toLocaleString("en-IN");
    let reply = `### 🏷️ Highest Priced Travel Package\n\n`;
    reply += `The highest-priced package in our database is **${highestPackage.name}** at **₹${priceFormatted}** per person.\n\n`;
    reply += `- **Package Code**: \`${highestPackage.packageCode}\`\n`;
    reply += `- **Tier**: \`${highestPackage.tier.toUpperCase()}\` (Luxury Experience)\n`;
    reply += `- **Duration**: ${highestPackage.durationDays} Days / ${highestPackage.durationNights} Nights\n`;
    reply += `- **Destination**: ${highestPackage.destinationName}, ${highestPackage.destinationState}\n`;
    reply += `- **Stay & Travel**: ${highestPackage.accommodationType} • ${highestPackage.transportType}\n`;
    if (highestPackage.inclusions && highestPackage.inclusions.length > 0) {
      reply += `- **Key Inclusions**: ${Array.isArray(highestPackage.inclusions) ? highestPackage.inclusions.slice(0, 3).join(", ") : highestPackage.inclusions}\n\n`;
    }
    reply += `*This package offers an ultra-curated sanctuary escape with private stays, luxury transport, and exclusive experiences.*`;

    return {
      reply,
      packages: [highestPackage],
      destinations: [],
      suggestions: [
        "What is the cheapest package?",
        "Show packages in Ladakh",
        "Show packages in Goa"
      ],
      intent: "PACKAGE_PRICE_HIGHEST"
    };
  }

  // 3. PACKAGE_PRICE_LOWEST
  if (intent === "PACKAGE_PRICE_LOWEST") {
    if (!lowestPackage) {
      return {
        reply: "We currently do not have any active travel packages listed in our database.",
        packages: [],
        destinations: [],
        suggestions: ["Suggest destinations", "Create a 3-day itinerary"],
        intent: "PACKAGE_PRICE_LOWEST"
      };
    }

    const priceFormatted = Number(lowestPackage.pricePerPerson).toLocaleString("en-IN");
    let reply = `### 🏷️ Most Affordable Travel Package\n\n`;
    reply += `The lowest-priced package in our database is **${lowestPackage.name}** at **₹${priceFormatted}** per person.\n\n`;
    reply += `- **Package Code**: \`${lowestPackage.packageCode}\`\n`;
    reply += `- **Tier**: \`${lowestPackage.tier.toUpperCase()}\` (Standard Value)\n`;
    reply += `- **Duration**: ${lowestPackage.durationDays} Days / ${lowestPackage.durationNights} Nights\n`;
    reply += `- **Destination**: ${lowestPackage.destinationName}, ${lowestPackage.destinationState}\n`;
    reply += `- **Stay & Travel**: ${lowestPackage.accommodationType} • ${lowestPackage.transportType}\n`;
    if (lowestPackage.inclusions && lowestPackage.inclusions.length > 0) {
      reply += `- **Key Inclusions**: ${Array.isArray(lowestPackage.inclusions) ? lowestPackage.inclusions.slice(0, 3).join(", ") : lowestPackage.inclusions}\n\n`;
    }
    reply += `*This package is ideal for budget-conscious travellers seeking authentic regional experiences with all essential stays, tours, and transfers included.*`;

    return {
      reply,
      packages: [lowestPackage],
      destinations: [],
      suggestions: [
        "What is the highest cost in your packages?",
        "Show packages in Goa",
        "Show packages in Ladakh"
      ],
      intent: "PACKAGE_PRICE_LOWEST"
    };
  }

  // 4. PACKAGE_SEARCH (Budget-based or destination-based package search)
  if (intent === "PACKAGE_SEARCH") {
    if (packages.length === 0) {
      let reply = `### 🔍 Package Search Results\n\n`;
      if (budget) {
        reply += `We currently do not have any travel packages in our database under **₹${budget.toLocaleString("en-IN")}**.\n\n`;
        const lowestPriceStr = lowestPackage ? `₹${Number(lowestPackage.pricePerPerson).toLocaleString("en-IN")}` : "₹14,500";
        reply += `Our most affordable verified package starts at **${lowestPriceStr}** per person (${lowestPackage ? `**${lowestPackage.name}**` : "Goa Coastal Breeze"}).\n\n`;
        reply += `💡 **Independent Travel Tip**: If your budget is under ₹${budget.toLocaleString("en-IN")}, you can travel independently to budget-friendly destinations such as **Gokarna** (typical budget ₹5,000–₹10,000) or **Jaipur** (typical budget ₹6,000–₹12,000).`;
      } else if (destinationMention) {
        const destTitle = destinationMention.charAt(0).toUpperCase() + destinationMention.slice(1);
        reply += `We currently do not have fixed pre-packaged group tours listed for **${destTitle}** in our catalog.\n\n`;
        if (specificDestination) {
          reply += `However, you can explore **${destTitle}** independently with an estimated budget of **${specificDestination.budget}** (${specificDestination.days}).\n\n`;
          reply += `Would you like me to create a customized day-by-day travel itinerary for **${destTitle}**?`;
        } else {
          reply += `We offer active verified packages across destinations including **Goa** (from ₹14,500), **Jaipur** (from ₹16,800), **Kerala** (from ₹18,500), and **Ladakh** (from ₹31,500).`;
        }
      } else {
        reply += `No packages were found matching your specific search criteria. We have active verified packages starting from **₹${lowestPackage ? Number(lowestPackage.pricePerPerson).toLocaleString("en-IN") : '14,500'}** per person across destinations like **Goa, Jaipur, Kerala, Manali, and Ladakh**.`;
      }

      return {
        reply,
        packages: [],
        destinations: specificDestination ? [specificDestination] : [],
        suggestions: [
          "What is the cheapest package?",
          "Suggest budget destinations",
          "Create a 3-day budget itinerary"
        ],
        intent: "PACKAGE_SEARCH"
      };
    }

    let reply = `### 🌟 Verified Travel Packages Matching Your Search\n\n`;
    if (budget) {
      reply += `Here are our verified packages within your budget of **₹${budget.toLocaleString("en-IN")}**:\n\n`;
    } else if (destinationMention) {
      const destTitle = destinationMention.charAt(0).toUpperCase() + destinationMention.slice(1);
      reply += `Here are our verified travel packages for **${destTitle}**:\n\n`;
    } else {
      reply += `Here are the verified travel packages matching your inquiry:\n\n`;
    }

    packages.forEach(p => {
      reply += `#### 🏷️ ${p.name}\n`;
      reply += `- **Tier**: \`${p.tier.toUpperCase()}\` • **Duration**: ${p.durationDays} Days / ${p.durationNights} Nights\n`;
      reply += `- **Price**: **₹${Number(p.pricePerPerson).toLocaleString("en-IN")}** per person\n`;
      reply += `- **Destination**: ${p.destinationName}, ${p.destinationState}\n`;
      reply += `- **Stay & Travel**: ${p.accommodationType} • ${p.transportType}\n`;
      reply += `- **Includes**: ${Array.isArray(p.inclusions) ? p.inclusions.slice(0, 3).join(", ") : p.inclusions}\n\n`;
    });

    return {
      reply,
      packages,
      destinations: [],
      suggestions: [
        "What is the cheapest package?",
        "What is the highest cost in your packages?",
        "Create an itinerary"
      ],
      intent: "PACKAGE_SEARCH"
    };
  }

  // 5. PACKAGE_COMPARISON
  if (intent === "PACKAGE_COMPARISON") {
    // If comparing destinations like Kerala and Goa
    if (destinationsMentioned && destinationsMentioned.length >= 2) {
      const d1 = destinationsMentioned[0].charAt(0).toUpperCase() + destinationsMentioned[0].slice(1);
      const d2 = destinationsMentioned[1].charAt(0).toUpperCase() + destinationsMentioned[1].slice(1);
      const pkgsD1 = comparedPackages[destinationsMentioned[0]] || [];
      const pkgsD2 = comparedPackages[destinationsMentioned[1]] || [];

      let reply = `### ⚖️ Travel Package Comparison: ${d1} vs. ${d2}\n\n`;

      // Destination 1 summary
      if (pkgsD1.length > 0) {
        reply += `#### 📍 ${d1} Packages (${pkgsD1.length} Available in MySQL)\n`;
        pkgsD1.forEach(p => {
          reply += `- **${p.name}** (\`${p.tier.toUpperCase()}\`): **₹${Number(p.pricePerPerson).toLocaleString("en-IN")}** (${p.durationDays}D/${p.durationNights}N)\n`;
        });
        reply += `\n`;
      } else {
        reply += `#### 📍 ${d1} Packages\n`;
        reply += `- Currently, we have **no active pre-packaged tours for ${d1}** in our database.\n\n`;
      }

      // Destination 2 summary
      if (pkgsD2.length > 0) {
        reply += `#### 📍 ${d2} Packages (${pkgsD2.length} Available in MySQL)\n`;
        pkgsD2.forEach(p => {
          reply += `- **${p.name}** (\`${p.tier.toUpperCase()}\`): **₹${Number(p.pricePerPerson).toLocaleString("en-IN")}** (${p.durationDays}D/${p.durationNights}N)\n`;
        });
        reply += `\n`;
      } else {
        reply += `#### 📍 ${d2} Packages\n`;
        reply += `- Currently, we have **no active pre-packaged tours for ${d2}** in our database.\n\n`;
      }

      reply += `💡 **Recommendation**: You can book one of our verified packages for **${pkgsD1.length > 0 ? d1 : (pkgsD2.length > 0 ? d2 : 'our active destinations')}**, or I can create a custom day-by-day travel itinerary for ${pkgsD1.length === 0 ? d1 : d2}!`;

      return {
        reply,
        packages,
        destinations: [],
        suggestions: [
          `Create a 3-day itinerary for ${d2}`,
          "What is the cheapest package?",
          "Show all packages"
        ],
        intent: "PACKAGE_COMPARISON"
      };
    }

    // Comparing packages within same destination or general comparison
    if (packages.length >= 2) {
      const p1 = packages[0];
      const p2 = packages[1];
      let reply = `### ⚖️ Side-by-Side Package Comparison\n\n`;
      reply += `Comparing **${p1.name}** vs **${p2.name}**:\n\n`;
      reply += `| Feature | **${p1.tier.toUpperCase()} Tier** | **${p2.tier.toUpperCase()} Tier** |\n`;
      reply += `| :--- | :--- | :--- |\n`;
      reply += `| **Price / Person** | **₹${Number(p1.pricePerPerson).toLocaleString("en-IN")}** | **₹${Number(p2.pricePerPerson).toLocaleString("en-IN")}** |\n`;
      reply += `| **Duration** | ${p1.durationDays} Days / ${p1.durationNights} Nights | ${p2.durationDays} Days / ${p2.durationNights} Nights |\n`;
      reply += `| **Destination** | ${p1.destinationName} | ${p2.destinationName} |\n`;
      reply += `| **Accommodation** | ${p1.accommodationType} | ${p2.accommodationType} |\n`;
      reply += `| **Transport** | ${p1.transportType} | ${p2.transportType} |\n`;
      reply += `| **Inclusions** | ${Array.isArray(p1.inclusions) ? p1.inclusions.slice(0, 3).join(", ") : 'Verified'} | ${Array.isArray(p2.inclusions) ? p2.inclusions.slice(0, 3).join(", ") : 'Verified'} |\n\n`;
      reply += `💡 **Recommendation**: Choose the **${p1.tier} tier** for solid essential travel, or step up to **${p2.tier} tier** for enhanced comfort and curated experiences.`;

      return {
        reply,
        packages: [p1, p2],
        destinations: [],
        suggestions: ["Show inclusions", "What is the highest cost package?", "What is the cheapest package?"],
        intent: "PACKAGE_COMPARISON"
      };
    }
  }

  // 6. DESTINATION_RECOMMENDATION & SPECIFIC DESTINATION GUIDE
  if (intent === "DESTINATION_RECOMMENDATION") {
    // If user asked about a specific destination (e.g. "i want to visit ladakh", "tell me about goa")
    if (specificDestination) {
      const d = specificDestination;
      const moodText = Array.isArray(d.mood) ? d.mood.join(" • ") : d.mood;
      let reply = `### 📍 Visiting ${d.name}: Complete Travel Guide\n\n`;
      reply += `**${d.name}** (${d.state}, ${d.country}) is a fantastic destination for **${moodText}**.\n\n`;
      reply += `- **Travel Vibe**: ${moodText}\n`;
      reply += `- **Category**: ${d.category}\n`;
      reply += `- **Best Season to Visit**: **${d.bestTime}**\n`;
      reply += `- **Ideal Trip Duration**: ${d.days}\n`;
      reply += `- **Estimated Budget**: ${d.budget} per person\n`;
      if (d.description) {
        reply += `- **Highlights**: ${d.description}\n`;
      }
      if (d.hiddenGem) {
        reply += `- **Hidden Gem**: *${d.hiddenGem}*\n`;
      }
      if (d.tip) {
        reply += `- **Local Insider Tip**: *${d.tip}*\n`;
      }
      reply += `\n`;

      if (packages && packages.length > 0) {
        reply += `#### 🏷️ Verified Roamly Packages for ${d.name}\n`;
        packages.forEach(p => {
          reply += `- **${p.name}** (\`${p.tier.toUpperCase()}\`): **₹${Number(p.pricePerPerson).toLocaleString("en-IN")}** per person (${p.durationDays}D/${p.durationNights}N)\n`;
        });
        reply += `\n*You can view full details or book directly using the package cards below.*`;
      } else {
        reply += `💡 *We currently curate custom independent travel itineraries for ${d.name}. Would you like me to generate a personalized day-by-day plan or provide packing advice?*`;
      }

      return {
        reply,
        packages: packages || [],
        destinations: [d],
        suggestions: [
          `Create an itinerary for ${d.name}`,
          `What is the best time to visit ${d.name}?`,
          `What should I pack for ${d.name}?`,
          "What is the cheapest package?"
        ],
        intent: "DESTINATION_RECOMMENDATION"
      };
    }

    // General mood-based recommendations
    let reply = `### 🌿 Recommended Destinations for Your Mood\n\n`;
    if (moods.includes("Mountains") && moods.includes("Peace")) {
      reply = `### ⛰️ Peaceful Mountain Escapes for You\n\nHere are handpicked mountain retreats from Roamly's collection known for serenity and nature:\n\n`;
    } else if (moods.length > 0) {
      reply = `### 🌿 ${moods.join(" & ")} Escapes for You\n\nHere are handpicked destinations matching your mood:\n\n`;
    } else {
      reply = `### 📍 Handpicked Escapes for You\n\nHere are top destinations from our collection:\n\n`;
    }

    destinations.slice(0, 4).forEach((d) => {
      reply += `#### 📍 ${d.name}, ${d.state}\n`;
      reply += `- **Mood**: ${d.mood.join(", ")} • **Category**: ${d.category}\n`;
      reply += `- **Estimated Budget**: ${d.budget} • **Duration**: ${d.days}\n`;
      reply += `- **Best Season**: ${d.bestTime}\n`;
      reply += `- **Highlight**: ${d.description.slice(0, 140)}...\n`;
      if (d.tip) reply += `- **Insider Tip**: *${d.tip}*\n`;
      reply += `\n`;
    });

    reply += `Would you like me to craft a day-by-day itinerary or share travel tips for any of these destinations?`;

    return {
      reply,
      packages: [], // NO packages attached for pure general destination inquiries
      destinations: destinations.slice(0, 4),
      suggestions: [
        "I want to visit Ladakh",
        "Show packages in Goa",
        "What is the cheapest package?"
      ],
      intent: "DESTINATION_RECOMMENDATION"
    };
  }

  // 7. TRAVEL_INFORMATION (Weather, packing, how to reach)
  if (intent === "TRAVEL_INFORMATION") {
    const destTitle = specificDestination ? specificDestination.name : (destinationMention ? destinationMention.charAt(0).toUpperCase() + destinationMention.slice(1) : "this destination");

    if (/weather|climate|temperature|rainfall|rain/i.test(userMessage)) {
      let reply = `### 🌤️ Weather & Climate in ${destTitle}\n\n`;
      reply += `*Note: Live real-time satellite weather feeds are not currently integrated into Roamly. Here is the verified seasonal climate and best time to visit:*\n\n`;
      if (specificDestination) {
        reply += `- **Best Time to Visit**: **${specificDestination.bestTime || "October – March"}**\n`;
        reply += `- **Category**: ${specificDestination.category}\n`;
        if (destTitle.toLowerCase() === "ooty") {
          reply += `- **Summer (March – June)**: Pleasant and sunny, temperatures range between 15°C and 22°C. Ideal for sightseeing.\n`;
          reply += `- **Monsoon (July – September)**: Misty and scenic with frequent showers. Lush green landscapes.\n`;
          reply += `- **Winter (October – February)**: Chilly with morning mist, temperatures dropping to 5°C–12°C. Warm jackets recommended.\n`;
        } else {
          reply += `- **General Climate**: Typically most pleasant during ${specificDestination.bestTime || "winter and spring"}.\n`;
        }
      } else {
        reply += `- **General Advice**: Most hill and coastal regions in India are best visited between October and March when temperatures are mild and rainfall is minimal.\n`;
      }

      return {
        reply,
        packages: [],
        destinations: [],
        suggestions: [
          `Create a 3-day itinerary for ${destTitle}`,
          `What should I pack for ${destTitle}?`,
          "Suggest peaceful mountain destinations"
        ],
        intent: "TRAVEL_INFORMATION"
      };
    }

    // Packing list
    if (/pack|packing/i.test(userMessage)) {
      let reply = `### 🧳 Packing Guide for ${destTitle}\n\n`;
      reply += `- **Clothing**: Breathable layers, comfortable walking/hiking shoes, and a light jacket for evenings.\n`;
      reply += `- **Essentials**: High-SPF sunscreen, sunglasses, personal medication, and power bank.\n`;
      reply += `- **Documents**: Government-issued ID, booking confirmations, and physical cash for local stalls.\n`;

      return {
        reply,
        packages: [],
        destinations: [],
        suggestions: [`Create an itinerary for ${destTitle}`, "Show verified packages"],
        intent: "TRAVEL_INFORMATION"
      };
    }
  }

  // 8. ITINERARY_GENERATION
  if (intent === "ITINERARY_GENERATION") {
    const destName = destinationMention
      ? destinationMention.charAt(0).toUpperCase() + destinationMention.slice(1)
      : (destinations[0]?.name || "Goa");
    const numDays = duration || 3;

    let reply = `### 🗺️ Curated ${numDays}-Day Itinerary for ${destName}\n\n`;
    reply += `*Designed for a balanced blend of exploration, local culture, and relaxing moments.* \n\n`;

    if (destName.toLowerCase() === "goa") {
      reply += `#### 📍 Day 1: North Goa Beaches, Forts & Sunset Vibes\n`;
      reply += `- **Morning**: Arrive, check in to your stay, and head to Aguada Fort for panoramic Arabian Sea views.\n`;
      reply += `- **Afternoon**: Relax at Candolim or Anjuna Beach; enjoy fresh seafood and chilled coconut water.\n`;
      reply += `- **Evening**: Stroll through the local night flea markets and watch the sunset at Vagator Beach.\n\n`;
      reply += `#### 📍 Day 2: Old Goa Heritage, Churches & Spice Plantations\n`;
      reply += `- **Morning**: Explore the historic Basilica of Bom Jesus and Sé Cathedral in Old Goa.\n`;
      reply += `- **Afternoon**: Guided walk through a traditional Sahakari Spice Farm followed by a Goan buffet lunch.\n`;
      reply += `- **Evening**: Sunset river cruise along the scenic Mandovi River with traditional Goan folk performances.\n\n`;
      reply += `#### 📍 Day 3: South Goa Tranquillity & Water Sports\n`;
      reply += `- **Morning**: Head to tranquil Palolem or Benaulim Beach for calm waters and kayaking.\n`;
      reply += `- **Afternoon**: Visit Cabo de Rama Fort or explore Panjim's colourful Latin Quarter (Fontainhas).\n`;
      reply += `- **Evening**: Souvenir shopping in Panjim and departure transfers.\n\n`;
    } else {
      for (let day = 1; day <= numDays; day++) {
        if (day === 1) {
          reply += `#### 📍 Day 1: Arrival, Settling In & Sunset Views\n`;
          reply += `- **Morning**: Check-in at your stay. Unwind with local refreshments.\n`;
          reply += `- **Afternoon**: Explore the town promenade and local viewpoint.\n`;
          reply += `- **Evening**: Traditional dinner and relaxation.\n\n`;
        } else if (day === 2) {
          reply += `#### 📍 Day 2: Nature Trails, Waterfalls & Heritage\n`;
          reply += `- **Morning**: Scenic trails and nature walks.\n`;
          reply += `- **Afternoon**: Local artisan workshops and viewpoints.\n`;
          reply += `- **Evening**: Cultural market stroll.\n\n`;
        } else {
          reply += `#### 📍 Day ${day}: Hidden Gems & Departure\n`;
          reply += `- **Morning**: Sunrise photography and peaceful breakfast.\n`;
          reply += `- **Afternoon**: Souvenir shopping and departure transfers.\n\n`;
        }
      }
    }

    reply += `#### 💡 Practical Travel Tips:\n`;
    reply += `- **Estimated Expenses**: ~₹3,500 – ₹5,500 per day for food, local transport, and sightseeing.\n`;
    reply += `- **Local Commute**: Renting a scooter or booking an auto/taxi is the most convenient way to explore.\n`;

    return {
      reply,
      packages: [], // NO packages forced for pure itinerary requests!
      destinations: [],
      suggestions: [
        `What is the weather like in ${destName}?`,
        `What to pack for ${destName}?`,
        "What is the cheapest package?"
      ],
      intent: "ITINERARY_GENERATION"
    };
  }

  // 9. BOOKING_ASSISTANCE
  if (intent === "BOOKING_ASSISTANCE") {
    if (!user) {
      return {
        reply: "To review your trip reservations and payment statuses, please **log in** to your Roamly account. Your booking records are encrypted and protected for your privacy.",
        packages: [],
        destinations: [],
        suggestions: ["How do I book a trip?", "What is the cheapest package?", "Suggest peaceful mountain destinations"],
        intent: "BOOKING_ASSISTANCE"
      };
    }

    if (!userBookings || userBookings.length === 0) {
      return {
        reply: `Hello **${user.name}**! 👋 You currently don't have any bookings in your Roamly account.\n\nReady to embark on a journey? Explore our handpicked travel packages or destinations to plan your next escape!`,
        packages: [],
        destinations: destinations.slice(0, 3),
        suggestions: ["What is the cheapest package?", "I want to visit Ladakh", "Show packages in Goa"],
        intent: "BOOKING_ASSISTANCE"
      };
    }

    let bookingSummary = `Hello **${user.name}**! Here is the latest status on your Roamly travel reservations:\n\n`;
    userBookings.forEach((b) => {
      bookingSummary += `### 🎫 Booking Ref: \`${b.booking_reference || 'ROAM-' + b.id}\`\n`;
      bookingSummary += `- **Destination**: ${b.destination_name_snapshot}\n`;
      bookingSummary += `- **Package**: ${b.package_name_snapshot || 'Custom Plan'} (${b.package_tier_snapshot || 'Standard'})\n`;
      bookingSummary += `- **Travel Dates**: ${new Date(b.start_date).toLocaleDateString()} to ${new Date(b.end_date).toLocaleDateString()}\n`;
      bookingSummary += `- **Travellers**: ${b.travellers} guest(s)\n`;
      bookingSummary += `- **Total Amount**: ₹${Number(b.estimated_total).toLocaleString('en-IN')}\n`;
      bookingSummary += `- **Booking Status**: \`${b.status.toUpperCase()}\`\n`;
      bookingSummary += `- **Payment Status**: \`${b.payment_status.toUpperCase()}\` ${b.payment_id ? `(ID: ${b.payment_id})` : ''}\n\n`;
    });
    bookingSummary += `You can manage or download your travel voucher anytime from your **User Dashboard**.`;

    return {
      reply: bookingSummary,
      packages: [],
      destinations: [],
      suggestions: ["What should I pack?", "Create an itinerary", "What is the cheapest package?"],
      intent: "BOOKING_ASSISTANCE"
    };
  }

  // Fallback default
  return {
    reply: "I'd be happy to help you with that! Could you specify whether you're looking for destination recommendations, package prices, or a day-by-day itinerary?",
    packages: [],
    destinations: [],
    suggestions: [
      "What is the cheapest package?",
      "What is the highest cost in your packages?",
      "Suggest peaceful mountain destinations"
    ],
    intent: "GENERAL_CHAT"
  };
}

// ----------------------------------------------------------------------------
// Main Export: Generate AI Travel Assistant Response
// ----------------------------------------------------------------------------
async function generateTravelResponse({ message, history = [], user = null }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required.");
  }

  // 1. Gather real MySQL data and detect exact intent
  const dbData = await travelService.getRelevantDatabaseContext(message, user, history);

  // 2. Check if live Gemini model is configured
  const model = getGeminiModel();

  if (!model) {
    // Intelligent rule-based fallback grounded in MySQL data
    return generateIntelligentFallback({ userMessage: message, dbData, user });
  }

  // 3. Build live prompt for Gemini
  try {
    const { systemInstructions, contextSnippet } = buildPromptContext({
      userMessage: message,
      history,
      dbData,
      user
    });

    // Format chat history for Gemini multi-turn conversation
    const formattedHistory = [];
    if (Array.isArray(history)) {
      history.slice(-6).forEach(turn => {
        if (turn.text && typeof turn.text === "string") {
          formattedHistory.push({
            role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
            parts: [{ text: turn.text }]
          });
        }
      });
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.6
      }
    });

    const fullPrompt = `${systemInstructions}\n\n${contextSnippet}\n\nUser Question: "${message}"\n\nProvide your response now following all the rules above:`;

    const result = await chat.sendMessage(fullPrompt);
    const textResponse = result.response.text();

    // Determine whether package/destination cards should be attached based on intent
    let finalPackages = [];
    let finalDestinations = [];

    if (["PACKAGE_SEARCH", "PACKAGE_PRICE_HIGHEST", "PACKAGE_PRICE_LOWEST", "PACKAGE_COMPARISON"].includes(dbData.analysis.intent)) {
      finalPackages = dbData.packages || [];
    }
    if (dbData.analysis.intent === "DESTINATION_RECOMMENDATION") {
      finalDestinations = dbData.destinations || [];
    }

    // Generate contextual quick suggestions
    let suggestions = [];
    if (dbData.analysis.intent === "PACKAGE_PRICE_HIGHEST") {
      suggestions = ["What is the cheapest package?", "Compare all packages", "Show packages under ₹30,000"];
    } else if (dbData.analysis.intent === "PACKAGE_PRICE_LOWEST") {
      suggestions = ["What is the highest cost in your packages?", "Show packages in Goa", "I want to visit Ladakh"];
    } else if (dbData.analysis.intent === "PACKAGE_SEARCH") {
      suggestions = ["What is the cheapest package?", "Suggest budget destinations", "Create an itinerary"];
    } else if (dbData.analysis.intent === "ITINERARY_GENERATION") {
      suggestions = ["What is the weather like?", "What to pack?", "What is the cheapest package?"];
    } else if (dbData.analysis.intent === "DESTINATION_RECOMMENDATION") {
      suggestions = ["Create a 3-day itinerary", "What is the cheapest package?", "What to pack?"];
    } else {
      suggestions = [
        "What is the cheapest package?",
        "What is the highest cost in your packages?",
        "Suggest peaceful mountain destinations",
        "Create a 3-day itinerary for Goa"
      ];
    }

    return {
      reply: textResponse,
      packages: finalPackages,
      destinations: finalDestinations,
      suggestions,
      intent: dbData.analysis.intent
    };
  } catch (error) {
    console.error("aiService: Gemini API error:", error.message);
    // Graceful fallback to guaranteed MySQL ground-truth response
    return generateIntelligentFallback({ userMessage: message, dbData, user });
  }
}

module.exports = {
  generateTravelResponse
};
