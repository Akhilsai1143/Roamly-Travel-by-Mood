// Curated Boutique Stays, Heritage Havelis & Mountain Chalets across India
// Inspired by EaseMyTrip "Favourite Places to Stay" verified collection

export const HOTELS_DATA = [
  {
    id: "fateh-garh-udaipur",
    name: "Fateh Garh Heritage Palace",
    tagline: "Hilltop Rajput sanctuary overlooking Lake Pichola and the Aravalli peaks",
    city: "Udaipur",
    state: "Rajasthan",
    country: "India",
    type: "Royal Haveli",
    rating: 4.9,
    reviewsCount: 184,
    pricePerNight: 8500,
    originalPrice: 11500,
    mood: ["Romantic", "Heritage", "Calm", "Luxury"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Perched majestically on the Sisarma ridge overlooking the historic city of Udaipur, Fateh Garh is a pioneer in sustainable heritage conservation. Built with salvaged antique jharokhas, carved pillars, and lime mortar, this sanctuary offers 360-degree panoramic vistas of the Lake Pichola basin and the rolling Aravalli mountain chain. Guests enjoy solar-powered vintage car transfers, starlit terrace dining, and an infinity pool mirroring the Rajasthan skies.",
    locationAddress: "Sisarma, Udaipur, Rajasthan 313001, India",
    nearestAirport: "Maharana Pratap Airport (UDR) — 28 km (45 mins drive)",
    nearestStation: "Udaipur City Railway Station — 7 km (18 mins drive)",
    amenities: [
      { id: "pool", label: "Dual Infinity Pools" },
      { id: "breakfast", label: "Complimentary Royal Breakfast" },
      { id: "wifi", label: "High-Speed Wi-Fi" },
      { id: "spa", label: "Ayurvedic Sanctuary Spa" },
      { id: "dining", label: "Terrace Dining & High Tea" },
      { id: "views", label: "Lake Pichola & Aravalli Views" },
      { id: "parking", label: "Valet & EV Charging" },
      { id: "concierge", label: "24/7 Personal Concierge" }
    ],
    roomTypes: [
      {
        id: "heritage-renaissance",
        name: "Renaissance Lake View Suite",
        size: "460 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 8500,
        originalPrice: 11000,
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Complimentary Chef's Breakfast Buffet",
          "Private Lake Pichola Balcony",
          "Handmade Brass Soaking Tub",
          "100% Free Cancellation 48h prior"
        ]
      },
      {
        id: "mewar-presidential",
        name: "Grand Mewar Palace Suite",
        size: "720 sq.ft.",
        capacity: "3 Guests · 1 Royal Four-Poster Bed",
        price: 13900,
        originalPrice: 17500,
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Breakfast & 4-Course Candlelight Dinner",
          "Dedicated 24/7 Butler Service",
          "Private Jacuzzi Terrace overlooking Palaces",
          "Free Airport Pickup in Vintage Saloon"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pet-friendly with prior notification."
    },
    reviews: [
      {
        author: "Vikramaditya & Rohini",
        date: "October 2026",
        rating: 5,
        comment: "The rooftop view at sunrise with morning prayers echoing from the lakeside ghats is an unforgettable soul-filling experience."
      },
      {
        author: "Meera Sen",
        date: "September 2026",
        rating: 5,
        comment: "Zero convenience fee booking with Roamly worked seamlessly! The property is gorgeous, staff was courteous and food was divine."
      }
    ]
  },
  {
    id: "windermere-estate-munnar",
    name: "Windermere Colonial Estate",
    tagline: "Colonial-era tea planter's bungalow blanketed in misty cardamom and coffee blooms",
    city: "Munnar",
    state: "Kerala",
    country: "India",
    type: "Tea Plantation Stay",
    rating: 4.9,
    reviewsCount: 210,
    pricePerNight: 6800,
    originalPrice: 8900,
    mood: ["Calm", "Nature", "Romantic", "Misty"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Spread across 60 acres of rolling private cardamom and tea hills in Munnar, Windermere Estate marries timeless British colonial architecture with Kerala warm hospitality. Cedar-lined high ceilings, handcrafted terracotta floors, and roaring stone fireplaces create an intimate haven away from urban clutter. Daily guided morning bird walks and artisanal tea tastings are hosted personally by the estate naturalist.",
    locationAddress: "Pothamedu, Munnar, Kerala 685612, India",
    nearestAirport: "Cochin International Airport (COK) — 108 km (3.5 hours scenic drive)",
    nearestStation: "Aluva Railway Station — 112 km (3.5 hours drive)",
    amenities: [
      { id: "tea", label: "Private 60-Acre Tea Plantation" },
      { id: "breakfast", label: "Farm-to-Table Organic Breakfast" },
      { id: "wifi", label: "High-Speed Mountain Wi-Fi" },
      { id: "fire", label: "Stone Fireplace & Reading Nooks" },
      { id: "nature", label: "Daily Guided Plantation Trails" },
      { id: "views", label: "Panoramic Valley & Mist Views" },
      { id: "parking", label: "Free Private Parking" },
      { id: "concierge", label: "Local Excursion Planning" }
    ],
    roomTypes: [
      {
        id: "planters-room",
        name: "Planter's Garden Suite",
        size: "420 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 6800,
        originalPrice: 8900,
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Colonial High-Tea & Fresh Homemade Pastries",
          "Private Verandah overlooking Tea Terraces",
          "Organic Herbal Toiletries",
          "100% Free Cancellation 48h prior"
        ]
      },
      {
        id: "windermere-chalet",
        name: "Valley View Mist Chalet",
        size: "580 sq.ft.",
        capacity: "3 Guests · 1 Four-Poster Bed",
        price: 9400,
        originalPrice: 12000,
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Full Estate Breakfast & Traditional Kerala Dinner",
          "Wood-Burning Fireplace in Bedroom",
          "Private Tea-Tasting Session with Naturalist",
          "Complimentary Guided Trekking Gear"
        ]
      }
    ],
    policies: {
      checkIn: "1:00 PM",
      checkOut: "11:00 AM",
      cancellation: "Free cancellation up to 48 hours before check-in.",
      pets: "Pets permitted in garden cottages."
    },
    reviews: [
      {
        author: "Anoop & Divya",
        date: "October 2026",
        rating: 5,
        comment: "Waking up to clouds rolling through the bedroom balcony while sipping fresh single-estate black tea is pure magic."
      }
    ]
  },
  {
    id: "the-himalayan-chalet-manali",
    name: "The Himalayan Pine Chalet",
    tagline: "Victorian Gothic stone & deodar wood chalet crowned by snow-capped Himalayan peaks",
    city: "Manali",
    state: "Himachal Pradesh",
    country: "India",
    type: "Mountain Retreat",
    rating: 4.8,
    reviewsCount: 156,
    pricePerNight: 5900,
    originalPrice: 8200,
    mood: ["Adventure", "Snow", "Calm", "Cozy"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Nestled quietly amid centuries-old orchards and towering deodars in Old Manali, The Himalayan is premier mountain castle and cottage retreat. Hand-chiseled stones, antique cast iron furnishings, and open hearth fires evoke medieval charm, while offering modern underfloor heating and unobstructed vistas of the Rohtang and Solang glaciers.",
    locationAddress: "Hadimba Road, Manali, Himachal Pradesh 175131, India",
    nearestAirport: "Kullu-Manali Airport, Bhuntar (KUU) — 50 km (1.5 hours drive)",
    nearestStation: "Chandigarh Railway Station — 290 km (7.5 hours drive via Highway)",
    amenities: [
      { id: "pool", label: "Thermal Outdoor Pool" },
      { id: "breakfast", label: "Complimentary Hot Breakfast" },
      { id: "wifi", label: "High-Speed Fiber Wi-Fi" },
      { id: "spa", label: "Aroma Pine & Steam Wellness" },
      { id: "fire", label: "Antique Fireplaces in All Suites" },
      { id: "views", label: "Snow Glacier Panoramas" },
      { id: "ski", label: "Solang Valley Ski Shuttle" },
      { id: "bar", label: "The Dungeon Bar & Lounge" }
    ],
    roomTypes: [
      {
        id: "deodar-cottage",
        name: "Deodar Wood Heritage Cottage",
        size: "500 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 5900,
        originalPrice: 8200,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Hot Himalayan Breakfast Buffet",
          "Working Wood Fireplace with Pine Logs",
          "Balcony with Direct Snow-Peak Views",
          "100% Free Cancellation 48h prior"
        ]
      },
      {
        id: "glacier-grand-suite",
        name: "Castle Glacier Grand Suite",
        size: "700 sq.ft.",
        capacity: "3 Guests · 1 King Bed + Daybed",
        price: 8800,
        originalPrice: 11900,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Gourmet Breakfast & Himachali Siddu Dinner",
          "Heated Marble Flooring",
          "Private Garden Sun Deck",
          "Complimentary Solang Valley Adventure Passes"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "Free cancellation up to 48 hours before check-in.",
      pets: "Pet-friendly cottages available upon request."
    },
    reviews: [
      {
        author: "Kavita S.",
        date: "September 2026",
        rating: 5,
        comment: "The fireplace, the snow views, and the warm Himachali apple pie in the evening made our anniversary unforgettable."
      }
    ]
  },
  {
    id: "soul-and-surf-varkala",
    name: "Soul & Surf Red Cliff Haven",
    tagline: "Clifftop bohemian sanctuary perched over the crashing waves of the Arabian Sea",
    city: "Varkala",
    state: "Kerala",
    country: "India",
    type: "Cliffside Sanctuary",
    rating: 4.9,
    reviewsCount: 142,
    pricePerNight: 4800,
    originalPrice: 6500,
    mood: ["Coastal", "Calm", "Wellness", "Sunset"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Perched atop the dramatic red laterite cliffs of Varkala, Soul & Surf blends laid-back coastal aesthetics with soulful yoga, ayurveda, and ocean surfing. Uninterrupted 180-degree sunset ocean views, open-air clifftop café, and gentle Arabian Sea breezes create the ultimate sanctuary for unwinding and creative renewal.",
    locationAddress: "South Cliff, Varkala, Kerala 695141, India",
    nearestAirport: "Trivandrum International Airport (TRV) — 45 km (1 hour drive)",
    nearestStation: "Varkala Sivagiri Railway Station — 4 km (10 mins drive)",
    amenities: [
      { id: "beach", label: "Direct Beach & Cliff Access" },
      { id: "yoga", label: "Daily Sunset & Sunrise Yoga" },
      { id: "surf", label: "Surf Lessons & Board Rentals" },
      { id: "wifi", label: "High-Speed Nomad Wi-Fi" },
      { id: "cafe", label: "Ocean Clifftop Artisanal Café" },
      { id: "spa", label: "Ayurvedic Restorative Massages" },
      { id: "views", label: "Unobstructed Sunset Views" },
      { id: "breakfast", label: "Nutrient-Rich Coastal Breakfast" }
    ],
    roomTypes: [
      {
        id: "ocean-breeze-room",
        name: "Ocean Breeze Terrace Room",
        size: "380 sq.ft.",
        capacity: "2 Guests · 1 Queen Bed",
        price: 4800,
        originalPrice: 6500,
        image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Fresh Tropical Fruit & Sourdough Breakfast",
          "Daily Complimentary 75-min Yoga Class",
          "Hammock on Private Sea-Facing Balcony",
          "100% Free Cancellation 48h prior"
        ]
      },
      {
        id: "cliffside-master-suite",
        name: "Cliffside Sunset Penthouse Suite",
        size: "550 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 7200,
        originalPrice: 9500,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        perks: [
          "All-Day Gourmet Breakfast & Fresh Coconuts",
          "Private Panoramic Sunset Deck",
          "Introductory Surf Lesson with Instructor",
          "Free Airport Transfer from Trivandrum"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "Free cancellation up to 48 hours prior to check-in.",
      pets: "Service animals welcome."
    },
    reviews: [
      {
        author: "Tara & Rohan",
        date: "October 2026",
        rating: 5,
        comment: "Watching the red cliff glow at sunset while listening to acoustic guitar and waves was the highlight of our entire South India trip."
      }
    ]
  },
  {
    id: "evolve-back-coorg",
    name: "Evolve Back Chikkana Halli",
    tagline: "300-acre lush coffee and spice plantation estate immersed in the Western Ghats canopy",
    city: "Coorg",
    state: "Karnataka",
    country: "India",
    type: "Coffee Estate Villa",
    rating: 5.0,
    reviewsCount: 298,
    pricePerNight: 12400,
    originalPrice: 16500,
    mood: ["Luxury", "Nature", "Calm", "Green"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Spread over 300 acres of working coffee and spice plantation bordered by the river Cauvery, Evolve Back Chikkana Halli represents the zenith of eco-luxury. Handcrafted Kodava architecture, private heated plunge pools, and plantation trails alive with exotic Malabar hornbills deliver an immersive luxury experience.",
    locationAddress: "Karadigodu Post, Siddapur, Coorg, Karnataka 571253, India",
    nearestAirport: "Kannur International Airport (CNN) — 85 km (2.5 hours drive)",
    nearestStation: "Mysore Railway Station — 110 km (2.8 hours drive)",
    amenities: [
      { id: "pool", label: "Private Heated Plunge Pools" },
      { id: "breakfast", label: "Multi-Cuisine Royal Buffet" },
      { id: "coffee", label: "Custom Coffee Roasting Lab" },
      { id: "spa", label: "Vaidyasala Ayurvedic Wellness" },
      { id: "river", label: "Cauvery River Coracle Rides" },
      { id: "wifi", label: "High-Speed Wi-Fi" },
      { id: "parking", label: "Valet & EV Fast Charging" },
      { id: "concierge", label: "Naturalist Birding Expeditions" }
    ],
    roomTypes: [
      {
        id: "heritage-pool-villa",
        name: "Heritage Private Pool Villa",
        size: "680 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 12400,
        originalPrice: 16500,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Private Courtyard & Temperature-Controlled Pool",
          "Full Estate Breakfast & Traditional Pandi Curry Dinner",
          "Custom Coffee Tasting & Bean Blending Kit",
          "100% Free Cancellation 48h prior"
        ]
      },
      {
        id: "lily-pool-palace",
        name: "Lily Pool Plantation Palace",
        size: "1050 sq.ft.",
        capacity: "4 Guests · 2 King Bedrooms",
        price: 19800,
        originalPrice: 25000,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Private Heated Infinity Pool overlooking Lake",
          "Personal Chef & Dedicated Estate Butler",
          "Complimentary River Coracle & Forest Safari",
          "Free Luxury Chauffeur Transfer from Mysore"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "Free cancellation up to 48 hours prior to check-in.",
      pets: "No pets allowed on main plantation reserve."
    },
    reviews: [
      {
        author: "Devendra Singhal",
        date: "September 2026",
        rating: 5,
        comment: "The scent of Arabica blossom in the air and swimming in our private pool under star-lit skies is true bliss."
      }
    ]
  },
  {
    id: "ahilya-by-the-sea-goa",
    name: "Ahilya by the Sea",
    tagline: "Serene boutique ocean haveli perched on the quiet shores of Dolphin Bay",
    city: "Goa (Dolphin Bay)",
    state: "Goa",
    country: "India",
    type: "Boutique Ocean Villa",
    rating: 4.9,
    reviewsCount: 175,
    pricePerNight: 9200,
    originalPrice: 12800,
    mood: ["Coastal", "Romantic", "Luxury", "Calm"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Tucked away in the quiet fishing inlet of Dolphin Bay near Nerul, Ahilya by the Sea is an oasis of calm that recalls old-world Portuguese-Goan romance. Built with local laterite stone and decorated with curated colonial antiques and artworks, it offers two infinity pools that melt into the Arabian Sea horizon.",
    locationAddress: "Coco Beach, Nerul, Dolphin Bay, Goa 403114, India",
    nearestAirport: "Dabolim International Airport (GOI) — 32 km (50 mins drive)",
    nearestStation: "Thivim Railway Station — 24 km (40 mins drive)",
    amenities: [
      { id: "pool", label: "Dual Ocean Infinity Pools" },
      { id: "breakfast", label: "A La Carte Gourmet Seafood Breakfast" },
      { id: "wifi", label: "High-Speed Wi-Fi" },
      { id: "spa", label: "Banyan Treehouse Wellness Spa" },
      { id: "dolphins", label: "Morning Dolphin Watching from Deck" },
      { id: "views", label: "Direct Arabian Sea & Bay Views" },
      { id: "dining", label: "Al Fresco Candlelight Dining" },
      { id: "parking", label: "Private Secure Parking" }
    ],
    roomTypes: [
      {
        id: "sunset-ocean-room",
        name: "Leela Sunset Ocean Suite",
        size: "440 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 9200,
        originalPrice: 12800,
        image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Fresh Goan & Continental Gourmet Breakfast",
          "Private Sea-Facing Verandah with Daybed",
          "Antique Portuguese Teak Furnishings",
          "100% Free Cancellation 48h prior"
        ]
      },
      {
        id: "music-tower-suite",
        name: "Music Room Ocean Penthouse",
        size: "620 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 13500,
        originalPrice: 17800,
        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Private Rooftop Deck with 270° Ocean Views",
          "Candlelight Seafood Dinner under the Stars",
          "Complimentary Sunset Catamaran Cruise",
          "Private Airport Transfers"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "Free cancellation up to 48 hours prior to check-in.",
      pets: "No pets allowed."
    },
    reviews: [
      {
        author: "Sarah & David Jenkins",
        date: "October 2026",
        rating: 5,
        comment: "The quietest and most enchanting part of Goa. We watched dolphins leaping right from the breakfast table."
      }
    ]
  },
  {
    id: "wildflower-hall-mashobra",
    name: "Wildflower Hall, An Oberoi Resort",
    tagline: "Former residence of Lord Kitchener nestled 8,250 feet high in fragrant cedar woods",
    city: "Shimla",
    state: "Himachal Pradesh",
    country: "India",
    type: "Heritage Mountain Palace",
    rating: 5.0,
    reviewsCount: 320,
    pricePerNight: 16500,
    originalPrice: 22000,
    mood: ["Luxury", "Snow", "Calm", "Romantic"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Located at 8,250 feet above sea level in Mashobra near Shimla, Wildflower Hall recreates the grandeur of the British colonial era. Set amidst 22 acres of virgin pine and cedar forest, it features an iconic heated outdoor whirlpool with panoramic views of the Pir Panjal mountain range.",
    locationAddress: "Shimla Kufri Highway, Chharabra, Shimla, Himachal Pradesh 171012, India",
    nearestAirport: "Shimla Airport, Jubbarhatti (SLV) — 30 km (1 hour drive)",
    nearestStation: "Kalka Railway Station — 100 km (3.5 hours drive)",
    amenities: [
      { id: "pool", label: "Open-Air Heated Mountain Whirlpool" },
      { id: "spa", label: "Oberoi Luxury Pine Spa" },
      { id: "breakfast", label: "Grand Himalayan Breakfast" },
      { id: "wifi", label: "Ultra High-Speed Wi-Fi" },
      { id: "trail", label: "Private Forest Nature Treks" },
      { id: "tennis", label: "Open-Air Cedar Tennis Court" },
      { id: "views", label: "Himalayan Snow Peak Panoramas" },
      { id: "concierge", label: "24/7 Dedicated Butler Service" }
    ],
    roomTypes: [
      {
        id: "premier-mountain-room",
        name: "Premier Mountain View Room",
        size: "520 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 16500,
        originalPrice: 22000,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Daily Grand Oberoi Breakfast Buffet",
          "Burma Teak Flooring & Marble Bath with Forest View",
          "Afternoon Colonial Tea on the Lutyens Terrace",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "12:00 PM",
      cancellation: "Free cancellation up to 48 hours prior to arrival.",
      pets: "No pets allowed."
    },
    reviews: [
      {
        author: "Pranay & Suniti",
        date: "September 2026",
        rating: 5,
        comment: "Sitting in the heated outdoor jacuzzi with steam rising into crisp mountain pine air while gazing at snow peaks is unparalleled."
      }
    ]
  },
  {
    id: "samode-palace-jaipur",
    name: "Samode Palace Heritage Sanctuary",
    tagline: "475-year-old painted palace adorned with mirror-work Sheesh Mahal suites",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    type: "Royal Palace",
    rating: 4.9,
    reviewsCount: 260,
    pricePerNight: 11000,
    originalPrice: 14500,
    mood: ["Heritage", "Royal", "Romantic", "Luxury"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Nestled quietly against the rugged Aravalli cliffs north of Jaipur, the 475-year-old Samode Palace is an architectural jewel. Hand-painted frescoes, mosaic courtyards, marble swimming pools, and the world-renowned Sultan Mahal mirror-hall offer a regal escape into royal Rajputana.",
    locationAddress: "Samode, Tehsil Chomu, Jaipur, Rajasthan 303806, India",
    nearestAirport: "Jaipur International Airport (JAI) — 56 km (1.2 hours drive)",
    nearestStation: "Jaipur Junction Railway Station — 42 km (55 mins drive)",
    amenities: [
      { id: "pool", label: "Dual Rooftop & Marble Courtyard Pools" },
      { id: "breakfast", label: "Royal Rajasthani & Continental Breakfast" },
      { id: "wifi", label: "High-Speed Wi-Fi" },
      { id: "spa", label: "Palace Ayurvedic Therapies" },
      { id: "camel", label: "Camel Cart Desert Village Safaris" },
      { id: "views", label: "Aravalli Hillside Panoramas" },
      { id: "dining", label: "Courtyard Dining with Live Folk Music" },
      { id: "parking", label: "Free Valet Parking" }
    ],
    roomTypes: [
      {
        id: "deluxe-palace-suite",
        name: "Deluxe Rajput Palace Suite",
        size: "540 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 11000,
        originalPrice: 14500,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Royal Courtyard Breakfast Buffet",
          "Original Antique Four-Poster Bed",
          "Private Guided Tour of Sheesh Mahal",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "Free cancellation up to 48 hours before check-in.",
      pets: "No pets allowed."
    },
    reviews: [
      {
        author: "Alok & Vandana",
        date: "October 2026",
        rating: 5,
        comment: "Living in a real historical palace with folk music playing in the courtyard under stars was the dream Rajasthan holiday."
      }
    ]
  }
,
  {
    id: "aloha-on-the-ganges-rishikesh",
    name: "Aloha On The Ganges Sanctuary",
    tagline: "Serene riverfront retreat situated right on the banks of holy River Ganga in Tapovan",
    city: "Rishikesh",
    state: "Uttarakhand",
    country: "India",
    type: "Riverside Wellness Resort",
    rating: 4.8,
    reviewsCount: 215,
    pricePerNight: 7200,
    originalPrice: 9500,
    mood: ["Peace", "Adventure", "Calm", "Wellness"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Perched gracefully along the emerald waters of the Ganga in Tapovan, Aloha offers an idyllic blend of spiritual wellness and Himalayan foothill views. Featuring an infinity pool overlooking the sacred river, daily morning yoga sessions, and an Ayurvedic spa.",
    locationAddress: "National Highway 58, Tapovan, Rishikesh, Uttarakhand 249192, India",
    nearestAirport: "Dehradun Jolly Grant Airport (DED) — 21 km (35 mins drive)",
    nearestStation: "Yog Nagari Rishikesh (YNRK) — 6 km (15 mins drive)",
    amenities: [
      { id: "pool", label: "Riverfront Infinity Pool" },
      { id: "yoga", label: "Daily Sunrise Yoga & Pranayama" },
      { id: "spa", label: "Ayurvedic Brij Wellness" },
      { id: "dining", label: "Riverside Garden Dining" },
      { id: "wifi", label: "High-Speed Wi-Fi" }
    ],
    roomTypes: [
      {
        id: "ganga-view-suite",
        name: "Ganga View Superior Suite",
        size: "480 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 7200,
        originalPrice: 9500,
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Complimentary Organic Breakfast",
          "Private River-Facing Balcony",
          "Free Yoga Sessions",
          "Free Cancellation 48h prior"
        ]
      },
      {
        id: "ganga-luxury-chalet",
        name: "Two-Bedroom Riverside Luxury Apartment",
        size: "950 sq.ft.",
        capacity: "4 Guests · 2 King Beds",
        price: 12800,
        originalPrice: 16500,
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Organic Farm Breakfast Buffet",
          "Private Panoramic River Deck",
          "Complimentary Evening Aarti Transfer",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pet-friendly with prior notification in select garden villas."
    },
    reviews: [
      {
        author: "Aarav & Shalini",
        date: "October 2026",
        rating: 5,
        comment: "Morning yoga on the Ganga riverside deck followed by the Ayurvedic spa treatment restored our souls. The views of the emerald river are breathtaking."
      },
      {
        author: "Devika Nair",
        date: "September 2026",
        rating: 5,
        comment: "Zero convenience fee booking was a breeze. Best location in Rishikesh away from the crowd but close to Laxman Jhula."
      }
    ]
  },
  {
    id: "brijrama-palace-varanasi",
    name: "BrijRama Palace Heritage",
    tagline: "210-year-old riverfront sandstone palace perched directly upon Darbhanga Ghat",
    city: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    type: "Heritage River Palace",
    rating: 4.9,
    reviewsCount: 280,
    pricePerNight: 13500,
    originalPrice: 18000,
    mood: ["Culture", "Heritage", "Luxury", "Peace"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Built in 1812 by the royal house of Nagpur on Darbhanga Ghat, BrijRama Palace is one of the oldest riverfront structures on the holy Ganga. Guests arrive by private vintage wooden bajra boat and ascend via South Asia's first heritage elevator.",
    locationAddress: "Darbhanga Ghat, Dashashwamedh, Varanasi, Uttar Pradesh 221001, India",
    nearestAirport: "Lal Bahadur Shastri Airport (VNS) — 26 km (50 mins drive)",
    nearestStation: "Varanasi Junction (BSB) — 5 km (20 mins drive)",
    amenities: [
      { id: "boat", label: "Private Heritage Bajra Boat Transfers" },
      { id: "breakfast", label: "Royal Satvik & Continental Breakfast" },
      { id: "dining", label: "Darbhanga Fine Dining Terrace" },
      { id: "views", label: "Direct Ganga River Sunrise Views" }
    ],
    roomTypes: [
      {
        id: "maharaja-ganga-suite",
        name: "Maharaja Ganga View Suite",
        size: "520 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 13500,
        originalPrice: 18000,
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Royal Buffet Breakfast",
          "Private Sunrise Boat Cruise",
          "Personal Heritage Guide",
          "100% Free Cancellation"
        ]
      },
      {
        id: "varuna-courtyard-room",
        name: "Varuna Traditional Courtyard Room",
        size: "420 sq.ft.",
        capacity: "2 Guests · 1 Queen Bed",
        price: 10500,
        originalPrice: 14000,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Traditional Satvik Breakfast",
          "Heritage Palace Walk Tour",
          "Evening Sitar Performance Entry",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "12:00 PM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pets are not permitted on the heritage palace grounds."
    },
    reviews: [
      {
        author: "Rohan & Priyamvada",
        date: "October 2026",
        rating: 5,
        comment: "Arriving by royal bajra boat on Darbhanga Ghat and entering through South Asia's first heritage lift felt like stepping back two centuries into regal Banaras."
      },
      {
        author: "Alok Sengupta",
        date: "August 2026",
        rating: 5,
        comment: "Unrivalled front-row seats to the evening Ganga Aarti and morning flute recitals. The satvik cuisine was world-class."
      }
    ]
  },
  {
    id: "the-grand-dragon-ladakh",
    name: "The Grand Dragon Ladakh",
    tagline: "Eco-conscious luxury haven with unobstructed panoramas of the snow-clad Stok Kangri range",
    city: "Ladakh",
    state: "Ladakh",
    country: "India",
    type: "Luxury Mountain Resort",
    rating: 4.9,
    reviewsCount: 310,
    pricePerNight: 9800,
    originalPrice: 13000,
    mood: ["Adventure", "Luxury", "Peace", "Snow"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Ladakh's premier luxury mountain retreat, decorated with handcrafted Ladakhi wooden woodwork, thangka paintings, and solar-paneled central heating. Offers 360-degree views of Stok Kangri and Khardung La ridge.",
    locationAddress: "Old Road Sheynam, Leh, Ladakh 194101, India",
    nearestAirport: "Kushok Bakula Rimpochee Airport (IXL) — 4 km (10 mins drive)",
    nearestStation: "Jammu Tawi Railway Station — 700 km",
    amenities: [
      { id: "heating", label: "Central Solar Climate Control" },
      { id: "oxygen", label: "In-Room Oxygen Assistance" },
      { id: "breakfast", label: "Grand Himalayan Breakfast" },
      { id: "views", label: "Stok Kangri Snow-Peak Vistas" }
    ],
    roomTypes: [
      {
        id: "deluxe-stok-room",
        name: "Deluxe Stok Mountain View Room",
        size: "420 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 9800,
        originalPrice: 13000,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Hot Breakfast Buffet",
          "Acclimatization Tea & Care",
          "Direct Stok Kangri Views",
          "Free Airport Shuttle"
        ]
      },
      {
        id: "royal-ladakhi-suite",
        name: "Royal Ladakhi Heritage Suite",
        size: "680 sq.ft.",
        capacity: "3 Guests · 1 King + 1 Day Bed",
        price: 15500,
        originalPrice: 19500,
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Breakfast & 3-Course Himalayan Dinner",
          "Private Heated Balcony Facing Khardung La",
          "Dedicated Acclimatization Doctor on Call",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "12:00 PM",
      checkOut: "10:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pets are not allowed due to high-altitude wildlife regulations."
    },
    reviews: [
      {
        author: "Tsering & Ananya",
        date: "September 2026",
        rating: 5,
        comment: "Waking up to Stok Kangri bathed in morning alpenglow through floor-to-ceiling windows was pure magic. In-room oxygen and heated floors kept us comfortable in Leh."
      },
      {
        author: "Karan Malhotra",
        date: "August 2026",
        rating: 5,
        comment: "Seamless booking through Roamly with zero convenience fee! The staff arranged our Khardung La permits and the culinary spread was delicious."
      }
    ]
  },
  {
    id: "kahani-paradise-gokarna",
    name: "Kahani Paradise Ocean Estate",
    tagline: "Exclusive 20-acre private tropical estate overlooking the meeting of the Western Ghats and Arabian Sea",
    city: "Gokarna",
    state: "Karnataka",
    country: "India",
    type: "Boutique Coastal Estate",
    rating: 4.9,
    reviewsCount: 95,
    pricePerNight: 8900,
    originalPrice: 12000,
    mood: ["Peace", "Beach", "Luxury", "Calm"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Nestled in 20 acres of private coconut and betel-nut groves above Paradise Beach, Kahani Paradise offers sweeping views of the Arabian sea and lush estuaries.",
    locationAddress: "Bada Village, Belekan, Gokarna, Karnataka 581326, India",
    nearestAirport: "Goa Dabolim Airport (GOI) — 145 km",
    nearestStation: "Gokarna Road (GOK) — 18 km",
    amenities: [
      { id: "pool", label: "Cliffside Mosaic Infinity Pool" },
      { id: "beach", label: "Private Trail to Secluded Cove" },
      { id: "dining", label: "Organic Farm-to-Table Cuisine" }
    ],
    roomTypes: [
      {
        id: "ocean-suite",
        name: "Cliff Ocean View Suite",
        size: "500 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 8900,
        originalPrice: 12000,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Breakfast Included",
          "Private Sea Deck",
          "Free Cancellation 48h prior"
        ]
      },
      {
        id: "estate-verandah-room",
        name: "Palm Grove Garden Verandah Suite",
        size: "440 sq.ft.",
        capacity: "2 Guests · 1 Queen Bed",
        price: 7400,
        originalPrice: 9900,
        image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Farm Fresh Coconut Breakfast",
          "Direct Grove Access",
          "Complimentary Sunset Kayaking Gear",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pets are welcome in private ground estate suites."
    },
    reviews: [
      {
        author: "Siddharth & Tara",
        date: "September 2026",
        rating: 5,
        comment: "A hidden slice of heaven. 20 private acres where the Western Ghats tumble into the Arabian Sea. The private trail down to Paradise Beach was utterly serene."
      },
      {
        author: "Nisha Rao",
        date: "July 2026",
        rating: 5,
        comment: "The cliffside mosaic infinity pool at sunset is unbeatable. Chef curated amazing coastal delicacies with produce fresh from the estate."
      }
    ]
  },
  {
    id: "the-khyber-resort-gulmarg",
    name: "The Khyber Himalayan Resort & Spa",
    tagline: "World-class 5-star mountain sanctuary nestled 8,825 feet high in virgin pine forests",
    city: "Gulmarg",
    state: "Jammu & Kashmir",
    country: "India",
    type: "Luxury Ski Resort",
    rating: 5,
    reviewsCount: 340,
    pricePerNight: 18500,
    originalPrice: 24000,
    mood: ["Luxury", "Snow", "Adventure", "Romance"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Located moments from the Gulmarg Gondola, The Khyber is framed by towering Pir Panjal peaks. Features an iconic glass-enclosed heated indoor pool gazing out at snow-covered pine forests.",
    locationAddress: "Near Gondola, Gulmarg, Jammu and Kashmir 193403, India",
    nearestAirport: "Srinagar International Airport (SXR) — 56 km (1.5 hours drive)",
    nearestStation: "Jammu Tawi — 300 km",
    amenities: [
      { id: "pool", label: "Glass-Enclosed Heated Mountain Pool" },
      { id: "spa", label: "L'Occitane Mediterranean Spa" },
      { id: "ski", label: "Direct Gondola Ski Shuttle" }
    ],
    roomTypes: [
      {
        id: "premier-snow-suite",
        name: "Premier Apharwat Snow View Suite",
        size: "560 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 18500,
        originalPrice: 24000,
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Gourmet Breakfast Buffet",
          "Heated Floors & Kashmiri Pine Wood",
          "Complimentary Gondola Transfer"
        ]
      },
      {
        id: "pine-cottage-chalet",
        name: "Luxury Pine Chalet Suite",
        size: "650 sq.ft.",
        capacity: "3 Guests · 1 King Bed",
        price: 24500,
        originalPrice: 32000,
        image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Daily Breakfast & Wazwan Dinner",
          "Complimentary Ski Equipment Fitting",
          "Private Fireplace Lounge",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "11:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pets are not permitted on the resort premises."
    },
    reviews: [
      {
        author: "Zainab & Farhan",
        date: "October 2026",
        rating: 5,
        comment: "Swimming in the heated indoor pool while fresh snow falls silently outside the glass walls facing Mount Apharwat is an experience of a lifetime."
      },
      {
        author: "Gaurav Kapur",
        date: "January 2026",
        rating: 5,
        comment: "Literally walking distance from the Gondola ski lifts. Outstanding Kashmiri Kahwa and Wazwan, coupled with true 5-star mountain luxury."
      }
    ]
  },
  {
    id: "barefoot-at-havelock",
    name: "Barefoot at Havelock Island",
    tagline: "Eco-luxury jungle cottages nestled along the pristine turquoise sands of Beach No. 7",
    city: "Andaman Islands",
    state: "Andaman and Nicobar Islands",
    country: "India",
    type: "Tropical Beach Resort",
    rating: 4.8,
    reviewsCount: 190,
    pricePerNight: 9500,
    originalPrice: 13000,
    mood: ["Nature", "Romance", "Peace", "Beach"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Nestled behind the white sands of Radhanagar Beach, Barefoot features thatch cottages constructed using local renewable timber, offering world-class scuba diving and forest serenity.",
    locationAddress: "Beach No. 7, Radhanagar, Havelock Island, Andaman 744211, India",
    nearestAirport: "Port Blair Airport (IXZ) — 50 km by high-speed catamaran",
    nearestStation: "No rail connection",
    amenities: [
      { id: "beach", label: "Direct Trail to Radhanagar Beach" },
      { id: "dive", label: "PADI Certified Scuba Diving School" },
      { id: "dining", label: "Island Fresh Seafood Dining" }
    ],
    roomTypes: [
      {
        id: "andaman-villa",
        name: "Nicobari Timber Island Villa",
        size: "460 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 9500,
        originalPrice: 13000,
        image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Fresh Tropical Breakfast",
          "Private Sun Deck",
          "Snorkel Gear Included"
        ]
      },
      {
        id: "andaman-thatch-cottage",
        name: "Andaman Canopy Treehouse Cottage",
        size: "520 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 12900,
        originalPrice: 16500,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Island Breakfast & Fresh Coconut Water",
          "Direct Secret Beach Path",
          "Complimentary Bio-luminescence Kayak Tour",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "1:00 PM",
      checkOut: "10:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pets are not allowed on the eco-reserve property."
    },
    reviews: [
      {
        author: "Neil & Tanvi",
        date: "October 2026",
        rating: 5,
        comment: "Walking out of our mahogany thatch cottage through tropical forest straight onto Radhanagar's turquoise waters was unbelievable. Truly eco-conscious luxury."
      },
      {
        author: "Sneha Menon",
        date: "September 2026",
        rating: 5,
        comment: "Scuba diving with the Barefoot dive school at Dixon's Pinnacle was magnificent. Friendly staff, zero convenience fees, and pure peaceful vibes."
      }
    ]
  },
  {
    id: "the-oberoi-amarvilas-agra",
    name: "The Oberoi Amarvilas",
    tagline: "Unobstructed vistas of the world-famous Taj Mahal from every single room and suite",
    city: "Agra",
    state: "Uttar Pradesh",
    country: "India",
    type: "Royal Luxury Palace",
    rating: 5,
    reviewsCount: 420,
    pricePerNight: 24000,
    originalPrice: 31000,
    mood: ["Romance", "Culture", "Luxury", "Heritage"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Located just 600 meters from the Taj Mahal, Amarvilas evokes Mughal grandeur with reflecting pools, terraced lawns, and private golf-buggy transfers directly to monument gates.",
    locationAddress: "Taj East Gate Road, Agra, Uttar Pradesh 282001, India",
    nearestAirport: "Kheria Airport (AGR) — 12 km",
    nearestStation: "Agra Cantt Railway Station — 8 km",
    amenities: [
      { id: "views", label: "Guaranteed Taj Mahal Views from All Rooms" },
      { id: "pool", label: "Mughal Terraced Azure Swimming Pool" },
      { id: "golf", label: "Complimentary Electric Golf Cart to Taj" }
    ],
    roomTypes: [
      {
        id: "premier-taj-room",
        name: "Premier Taj View Room",
        size: "450 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 24000,
        originalPrice: 31000,
        image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Royal Breakfast Buffet",
          "Private Marble Taj Balcony",
          "Golf Buggy VIP Taj Access"
        ]
      },
      {
        id: "deluxe-taj-balcony-suite",
        name: "Kohinoor Mughal Royal Suite",
        size: "820 sq.ft.",
        capacity: "2 Guests · 1 Royal King Bed",
        price: 36000,
        originalPrice: 45000,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Private Butler & Champagne Taj Breakfast",
          "Direct Panoramic Taj Monument Terrace",
          "Mughal Spa Ritual for Two",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "2:00 PM",
      checkOut: "12:00 PM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pets are not permitted."
    },
    reviews: [
      {
        author: "Aditya & Sanjana",
        date: "October 2026",
        rating: 5,
        comment: "Sipping morning tea on our balcony with the sunrise glinting off the marble dome of the Taj Mahal just 600m away. Simply transcendent."
      },
      {
        author: "Marcus & Elena",
        date: "September 2026",
        rating: 5,
        comment: "Oberoi hospitality is legendary, and Amarvilas is its crown jewel. The private golf cart ride to the VIP monument gates made sightseeing effortless."
      }
    ]
  },
  {
    id: "glenburn-tea-estate-darjeeling",
    name: "Glenburn Tea Estate & Boutique Retreat",
    tagline: "1,600-acre colonial tea sanctuary with sweeping vistas of Mt. Kanchenjunga",
    city: "Darjeeling",
    state: "West Bengal",
    country: "India",
    type: "Heritage Tea Estate",
    rating: 4.9,
    reviewsCount: 165,
    pricePerNight: 14500,
    originalPrice: 19000,
    mood: ["Peace", "Nature", "Heritage", "Calm"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Started by a Scottish tea company in 1859, Glenburn is an enchanting boutique plantation lodge overlooking the snow-crested heights of Kanchenjunga.",
    locationAddress: "Glenburn Tea Estate, Near Singritan, Darjeeling, West Bengal 734101, India",
    nearestAirport: "Bagdogra Airport (IXB) — 78 km",
    nearestStation: "New Jalpaiguri (NJP) — 80 km",
    amenities: [
      { id: "tea", label: "Private Tea Factory & Tasting Tour" },
      { id: "views", label: "Kanchenjunga Snow-Peak Panoramas" },
      { id: "dining", label: "Colonial Planter's Four-Course Dinners" }
    ],
    roomTypes: [
      {
        id: "planters-suite",
        name: "Kanchenjunga Planter's Suite",
        size: "540 sq.ft.",
        capacity: "2 Guests · 1 Antique Four-Poster Bed",
        price: 14500,
        originalPrice: 19000,
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        perks: [
          "All Meals & Tea Tastings Included",
          "Fireplace in Suite",
          "Estate Walks with Naturalist"
        ]
      },
      {
        id: "burra-bungalow-suite",
        name: "Historic Burra Bungalow Suite",
        size: "620 sq.ft.",
        capacity: "2 Guests · 1 Victorian Four-Poster Bed",
        price: 18000,
        originalPrice: 23500,
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Gourmet Estate Dining & First Flush Tastings",
          "Direct Lawn Verandah with Kanchenjunga Vistas",
          "River Rungeet Picnic with Guide",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "1:00 PM",
      checkOut: "11:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pet-friendly in the Burra Bungalow private suites."
    },
    reviews: [
      {
        author: "Pranab & Sumitra",
        date: "October 2026",
        rating: 5,
        comment: "Colonial planter life at its finest! Sitting by the roaring fireplace listening to stories of the tea gardens, with snow-clad Kanchenjunga standing guard."
      },
      {
        author: "Rachel Green",
        date: "May 2026",
        rating: 5,
        comment: "The tea plucking and factory tasting session was fascinating. Fresh hill cuisine, warm hospitality, and pure mountain air."
      }
    ]
  },
  {
    id: "rann-resort-dhordo-kutch",
    name: "Dhordo White Rann Luxury Haven",
    tagline: "Traditional circular artisan bhungas situated on the threshold of the infinite salt desert",
    city: "Rann of Kutch",
    state: "Gujarat",
    country: "India",
    type: "Desert Heritage Resort",
    rating: 4.8,
    reviewsCount: 180,
    pricePerNight: 6500,
    originalPrice: 8900,
    mood: ["Culture", "Nature", "Peace", "Heritage"],
    badge: "EaseMyTrip Verified",
    heroImage: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Built using authentic Kutchi mud-and-mirror Lipan art, Dhordo White Rann Haven offers air-conditioned cylindrical bhunga suites just 5 minutes from the glistening salt flats.",
    locationAddress: "Dhordo Village, Banni Grasslands, Kutch, Gujarat 370510, India",
    nearestAirport: "Bhuj Airport (BHJ) — 80 km",
    nearestStation: "Bhuj Railway Station — 82 km",
    amenities: [
      { id: "desert", label: "Desert Camel Safari to Salt Flats" },
      { id: "art", label: "Authentic Mud & Mirror Lipan Art Suites" },
      { id: "food", label: "Kathiyawadi & Kutchi Traditional Thali" }
    ],
    roomTypes: [
      {
        id: "royal-bhunga",
        name: "Royal Handcrafted Kutchi Bhunga",
        size: "440 sq.ft.",
        capacity: "2 Guests · 1 King Bed",
        price: 6500,
        originalPrice: 8900,
        image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Authentic Gujarati Buffet",
          "White Desert Permit Assistance",
          "Camel Cart Ride to Sunset"
        ]
      },
      {
        id: "darbari-bhunga-suite",
        name: "Darbari Artisan Mirror Suite",
        size: "520 sq.ft.",
        capacity: "3 Guests · 1 King + 1 Kutchi Divan",
        price: 8900,
        originalPrice: 11500,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        perks: [
          "Full Board Authentic Kutchi Thali Meals",
          "VIP White Desert Moonlit Safari Pass",
          "Folk Dance & Music Courtyard Access",
          "100% Free Cancellation 48h prior"
        ]
      }
    ],
    policies: {
      checkIn: "12:30 PM",
      checkOut: "10:00 AM",
      cancellation: "100% Free Cancellation up to 48 hours prior to arrival with instant refund.",
      pets: "Pets permitted with prior notice."
    },
    reviews: [
      {
        author: "Hiren & Bhavna",
        date: "October 2026",
        rating: 5,
        comment: "Staying inside an authentic cylindrical mud bhunga adorned with mirror work was surreal. The camel cart ride into the White Rann at full moon was enchanting."
      },
      {
        author: "Manish Joshi",
        date: "January 2026",
        rating: 5,
        comment: "Authentic Gujarati hospitality and delicious Kathiyawadi cuisine. Excellent location right next to the salt desert entrance."
      }
    ]
  }
];


/**
 * Returns authentic hotels matching the selected destination.
 * Matches by destination ID, destination name, city, or state.
 * Never returns mismatched hotels from unrelated locations.
 */
export function getHotelsForDestination(destId, destName, destState) {
  if (!destId && !destName) return HOTELS_DATA.slice(0, 3);
  
  const idStr = String(destId || "").toLowerCase().trim();
  const nameStr = String(destName || "").toLowerCase().trim();
  const stateStr = String(destState || "").toLowerCase().trim();

  // 1. Direct city/destination match
  const exactCityMatches = HOTELS_DATA.filter((h) => {
    const c = h.city.toLowerCase();
    const hId = h.id.toLowerCase();
    return c === idStr || c === nameStr || idStr.includes(c) || nameStr.includes(c) || hId.includes(idStr) || (c.includes("goa") && idStr === "goa");
  });
  if (exactCityMatches.length > 0) return exactCityMatches;

  // 2. Direct state match
  if (stateStr) {
    const stateMatches = HOTELS_DATA.filter((h) => {
      const s = h.state.toLowerCase();
      return stateStr.includes(s) || s.includes(stateStr);
    });
    if (stateMatches.length > 0) return stateMatches;
  }

  // 3. Fallback: Return first available hotel for this region, or null
  return [];
}
