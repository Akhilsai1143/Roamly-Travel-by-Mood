const pool = require("../config/db");

async function seedPackages() {
  console.log("Starting multi-destination package seeder...");

  // Packages to insert for Goa (id: 14), Ladakh (id: 11), Jaipur (id: 2), Manali (id: 10), Spiti Valley (id: 4)
  const packagesToSeed = [
    {
      destination_id: 14, // Goa
      package_code: "PKG-GOA-ESCAPE",
      name: "Goa Coastal Breeze & Heritage Retreat",
      tagline: "Golden beaches, Old Goa heritage churches, and sunset river cruise",
      tier: "standard",
      description: "Experience the vibrant yet tranquil charm of Goa. From sun-kissed beaches in North Goa to the historic Portuguese quarters of Panaji and relaxing river cruises, this package gives you the perfect beach holiday.",
      duration_days: 4,
      duration_nights: 3,
      accommodation_type: "3-Star Deluxe Beachside Resort",
      meal_plan: "Daily Breakfast & Welcome Tropical Drink",
      transport_type: "AC Coach & Private Sedan Transfers",
      pickup_drop: "Goa Dabolim / Mopa Airport / Madgaon Station",
      inclusions: JSON.stringify([
        "3 Nights Beachside Resort Stay with Swimming Pool",
        "Daily Breakfast Buffet",
        "North Goa Beach & Fort Aguada Sightseeing Tour",
        "Old Goa Heritage Churches & Fontainhas Walking Tour",
        "Mandovi River 1-Hour Sunset Cruise",
        "Airport / Railway Station Transfers"
      ]),
      exclusions: JSON.stringify([
        "Airfare / Train tickets to Goa",
        "Water sports and adventure activities at beaches",
        "Meals other than breakfast",
        "Personal expenses and laundry"
      ]),
      itinerary: JSON.stringify([
        {
          day: 1,
          title: "Arrival in Goa & Beach Sunset",
          description: "Arrive at Goa airport/station and transfer to your resort. Unwind by the pool or stroll along Calangute beach to witness a mesmerizing sunset.",
          activities: ["Airport pickup", "Resort check-in", "Evening beach stroll"]
        },
        {
          day: 2,
          title: "North Goa Heritage & Coastal Forts",
          description: "Visit historic Fort Aguada overlooking the Arabian Sea, Sinquerim Beach, and Anjuna's iconic cliffside viewpoints.",
          activities: ["Fort Aguada tour", "Beach exploration", "Local Goan cafe visit"]
        },
        {
          day: 3,
          title: "Old Goa Latin Quarters & Sunset Cruise",
          description: "Explore the UNESCO-listed Basilica of Bom Jesus, Se Cathedral, and the colorful Portuguese alleys of Fontainhas. In the evening, enjoy a cultural cruise on the Mandovi River.",
          activities: ["Old Goa churches", "Fontainhas photography tour", "Sunset river cruise with folk music"]
        },
        {
          day: 4,
          title: "Farewell Goa",
          description: "Savor a leisurely tropical breakfast before your transfer to the airport or railway station with sun-soaked memories.",
          activities: ["Breakfast", "Souvenir shopping", "Departure transfer"]
        }
      ]),
      important_instructions: "Carry comfortable beachwear, high SPF sunscreen, sunglasses, and a valid photo ID.",
      cancellation_policy: "Free cancellation up to 7 days before check-in date. 50% refund between 3–7 days.",
      price_per_person: 14500.00,
      original_price: 19000.00,
      pricing_type: "per_person",
      max_capacity: 25,
      is_featured: 1,
      status: "active"
    },
    {
      destination_id: 14, // Goa
      package_code: "PKG-GOA-PREMIUM",
      name: "Goa Luxury Beachside & Private Yacht Escape",
      tagline: "5-star beachfront villa, 2-hour private yacht cruise, and curated gourmet seafood",
      tier: "premium",
      description: "Indulge in ultra-luxury coastal living in South Goa. Unwind in private luxury beachfront villas, sail on a private catamaran yacht, and enjoy sunset dining curated by master chefs.",
      duration_days: 5,
      duration_nights: 4,
      accommodation_type: "5-Star Beachfront Luxury Villa Resort",
      meal_plan: "All Gourmet Breakfasts, 2 Chef-Curated Beachside Dinners",
      transport_type: "Private Mercedes / Audi Chauffeur Service",
      pickup_drop: "Goa Airport Private Chauffeur Pickup & Drop",
      inclusions: JSON.stringify([
        "4 Nights 5-Star Luxury Private Pool Villa Stay",
        "2-Hour Private Luxury Catamaran Yacht Charter with Champagne",
        "Daily Gourmet Buffet Breakfast & 2 Candlelight Dinners",
        "Full-Day South Goa Private Heritage & Spice Village Tour",
        "Complimentary 60-min Couple Ayurvedic Spa Session",
        "Dedicated 24/7 Roamly Personal Concierge"
      ]),
      exclusions: JSON.stringify([
        "Domestic / International Flights",
        "Personal bar and premium alcohol tabs",
        "Tips and gratuities"
      ]),
      itinerary: JSON.stringify([
        {
          day: 1,
          title: "VIP Arrival & Beach Villa Check-In",
          description: "Private chauffeur transfer to your 5-star beachfront sanctuary. Welcome champagne and sunset relaxation by your private villa pool.",
          activities: ["Luxury transfer", "Villa check-in", "Sunset cocktail lounge"]
        },
        {
          day: 2,
          title: "Private Yacht Sailing & Coastal Coves",
          description: "Board your private luxury catamaran for a 2-hour private cruise along the Goan coastline, with dolphin spotting and gourmet hors d'oeuvres.",
          activities: ["Private yacht cruise", "Dolphin watching", "Candlelit seafood dinner"]
        },
        {
          day: 3,
          title: "Spice Plantations & Heritage Palaces",
          description: "Chauffeured journey to organic spice plantations for a private tour and traditional earthen-pot lunch, followed by Casa Araujo Alvares heritage manor.",
          activities: ["Spice plantation walking tour", "Heritage mansion visit", "Traditional feast"]
        },
        {
          day: 4,
          title: "Ayurvedic Spa & Serene Beach Day",
          description: "Enjoy a rejuvenating 60-minute couple's spa therapy followed by leisure hours on uncrowded white sand beaches.",
          activities: ["Ayurvedic couple spa", "Beachside cabana relaxation", "Stargazing dinner"]
        },
        {
          day: 5,
          title: "Leisure Morning & VIP Airport Drop",
          description: "Late breakfast on your private patio and luxury chauffeur transfer to Goa Airport.",
          activities: ["Patio breakfast", "Chauffeur airport transfer"]
        }
      ]),
      important_instructions: "Casual luxury and resort-chic attire recommended. Please inform dietary preferences in advance.",
      cancellation_policy: "Free cancellation up to 14 days before arrival. 50% refund up to 7 days.",
      price_per_person: 36000.00,
      original_price: 45000.00,
      pricing_type: "per_person",
      max_capacity: 12,
      is_featured: 1,
      status: "active"
    },
    {
      destination_id: 11, // Ladakh
      package_code: "PKG-LAD-ODYSSEY",
      name: "Ladakh Himalayan Odyssey — High Passes & Pangong Tso",
      tagline: "Khardung La, turquoise Pangong Lake, Diskit Monastery, and Nubra dunes",
      tier: "standard",
      description: "An awe-inspiring expedition into the Trans-Himalayan wonderland of Ladakh. Cross the world's highest motorable passes, camp under starry skies by the cobalt waters of Pangong Tso, and witness the double-humped camels of Hunder.",
      duration_days: 6,
      duration_nights: 5,
      accommodation_type: "Deluxe Leh Hotel & Luxury Tented Camps at Pangong",
      meal_plan: "Daily Breakfast & Warm Himalayan Dinners",
      transport_type: "Private Oxygen-Fitted 4x4 SUV (Innova / Scorpio)",
      pickup_drop: "Leh Kushok Bakula Rimpochee Airport Pickup & Drop",
      inclusions: JSON.stringify([
        "3 Nights Deluxe Hotel in Leh, 1 Night Nubra Camp, 1 Night Pangong Camp",
        "Daily Breakfast and Hearty Himalayan Dinners",
        "Private Oxygen-Equipped SUV for all transfers and excursions",
        "Inner Line Permits and Wildlife / Environmental Fees",
        "Visit to Khardung La (17,982 ft), Pangong Tso, and Nubra Valley",
        "Experienced Mountain Driver-Guide"
      ]),
      exclusions: JSON.stringify([
        "Airfare to and from Leh",
        "Bactrian Camel ride fees in Hunder",
        "Personal mountain gear, medicines, and altitude emergency expenses"
      ]),
      itinerary: JSON.stringify([
        {
          day: 1,
          title: "Leh Arrival & Mandatory Acclimatization",
          description: "Arrive at Leh airport (11,500 ft). Transfer to hotel for mandatory full-day rest to adjust to the thin mountain air. Gentle evening visit to Leh Market.",
          activities: ["Airport pickup", "Hotel check-in", "Acclimatization rest", "Leh Main Bazaar stroll"]
        },
        {
          day: 2,
          title: "Indus Valley Monasteries & Shanti Stupa",
          description: "Visit the iconic white-domed Shanti Stupa for panoramic valley views, followed by 14th-century Thiksey Monastery and Shey Palace.",
          activities: ["Shanti Stupa sunset", "Thiksey Monastery morning prayers", "Shey Palace"]
        },
        {
          day: 3,
          title: "Khardung La to Nubra Valley Sand Dunes",
          description: "Drive across Khardung La Pass (17,982 ft) into the dramatic Nubra Valley. Visit the giant Maitreya Buddha statue at Diskit and the cold desert dunes of Hunder.",
          activities: ["Khardung La summit photo", "Diskit Monastery", "Hunder sand dunes camel ride"]
        },
        {
          day: 4,
          title: "Nubra Valley to Mesmerizing Pangong Tso",
          description: "Journey along the wild Shyok River route to the world-renowned Pangong Tso Lake (14,270 ft). Witness the water shifting through shades of blue and emerald.",
          activities: ["Shyok river drive", "Pangong Lake arrival", "Stargazing at campsite"]
        },
        {
          day: 5,
          title: "Pangong Sunrise & Return to Leh via Chang La",
          description: "Catch a breathtaking sunrise over Pangong Lake before traversing Chang La pass back to Leh for a celebratory farewell evening.",
          activities: ["Sunrise photography", "Chang La pass crossing", "Farewell dinner in Leh"]
        },
        {
          day: 6,
          title: "Departure from the Land of High Passes",
          description: "Morning transfer to Leh Airport for your return flight with unforgettable memories of the Himalayas.",
          activities: ["Breakfast", "Airport drop-off"]
        }
      ]),
      important_instructions: "Acclimatization is essential. Drink plenty of water and avoid strenuous physical effort on Day 1. Warm layers (down jacket, thermals, gloves) required.",
      cancellation_policy: "Free cancellation up to 15 days before departure date. 50% cancellation fee between 7–15 days.",
      price_per_person: 31500.00,
      original_price: 38000.00,
      pricing_type: "per_person",
      max_capacity: 15,
      is_featured: 1,
      status: "active"
    },
    {
      destination_id: 11, // Ladakh
      package_code: "PKG-LAD-LUXURY",
      name: "Ladakh Royal Sanctuary — Nubra Dunes & High Himalayan Glamping",
      tagline: "Heated luxury glamping domes, private astronomer stargazing, and heated luxury SUV",
      tier: "premium",
      description: "The pinnacle of high-altitude Himalayan luxury. Stay in bespoke heated glamping domes, savor organic farm-to-table cuisine, enjoy private astronomer-led dark sky stargazing, and traverse mountain passes in premium heated 4x4 SUVs.",
      duration_days: 7,
      duration_nights: 6,
      accommodation_type: "Heated Luxury Boutique Resort in Leh & Glamping Domes in Nubra & Pangong",
      meal_plan: "All Organic Gourmet Meals, High-Tea, and Hot Herbal Beverages",
      transport_type: "Private Luxury Toyota Fortuner / Land Cruiser with Satellite Phone",
      pickup_drop: "Private VIP Chauffeur Transfer at Leh Airport",
      inclusions: JSON.stringify([
        "6 Nights in Heated Luxury Heritage Suites & High-Altitude Glamping Domes",
        "All Gourmet Breakfasts, Lunches, and Multi-Course Dinners",
        "Private Luxury SUV with dedicated mountain chauffeur and satellite phone",
        "Private Guided Tour by Ladakhi Cultural Scholar",
        "Professional Telescope Dark-Sky Astronomy Session in Nubra",
        "Excursion to Turtuk (Balti cultural heritage border village)",
        "Inner Line VIP Fast-Track Permits and Oxygen Concentrators in each room"
      ]),
      exclusions: JSON.stringify([
        "Commercial / Chartered Flights to Leh",
        "Personal shopping and souvenirs",
        "Tips for mountain expedition staff"
      ]),
      itinerary: JSON.stringify([
        {
          day: 1,
          title: "VIP Arrival & Acclimatization in Luxury Suite",
          description: "VIP greeting at Leh Airport. Check in to your heated heritage suite equipped with medical-grade oxygen concentrators. Rest and herbal altitude teas.",
          activities: ["VIP pickup", "Suite check-in", "In-room wellness check"]
        },
        {
          day: 2,
          title: "Private Monastery Blessing & Royal Heritage",
          description: "Exclusive morning prayer attendance at Hemis Monastery with private monks' blessing, followed by a private royal lunch at Stok Palace.",
          activities: ["Hemis Monastery VIP tour", "Stok Palace royal museum", "Sunset tea at Shanti Stupa"]
        },
        {
          day: 3,
          title: "Khardung La Crossing to Luxury Nubra Glamping",
          description: "Traverse Khardung La Pass in heated SUV luxury. Check in to bespoke luxury geodesic glamping domes nestled beneath the Karakoram Range.",
          activities: ["Khardung La crossing", "Glamping dome check-in", "Sunset sand dune walk"]
        },
        {
          day: 4,
          title: "Turtuk Village & Balti Cultural Immersion",
          description: "Journey to Turtuk, India's northernmost village, known for organic apricot orchards, Balti cuisine, and ancient wooden mosques.",
          activities: ["Turtuk heritage walk", "Organic apricot tasting", "Private astronomy session under Nubra's billion-star sky"]
        },
        {
          day: 5,
          title: "Nubra to Pangong Luxury Retreat",
          description: "Scenic drive along the Shyok Valley to your exclusive heated luxury camp overlooking the crystal turquoise waters of Pangong Tso.",
          activities: ["Shyok canyon drive", "Pangong private campsite check-in", "Bonfire and Ladakhi folk lore"]
        },
        {
          day: 6,
          title: "Serene Morning at Pangong & Return to Leh",
          description: "Morning meditation by the lake shore. Scenic drive back over Chang La Pass to Leh for a luxury farewell gala dinner.",
          activities: ["Lakeside morning meditation", "Chang La crossing", "Leh farewell gala dinner"]
        },
        {
          day: 7,
          title: "VIP Transfer to Leh Airport",
          description: "Chauffeur transfer to Leh Airport for your return flight.",
          activities: ["Organic breakfast", "VIP airport drop"]
        }
      ]),
      important_instructions: "Premium thermal wear provided on request. Comprehensive medical altitude screening on arrival.",
      cancellation_policy: "Free cancellation up to 21 days before departure. 50% refund up to 10 days.",
      price_per_person: 58000.00,
      original_price: 68000.00,
      pricing_type: "per_person",
      max_capacity: 10,
      is_featured: 1,
      status: "active"
    },
    {
      destination_id: 2, // Jaipur
      package_code: "PKG-JPR-HERITAGE",
      name: "Royal Rajputana Heritage & Palaces Tour",
      tagline: "Amber Fort elephant trails, City Palace, Hawa Mahal, and royal Rajasthani dining",
      tier: "standard",
      description: "Step into the regal splendour of Rajasthan's Pink City. Experience grandiose hilltop forts, intricately carved royal palaces, vibrant bazaars, and traditional folk music under starry desert nights.",
      duration_days: 4,
      duration_nights: 3,
      accommodation_type: "Heritage Haveli Palace Hotel",
      meal_plan: "Daily Breakfast & Authentic Royal Rajasthani Thali Dinner",
      transport_type: "Private AC Sedan Transfers & Sightseeing",
      pickup_drop: "Jaipur International Airport / Jaipur Junction",
      inclusions: JSON.stringify([
        "3 Nights Stay in Authentically Restored Heritage Haveli",
        "Daily Royal Breakfast & 1 Gala Rajasthani Cultural Dinner at Chokhi Dhani",
        "Guided Private Tour of Amber Fort, Nahargarh Fort, and City Palace",
        "Photo-stop at Hawa Mahal & Jal Mahal",
        "Private AC Cab for all city transfers and sightseeing",
        "All Fort and Monument Entrance Passes"
      ]),
      exclusions: JSON.stringify([
        "Airfare / Train tickets to Jaipur",
        "Camera and video permit fees at monuments",
        "Lunches and personal shopping"
      ]),
      itinerary: JSON.stringify([
        {
          day: 1,
          title: "Pink City Arrival & Colorful Bazaars",
          description: "Warm Rajasthani welcome at Jaipur airport/station. Check in to your heritage haveli and explore the Johari and Bapu Bazaars.",
          activities: ["Traditional welcome", "Haveli check-in", "Old City bazaar walk"]
        },
        {
          day: 2,
          title: "Hilltop Forts & Amber Citadel",
          description: "Ascend to the majestic Amber Fort overlooking Maota Lake. Visit Jaigarh Fort (home to the Jaivana cannon) and catch sunset from Nahargarh Fort.",
          activities: ["Amber Fort guided tour", "Nahargarh sunset view", "Jal Mahal photo stop"]
        },
        {
          day: 3,
          title: "City Palace, Jantar Mantar & Cultural Village",
          description: "Explore the City Palace royal residence and UNESCO astronomical observatory Jantar Mantar. In the evening, enjoy Rajasthani folk dances and a traditional feast.",
          activities: ["City Palace museum", "Jantar Mantar", "Chokhi Dhani cultural village evening"]
        },
        {
          day: 4,
          title: "Hawa Mahal & Departure",
          description: "Morning visit to the iconic Wind Palace (Hawa Mahal) and transfer to the airport or railway station.",
          activities: ["Hawa Mahal facade photography", "Departure transfer"]
        }
      ]),
      important_instructions: "Modest attire recommended for temples and royal palaces. Comfortable walking shoes for fort cobblestones.",
      cancellation_policy: "Free cancellation up to 5 days before travel.",
      price_per_person: 16800.00,
      original_price: 21000.00,
      pricing_type: "per_person",
      max_capacity: 20,
      is_featured: 1,
      status: "active"
    },
    {
      destination_id: 10, // Manali
      package_code: "PKG-MNL-ALPINE",
      name: "Manali Alpine Escape & Solang Adventure",
      tagline: "Snow peaks, Atal Tunnel, Solang Valley sports, and cedar forest retreats",
      tier: "comfort",
      description: "Immerse yourself in Himachal Pradesh's snow-capped wonderland. Drive through the engineering marvel of Atal Tunnel, paraglide in Solang Valley, and unwind in pine-scented luxury alpine cottages.",
      duration_days: 5,
      duration_nights: 4,
      accommodation_type: "4-Star Mountain View Alpine Resort",
      meal_plan: "Daily Breakfast Buffet & Hearty Mountain Dinners",
      transport_type: "Private AC Sedan / SUV",
      pickup_drop: "Bhuntar (Kullu) Airport / Chandigarh / Manali Bus Stand",
      inclusions: JSON.stringify([
        "4 Nights in Mountain-View Wooden Chalet Resort",
        "Daily Breakfast and Chef-Prepared Buffet Dinners",
        "Excursion to Atal Tunnel, Sissu (Lahaul Valley), and Solang Valley",
        "Old Manali Cafe Walking Tour & Hadimba Temple Visit",
        "Private Heating in rooms and Evening Campfire with Music",
        "Dedicated Private Sedan for all sightseeing"
      ]),
      exclusions: JSON.stringify([
        "Travel to Chandigarh / Manali",
        "Direct charges for paragliding, zorbing, or skiing in Solang",
        "Personal winter gear rentals"
      ]),
      itinerary: JSON.stringify([
        {
          day: 1,
          title: "Arrival in Manali & Forest Relaxation",
          description: "Arrive in Manali and transfer to your alpine chalet resort with panoramic views of the Pir Panjal range.",
          activities: ["Resort check-in", "Nature walk along Beas River", "Welcome dinner by the fire"]
        },
        {
          day: 2,
          title: "Solang Valley Adventures & Cable Car",
          description: "Full-day thrill in Solang Valley. Enjoy snow activities, paragliding, or the scenic Solang ropeway cable car.",
          activities: ["Solang Valley excursion", "Adventure sports", "Scenic photography"]
        },
        {
          day: 3,
          title: "Atal Tunnel & Sissu Waterfall in Lahaul",
          description: "Cross through the 9.02 km Atal Tunnel beneath Rohtang Pass to witness the stark alpine beauty of Sissu village and frozen waterfalls.",
          activities: ["Atal Tunnel crossing", "Sissu waterfall visit", "Lahaul valley exploration"]
        },
        {
          day: 4,
          title: "Old Manali, Hadimba Temple & Vashisht Springs",
          description: "Visit the 16th-century wooden Hadimba Temple, soak in the natural sulphur springs of Vashisht, and stroll through Old Manali's bohemian cafes.",
          activities: ["Hadimba Temple", "Vashisht hot springs", "Old Manali cafe exploration"]
        },
        {
          day: 5,
          title: "Farewell to the Mountains",
          description: "Leisure breakfast overlooking the pine valley before your departure transfer.",
          activities: ["Breakfast with mountain view", "Souvenir shopping", "Departure transfer"]
        }
      ]),
      important_instructions: "Carry heavy woolens, windproof jackets, and thermal innerwear during winter/spring months.",
      cancellation_policy: "Free cancellation up to 7 days before check-in. 50% refund up to 3 days.",
      price_per_person: 21500.00,
      original_price: 26000.00,
      pricing_type: "per_person",
      max_capacity: 18,
      is_featured: 1,
      status: "active"
    }
  ];

  for (const pkg of packagesToSeed) {
    const [existing] = await pool.query(
      "SELECT id FROM travel_packages WHERE package_code = ?",
      [pkg.package_code]
    );

    if (existing.length > 0) {
      console.log(`Package ${pkg.package_code} already exists. Skipping.`);
      continue;
    }

    const insertSql = `
      INSERT INTO travel_packages (
        destination_id, package_code, name, tagline, tier, description,
        duration_days, duration_nights, accommodation_type, meal_plan,
        transport_type, pickup_drop, inclusions, exclusions, itinerary,
        important_instructions, cancellation_policy, price_per_person,
        original_price, pricing_type, max_capacity, is_featured, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(insertSql, [
      pkg.destination_id,
      pkg.package_code,
      pkg.name,
      pkg.tagline,
      pkg.tier,
      pkg.description,
      pkg.duration_days,
      pkg.duration_nights,
      pkg.accommodation_type,
      pkg.meal_plan,
      pkg.transport_type,
      pkg.pickup_drop,
      pkg.inclusions,
      pkg.exclusions,
      pkg.itinerary,
      pkg.important_instructions,
      pkg.cancellation_policy,
      pkg.price_per_person,
      pkg.original_price,
      pkg.pricing_type,
      pkg.max_capacity,
      pkg.is_featured,
      pkg.status
    ]);

    console.log(`✓ Seeded package: ${pkg.package_code} - ${pkg.name} (₹${pkg.price_per_person})`);
  }

  const [all] = await pool.query(`
    SELECT p.id, p.package_code, p.name, p.tier, p.price_per_person, d.name AS destination_name, d.state AS destination_state
    FROM travel_packages p
    JOIN destinations d ON d.id = p.destination_id
    ORDER BY p.price_per_person ASC
  `);

  console.log("\nALL PACKAGES NOW IN DATABASE:");
  console.table(all);
}

seedPackages()
  .then(() => {
    console.log("Seeding finished successfully.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
