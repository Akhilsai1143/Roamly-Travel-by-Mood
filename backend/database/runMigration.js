const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  console.log("Starting Roamly Bookings Database Migration...");

  try {
    // 1. Check if bookings table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'bookings'");

    if (tables.length === 0) {
      console.log("Table 'bookings' does not exist. Creating from SQL file...");
      const sqlPath = path.join(__dirname, "migrations", "create_bookings_table.sql");
      const sql = fs.readFileSync(sqlPath, "utf-8");
      await pool.query(sql);
      console.log("Table 'bookings' created successfully.");
    } else {
      console.log("Table 'bookings' already exists. Verifying and migrating columns...");
      const [columns] = await pool.query("SHOW COLUMNS FROM bookings");
      const colMap = new Set(columns.map(c => c.Field));

      // Add missing columns safely
      if (!colMap.has("booking_reference")) {
        console.log("Adding column: booking_reference");
        await pool.query("ALTER TABLE bookings ADD COLUMN booking_reference VARCHAR(50) NULL UNIQUE AFTER id");
      }

      if (!colMap.has("destination_name_snapshot")) {
        console.log("Adding column: destination_name_snapshot");
        await pool.query("ALTER TABLE bookings ADD COLUMN destination_name_snapshot VARCHAR(255) NULL AFTER destination_id");
      }

      if (!colMap.has("contact_name")) {
        console.log("Adding column: contact_name");
        await pool.query("ALTER TABLE bookings ADD COLUMN contact_name VARCHAR(150) NULL AFTER travellers");
      }

      if (!colMap.has("contact_email")) {
        console.log("Adding column: contact_email");
        await pool.query("ALTER TABLE bookings ADD COLUMN contact_email VARCHAR(150) NULL AFTER contact_name");
      }

      if (!colMap.has("contact_phone")) {
        console.log("Adding column: contact_phone");
        await pool.query("ALTER TABLE bookings ADD COLUMN contact_phone VARCHAR(50) NULL AFTER contact_email");
      }

      if (!colMap.has("estimated_total")) {
        console.log("Adding column: estimated_total");
        await pool.query("ALTER TABLE bookings ADD COLUMN estimated_total DECIMAL(12,2) NULL AFTER estimated_budget");
      }

      if (!colMap.has("rejection_reason")) {
        console.log("Adding column: rejection_reason");
        await pool.query("ALTER TABLE bookings ADD COLUMN rejection_reason TEXT NULL AFTER status");
      }

      if (!colMap.has("confirmed_by")) {
        console.log("Adding column: confirmed_by");
        await pool.query("ALTER TABLE bookings ADD COLUMN confirmed_by INT NULL AFTER rejection_reason");
      }

      if (!colMap.has("confirmed_at")) {
        console.log("Adding column: confirmed_at");
        await pool.query("ALTER TABLE bookings ADD COLUMN confirmed_at DATETIME NULL AFTER confirmed_by");
      }

      // Check and add indexes
      const [indexes] = await pool.query("SHOW INDEXES FROM bookings");
      const idxMap = new Set(indexes.map(i => i.Key_name));

      if (!idxMap.has("idx_bookings_reference")) {
        console.log("Adding index: idx_bookings_reference");
        await pool.query("ALTER TABLE bookings ADD INDEX idx_bookings_reference (booking_reference)");
      }

      if (!idxMap.has("idx_bookings_start_date")) {
        console.log("Adding index: idx_bookings_start_date");
        await pool.query("ALTER TABLE bookings ADD INDEX idx_bookings_start_date (start_date)");
      }

      // Check and add FK for confirmed_by
      const [fkRows] = await pool.query(
        "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND CONSTRAINT_NAME = 'fk_bookings_confirmed_by'"
      );

      if (fkRows.length === 0) {
        console.log("Adding foreign key: fk_bookings_confirmed_by");
        await pool.query(
          "ALTER TABLE bookings ADD CONSTRAINT fk_bookings_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL"
        );
      }
    }

    // 2. Check if reviews table exists
    const [revTables] = await pool.query("SHOW TABLES LIKE 'reviews'");
    if (revTables.length === 0) {
      console.log("Table 'reviews' does not exist. Creating from SQL file...");
      const revSqlPath = path.join(__dirname, "migrations", "create_reviews_table.sql");
      const revSql = fs.readFileSync(revSqlPath, "utf-8");
      await pool.query(revSql);
      console.log("Table 'reviews' created successfully.");
    } else {
      console.log("Table 'reviews' already exists. Verifying and migrating columns...");
      const [revCols] = await pool.query("SHOW COLUMNS FROM reviews");
      const revColMap = new Set(revCols.map(c => c.Field));

      if (!revColMap.has("destination_name")) {
        console.log("Adding column: destination_name to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN destination_name VARCHAR(255) NULL AFTER destination_id");
      }
      if (!revColMap.has("title")) {
        console.log("Adding column: title to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN title VARCHAR(255) NULL AFTER rating");
      }
      if (!revColMap.has("mood")) {
        console.log("Adding column: mood to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN mood VARCHAR(50) NULL AFTER comment");
      }
      if (!revColMap.has("duration")) {
        console.log("Adding column: duration to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN duration VARCHAR(100) NULL AFTER mood");
      }
      if (!revColMap.has("budget")) {
        console.log("Adding column: budget to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN budget VARCHAR(100) NULL AFTER duration");
      }
      if (!revColMap.has("season")) {
        console.log("Adding column: season to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN season VARCHAR(100) NULL AFTER budget");
      }
      if (!revColMap.has("insider_tip")) {
        console.log("Adding column: insider_tip to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN insider_tip TEXT NULL AFTER season");
      }
      if (!revColMap.has("photo_url")) {
        console.log("Adding column: photo_url to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN photo_url TEXT NULL AFTER insider_tip");
      }
      if (!revColMap.has("helpful_count")) {
        console.log("Adding column: helpful_count to reviews");
        await pool.query("ALTER TABLE reviews ADD COLUMN helpful_count INT NOT NULL DEFAULT 0 AFTER photo_url");
      }
    }

    // 3. Check and migrate users table columns for user management
    console.log("Checking 'users' table columns...");
    const [userCols] = await pool.query("SHOW COLUMNS FROM users");
    const userColMap = new Set(userCols.map((c) => c.Field));

    if (!userColMap.has("is_active")) {
      console.log("Adding column: is_active to users");
      await pool.query(
        "ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role"
      );
    }

    if (!userColMap.has("last_login")) {
      console.log("Adding column: last_login to users");
      await pool.query(
        "ALTER TABLE users ADD COLUMN last_login DATETIME NULL AFTER is_active"
      );
    }

    if (!userColMap.has("deleted_at")) {
      console.log("Adding column: deleted_at to users");
      await pool.query(
        "ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL AFTER last_login"
      );
    }

    // Check and add indexes on users table
    const [userIndexes] = await pool.query("SHOW INDEXES FROM users");
    const userIdxMap = new Set(userIndexes.map((i) => i.Key_name));

    if (!userIdxMap.has("idx_users_is_active")) {
      console.log("Adding index: idx_users_is_active");
      await pool.query("ALTER TABLE users ADD INDEX idx_users_is_active (is_active)");
    }

    if (!userIdxMap.has("idx_users_role")) {
      console.log("Adding index: idx_users_role");
      await pool.query("ALTER TABLE users ADD INDEX idx_users_role (role)");
    }

    // 4. Check and migrate destinations table columns for multi-image gallery
    console.log("Checking 'destinations' table columns...");
    const [destCols] = await pool.query("SHOW COLUMNS FROM destinations");
    const destColMap = new Set(destCols.map((c) => c.Field));

    if (!destColMap.has("gallery")) {
      console.log("Adding column: gallery to destinations");
      await pool.query(
        "ALTER TABLE destinations ADD COLUMN gallery LONGTEXT NULL AFTER image"
      );
    }

    // 5. Check and migrate payments & payment_webhook_events tables
    console.log("Checking 'payments' and 'payment_webhook_events' tables...");
    const [paymentTables] = await pool.query("SHOW TABLES LIKE 'payments'");
    if (paymentTables.length === 0) {
      console.log("Table 'payments' does not exist. Creating from create_payments_table.sql...");
      const paySqlPath = path.join(__dirname, "migrations", "create_payments_table.sql");
      const paySql = fs.readFileSync(paySqlPath, "utf-8");
      // Split by semicolon to execute both CREATE TABLE statements
      const statements = paySql.split(";").map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log("Tables 'payments' and 'payment_webhook_events' created successfully.");
    } else {
      console.log("Table 'payments' already exists.");
    }

    const [webhookTables] = await pool.query("SHOW TABLES LIKE 'payment_webhook_events'");
    if (webhookTables.length === 0) {
      console.log("Table 'payment_webhook_events' does not exist. Creating...");
      const paySqlPath = path.join(__dirname, "migrations", "create_payments_table.sql");
      const paySql = fs.readFileSync(paySqlPath, "utf-8");
      const statements = paySql.split(";").map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        if (statement.includes("payment_webhook_events")) {
          await pool.query(statement);
        }
      }
      console.log("Table 'payment_webhook_events' created.");
    }

    // Check if bookings table has payment_status and payment_id columns
    const [bCols] = await pool.query("SHOW COLUMNS FROM bookings");
    const bColMap = new Set(bCols.map(c => c.Field));

    if (!bColMap.has("payment_status")) {
      console.log("Adding column: payment_status to bookings");
      await pool.query(
        "ALTER TABLE bookings ADD COLUMN payment_status ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid' AFTER status"
      );
    }

    if (!bColMap.has("payment_id")) {
      console.log("Adding column: payment_id to bookings");
      await pool.query(
        "ALTER TABLE bookings ADD COLUMN payment_id VARCHAR(100) NULL AFTER payment_status"
      );
    }

    // 6. Check and migrate travel_packages, partners, package_partner_services, and business_expenses
    console.log("Checking 'travel_packages', 'partners', 'package_partner_services', and 'business_expenses' tables...");
    const [pkgTables] = await pool.query("SHOW TABLES LIKE 'travel_packages'");
    if (pkgTables.length === 0) {
      console.log("Creating travel packages, partners, and expenses tables from SQL file...");
      const pkgSqlPath = path.join(__dirname, "migrations", "create_packages_partners_expenses_tables.sql");
      const pkgSql = fs.readFileSync(pkgSqlPath, "utf-8");
      const statements = pkgSql.split(";").map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log("Tables 'travel_packages', 'partners', 'package_partner_services', and 'business_expenses' created successfully.");
    } else {
      console.log("Table 'travel_packages' already exists.");
    }

    // Check if partners table exists
    const [prtTables] = await pool.query("SHOW TABLES LIKE 'partners'");
    if (prtTables.length === 0) {
      const pkgSqlPath = path.join(__dirname, "migrations", "create_packages_partners_expenses_tables.sql");
      const pkgSql = fs.readFileSync(pkgSqlPath, "utf-8");
      const statements = pkgSql.split(";").map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        if (statement.includes("CREATE TABLE IF NOT EXISTS `partners`")) {
          await pool.query(statement);
        }
      }
    }

    // Check if package_partner_services table exists
    const [ppsTables] = await pool.query("SHOW TABLES LIKE 'package_partner_services'");
    if (ppsTables.length === 0) {
      const pkgSqlPath = path.join(__dirname, "migrations", "create_packages_partners_expenses_tables.sql");
      const pkgSql = fs.readFileSync(pkgSqlPath, "utf-8");
      const statements = pkgSql.split(";").map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        if (statement.includes("CREATE TABLE IF NOT EXISTS `package_partner_services`")) {
          await pool.query(statement);
        }
      }
    }

    // Check if business_expenses table exists
    const [expTables] = await pool.query("SHOW TABLES LIKE 'business_expenses'");
    if (expTables.length === 0) {
      const pkgSqlPath = path.join(__dirname, "migrations", "create_packages_partners_expenses_tables.sql");
      const pkgSql = fs.readFileSync(pkgSqlPath, "utf-8");
      const statements = pkgSql.split(";").map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        if (statement.includes("CREATE TABLE IF NOT EXISTS `business_expenses`")) {
          await pool.query(statement);
        }
      }
    }

    // Check snapshot columns in bookings table for Requirement 1
    const [bColsUpdated] = await pool.query("SHOW COLUMNS FROM bookings");
    const bColUpdatedMap = new Set(bColsUpdated.map(c => c.Field));

    if (!bColUpdatedMap.has("package_id")) {
      console.log("Adding column: package_id to bookings");
      await pool.query(
        "ALTER TABLE bookings ADD COLUMN package_id INT NULL AFTER destination_id, ADD INDEX idx_bookings_package (package_id)"
      );
      try {
        await pool.query(
          "ALTER TABLE bookings ADD CONSTRAINT fk_bookings_package FOREIGN KEY (package_id) REFERENCES travel_packages(id) ON DELETE SET NULL"
        );
      } catch (fkErr) {
        console.warn("Could not add fk_bookings_package constraint (non-fatal):", fkErr.message);
      }
    }

    if (!bColUpdatedMap.has("package_name_snapshot")) {
      console.log("Adding column: package_name_snapshot to bookings");
      await pool.query(
        "ALTER TABLE bookings ADD COLUMN package_name_snapshot VARCHAR(255) NULL AFTER package_id"
      );
    }

    if (!bColUpdatedMap.has("package_tier_snapshot")) {
      console.log("Adding column: package_tier_snapshot to bookings");
      await pool.query(
        "ALTER TABLE bookings ADD COLUMN package_tier_snapshot VARCHAR(50) NULL AFTER package_name_snapshot"
      );
    }

    if (!bColUpdatedMap.has("package_details_snapshot")) {
      console.log("Adding column: package_details_snapshot to bookings");
      await pool.query(
        "ALTER TABLE bookings ADD COLUMN package_details_snapshot JSON NULL AFTER package_tier_snapshot"
      );
    }

    // 7. Seed Initial Authentic Partners, Packages, and Services if empty
    const [existingPkgs] = await pool.query("SELECT COUNT(*) as count FROM travel_packages");
    if (existingPkgs[0].count === 0) {
      console.log("Seeding initial authentic travel packages, partners, and supplier services...");

      // 1. Seed Partners
      const [p1] = await pool.query(
        `INSERT INTO partners (partner_code, name, contact_person, email, phone, service_category, destination_id, operating_area, address, payment_terms, status, internal_notes)
         VALUES ('PRT-KER-STAY-01', 'Munnar Highland Heritage Resorts', 'Biju Varghese', 'bookings@munnarhighlands.in', '+91 94471 23456', 'hotel', 1, 'Munnar & Devikulam', 'Pothamedu, Munnar, Kerala 685612', 'Net 15 days on check-out voucher', 'active', 'Tier 1 verified stay partner with solar heating and tea view balconies')`
      );
      const partnerHotelId = p1.insertId;

      const [p2] = await pool.query(
        `INSERT INTO partners (partner_code, name, contact_person, email, phone, service_category, destination_id, operating_area, address, payment_terms, status, internal_notes)
         VALUES ('PRT-KER-BOAT-02', 'Vembanad Backwaters Luxury Houseboats', 'Mathew Abraham', 'captain@vembanadcruises.com', '+91 98470 56789', 'hotel', 1, 'Alleppey & Kumarakom', 'Finishing Point, Punnamada, Alleppey 688013', '50% advance, 50% on departure', 'active', 'A/C Kerala government certified eco-friendly kettuvallam boats with private chef')`
      );
      const partnerBoatId = p2.insertId;

      const [p3] = await pool.query(
        `INSERT INTO partners (partner_code, name, contact_person, email, phone, service_category, destination_id, operating_area, address, payment_terms, status, internal_notes)
         VALUES ('PRT-KER-TRANS-03', 'Malabar Coastline Chauffeur Fleet', 'Najeeb Mohammed', 'ops@malabarcabs.in', '+91 98950 11223', 'transport', 1, 'Kochi, Munnar, Alleppey, Thekkady', 'Airport Hub, Nedumbassery, Kochi 683111', 'Weekly reconciliation per trip sheet', 'active', 'Clean sanitized Innova Crysta & Ertiga vehicles with experienced hill drivers')`
      );
      const partnerTransportId = p3.insertId;

      const [p4] = await pool.query(
        `INSERT INTO partners (partner_code, name, contact_person, email, phone, service_category, destination_id, operating_area, address, payment_terms, status, internal_notes)
         VALUES ('PRT-KER-ACTIVITY-04', 'Western Ghats Ecotours & Plantation Trails', 'Anil Kumar Pillai', 'guide@westernghats.org', '+91 94460 77889', 'activity', 1, 'Munnar & Eravikulam', 'Nullatanni, Munnar, Kerala 685612', 'Monthly corporate billing', 'active', 'Licensed tea plantation guides, spice garden tours, and wildlife permits')`
      );
      const partnerActivityId = p4.insertId;

      const [p5] = await pool.query(
        `INSERT INTO partners (partner_code, name, contact_person, email, phone, service_category, destination_id, operating_area, address, payment_terms, status, internal_notes)
         VALUES ('PRT-KER-GUIDE-05', 'Gods Own Country Native Historians', 'Saritha Nair', 'heritage@keralaguides.org', '+91 97455 33445', 'guide', 1, 'Kerala Heritage Circuit', 'Fort Kochi, Kochi, Kerala 682001', 'Per tour completion voucher', 'active', 'English and Hindi fluent certified cultural storytellers')`
      );
      const partnerGuideId = p5.insertId;

      // 2. Seed Package 1: Kerala Explorer (Standard Tier)
      const p1Inclusions = JSON.stringify([
        "3 Nights Handpicked Stays (2 Nights Munnar Hillside Cottage + 1 Night Alleppey Deluxe Houseboat)",
        "Daily Fresh Mountain Breakfast & 1 Traditional Kerala Houseboat Dinner",
        "Private AC Sedan Transfer for Airport/Station Pickup, Drop, and All Sightseeing",
        "Guided Tea Plantation & Factory Walk with Tea Tasting Session",
        "Scenic 3-Hour Alleppey Backwater Canal Cruise",
        "All Tolls, Fuel, Parking Fees, and Experienced Chauffeur Allowances"
      ]);
      const p1Exclusions = JSON.stringify([
        "Airfare or Train tickets to and from Kochi / Ernakulam",
        "Entry ticket fees at Eravikulam National Park and Mattupetty Dam (payable on spot)",
        "Personal laundry, beverage mini-bar, and discretionary driver tips",
        "Any additional meals or activities not listed in inclusions"
      ]);
      const p1Itinerary = JSON.stringify([
        {
          day: 1,
          title: "Kochi Arrival & Scenic Drive to Munnar Hills",
          description: "Warm welcome at Cochin International Airport (COK) or Ernakulam Junction. Enjoy a picturesque 4-hour drive climbing into the Western Ghats past Cheeyappara and Valara waterfalls. Check into your hillside cottage and relax with high-altitude fresh tea.",
          activities: ["Airport/station pickup in private AC cab", "Scenic waterfall stops along Neriamangalam route", "Evening plantation resort check-in"]
        },
        {
          day: 2,
          title: "Munnar Tea Gardens, Echo Point & Kundala Lake",
          description: "Wake up to misty green valleys. Explore Mattupetty Dam, Echo Point, and Kundala Lake. Visit an authentic colonial tea processing factory and understand the journey from leaf to cup.",
          activities: ["Morning visit to Echo Point & Kundala Lake", "Tea museum & historic factory tasting walk", "Sunset vantage point at Photo Point"]
        },
        {
          day: 3,
          title: "Munnar to Alleppey Houseboat Backwater Cruise",
          description: "Descend the hills towards the tranquil backwaters of Alleppey. Board your traditional Kerala kettuvallam houseboat. Cruise through palm-fringed lagoons, paddy fields, and quiet canal hamlets while chef prepares fresh Karimeen fish curry and coconut rice.",
          activities: ["Scenic transfer to Alleppey jetty", "Check-in aboard traditional wooden houseboat", "Freshly prepared candle-lit Kerala dinner under starry skies"]
        },
        {
          day: 4,
          title: "Morning Village Cruise & Departure via Kochi",
          description: "Enjoy breakfast as morning prayers echo across the serene waterways. Disembark at 09:30 AM and transfer back to Kochi for heritage sightseeing in Fort Kochi (Chinese fishing nets) before your flight or train home.",
          activities: ["Morning calm backwater cruise", "Optional Fort Kochi heritage stop", "Drop-off at Cochin Airport / Railway Station"]
        }
      ]);

      const [pkg1] = await pool.query(
        `INSERT INTO travel_packages (
          destination_id, package_code, name, tagline, tier, description, duration_days, duration_nights,
          accommodation_type, meal_plan, transport_type, pickup_drop, inclusions, exclusions, itinerary,
          important_instructions, cancellation_policy, price_per_person, original_price, pricing_type,
          max_capacity, is_featured, status
        ) VALUES (
          1, 'PKG-KER-EXPLORER', 'Kerala Explorer — Classic Backwaters & Tea Trails',
          'Houseboat cruise, mist-clad Munnar tea hills, and authentic Kerala homestays',
          'standard',
          'Designed for travelers who want to experience the quintessential wonders of Kerala without unnecessary frills. From cool mountain breezes in Munnar to gentle drifting along the Vembanad backwaters, this tour balances essential sights with restful pauses.',
          4, 3,
          '3-Star Deluxe Plantation Resort & A/C Private Houseboat',
          'Breakfast Included Daily + 1 Houseboat Full Dinner',
          'Private AC Sedan (Dzire / Etios) with Local Chauffeur',
          'Cochin International Airport (COK) or Ernakulam Railway Station',
          ?, ?, ?,
          'Please carry light woollens for Munnar evenings (14°C - 18°C). Houseboat air conditioning operates from 9:00 PM to 6:00 AM in standard package.',
          '100% Free Cancellation up to 72 hours before arrival. Cancellations within 72 hours are subject to 1-night retention.',
          18500.00, 24000.00, 'per_person', 24, 1, 'active'
        )`,
        [p1Inclusions, p1Exclusions, p1Itinerary]
      );
      const pkg1Id = pkg1.insertId;

      // Link Partner Services for Package 1
      await pool.query(
        `INSERT INTO package_partner_services (package_id, partner_id, service_name, service_type, cost_amount, pricing_basis, notes) VALUES
         (?, ?, 'Munnar Highland Resort 2-Night Stay with Breakfast', 'accommodation', 6000.00, 'per_traveler', 'Double sharing room, breakfast included'),
         (?, ?, 'Alleppey Kettuvallam 1-Night Deluxe Cruise with Dinner', 'accommodation', 4500.00, 'per_traveler', 'Private deluxe room, dinner + breakfast included'),
         (?, ?, 'Private AC Sedan Kochi-Munnar-Alleppey-Kochi', 'transport', 3500.00, 'per_traveler', 'All fuel, tolls, and chauffeur fee included'),
         (?, ?, 'Tea Factory Tour & Scenic Spice Garden Access', 'activity', 800.00, 'per_traveler', 'Entry passes + tea tasting'),
         (?, ?, 'Fort Kochi Local Heritage Storyteller', 'guide', 400.00, 'per_traveler', '2-hour walking tour')`,
        [pkg1Id, partnerHotelId, pkg1Id, partnerBoatId, pkg1Id, partnerTransportId, pkg1Id, partnerActivityId, pkg1Id, partnerGuideId]
      );

      // 3. Seed Package 2: Kerala Comfort Escape (Comfort Tier)
      const p2Inclusions = JSON.stringify([
        "4 Nights Upgraded 4-Star Stays (2N Munnar Cloud Chalet + 1N Thekkady Spice Haven + 1N Alleppey Lake Resort)",
        "Daily Buffet Breakfast & 4-Course Chef Dinners (Half Board MAP Plan)",
        "Private AC SUV (Toyota Innova Crysta) with Professional Uniformed Chauffeur",
        "Exclusive Sunset Shikara Canal Safari through Narrow Village Waterways",
        "Periyar Wildlife Sanctuary Guided Boat Safari & Kalaripayattu Martial Arts Show",
        "24/7 Dedicated Roamly Holiday Concierge & Mineral Water in Vehicle"
      ]);
      const p2Exclusions = JSON.stringify([
        "Airfare or Train tickets",
        "Optional Ayurvedic Spa Massage (discounted vouchers available via concierge)",
        "Personal alcoholic beverages & room service outside package meal plan",
        "Elephant safari or bamboo rafting (available as add-ons)"
      ]);
      const p2Itinerary = JSON.stringify([
        {
          day: 1,
          title: "Kochi to Munnar via Pine Valley & Tea Valleys",
          description: "Executive pickup in an Innova Crysta. Stop at spice plantations in Adimali and arrive in Munnar. Check into your valley-view balcony chalet.",
          activities: ["Executive SUV transfer", "Spice garden tour with herbal tasting", "Welcome dinner at Mountain Chalet"]
        },
        {
          day: 2,
          title: "Eravikulam Nilgiri Tahr Safari & Tea Tasting",
          description: "Morning visit to Eravikulam National Park to witness the endangered Nilgiri Tahr mountain goats. Afternoon visit to top station vantage point.",
          activities: ["Eravikulam wildlife safari with pre-booked passes", "Private tea tasting at estate", "Candlelit dinner at resort"]
        },
        {
          day: 3,
          title: "Munnar to Thekkady Cardamom Hills",
          description: "Scenic 3-hour hill drive to Thekkady (Periyar). Evening traditional Kalaripayattu martial arts show and spice market exploration.",
          activities: ["Hill transfer to Thekkady", "Periyar lake boating reserve", "Kalaripayattu live martial arts display"]
        },
        {
          day: 4,
          title: "Thekkady to Alleppey Luxury Houseboat Villa",
          description: "Drive down to Alleppey backwaters. Board a premium air-conditioned houseboat villa with large glass observation deck. Evening Shikara excursion.",
          activities: ["Houseboat villa boarding", "Chef special multi-course traditional Sadya lunch", "Village sunset Shikara boat ride"]
        },
        {
          day: 5,
          title: "Morning Waterside Serenity & Kochi Return",
          description: "Wake to bird calls over the misty waters. Disembark and visit Fort Kochi heritage streets and cafes before airport transfer.",
          activities: ["Breakfast on water", "Fort Kochi colonial cafe stop", "Comfort airport drop"]
        }
      ]);

      const [pkg2] = await pool.query(
        `INSERT INTO travel_packages (
          destination_id, package_code, name, tagline, tier, description, duration_days, duration_nights,
          accommodation_type, meal_plan, transport_type, pickup_drop, inclusions, exclusions, itinerary,
          important_instructions, cancellation_policy, price_per_person, original_price, pricing_type,
          max_capacity, is_featured, status
        ) VALUES (
          1, 'PKG-KER-COMFORT', 'Kerala Comfort Escape — Mist Valleys & Lakeside Haven',
          'Upgraded 4-star mountain chalets, private Innova SUV, and Periyar wildlife safaris',
          'comfort',
          'A thoughtfully upgraded holiday offering superior accommodation, larger vehicles, and immersive cultural showcases. Designed for families and couples seeking effortless comfort across the hills and backwaters.',
          5, 4,
          '4-Star Premium Mountain Balcony Chalet & Private Lake Houseboat Villa',
          'Half Board: Daily Gourmet Breakfast + 4-Course Dinners Included',
          'Private AC Toyota Innova Crysta with Dedicated Chauffeur',
          'Cochin International Airport (COK) or Ernakulam Junction',
          ?, ?, ?,
          'Comfort tier includes full-time air conditioning aboard the houseboat and priority fast-track check-ins.',
          '100% Free Cancellation up to 96 hours before departure. Instant full refund to original payment source.',
          29500.00, 38000.00, 'per_person', 18, 1, 'active'
        )`,
        [p2Inclusions, p2Exclusions, p2Itinerary]
      );
      const pkg2Id = pkg2.insertId;

      // Link Partner Services for Package 2
      await pool.query(
        `INSERT INTO package_partner_services (package_id, partner_id, service_name, service_type, cost_amount, pricing_basis, notes) VALUES
         (?, ?, 'Munnar 4-Star Balcony Chalet (2 Nights, MAP plan)', 'accommodation', 9000.00, 'per_traveler', 'Balcony valley view, breakfast + dinner included'),
         (?, ?, 'Thekkady Spice Resort (1 Night, MAP plan)', 'accommodation', 4000.00, 'per_traveler', 'Deluxe room with plantation dinner'),
         (?, ?, 'Alleppey Premium Houseboat Villa (1 Night, Full Board)', 'accommodation', 6500.00, 'per_traveler', 'Full-time AC, chef dining'),
         (?, ?, 'Innova Crysta 5-Day Chauffeur Service', 'transport', 5500.00, 'per_traveler', 'All fuel, driver allowances, and tolls included'),
         (?, ?, 'Periyar Wildlife Boating & Kalaripayattu VIP Tickets', 'activity', 1500.00, 'per_traveler', 'VIP front-row entry passes'),
         (?, ?, 'Dedicated Kerala Heritage Guide & Concierge Service', 'guide', 1000.00, 'per_traveler', 'Professional support throughout')`,
        [pkg2Id, partnerHotelId, pkg2Id, partnerHotelId, pkg2Id, partnerBoatId, pkg2Id, partnerTransportId, pkg2Id, partnerActivityId, pkg2Id, partnerGuideId]
      );

      // 4. Seed Package 3: Kerala Premium Experience (Premium Tier)
      const p3Inclusions = JSON.stringify([
        "5 Nights Ultra-Luxury Sanctuary Living (3N Relais & Chateaux / Windermere Estate + 2N Glass-Cabin Houseboat Villa)",
        "All Gourmet Meals Included (Full Board Chef Experience with Private Dining setups)",
        "Private Luxury SUV with Fluent English-Speaking Chauffeur & Curated Refreshments",
        "90-Minute Authentic Ayurvedic Rejuvenation Spa Session for Each Traveler",
        "Private Motorboat Cruise through Silent Backwater Lagoons & Bird Sanctuaries",
        "Personal Heritage Historian Guide accompanying all key excursions",
        "VIP Fast-Track Airport Assistance & Direct Chauffeur Transfers"
      ]);
      const p3Exclusions = JSON.stringify([
        "Commercial flight tickets",
        "International travel insurance (available via concierge)",
        "Discretionary personal shopping and high-end antiques"
      ]);
      const p3Itinerary = JSON.stringify([
        {
          day: 1,
          title: "VIP Kochi Arrival & Colonial Planter Estate Welcome",
          description: "VIP airport reception and transfer to a century-old private tea planter's estate. Welcome high tea on verandah with views of misty peaks.",
          activities: ["VIP airport greeting", "Scenic tea estate arrival", "4-course colonial planter dinner"]
        },
        {
          day: 2,
          title: "Private Tea Sanctuary Walks & Waterfall Champagne Picnic",
          description: "Exclusive walk with estate naturalist. Private waterfall picnic with gourmet hamper. Afternoon private tea tasting and masterclass.",
          activities: ["Estate naturalist walking trail", "Private gourmet picnic lunch", "Heritage tea tasting masterclass"]
        },
        {
          day: 3,
          title: "Ayurvedic Spa Rejuvenation & Starlit Terrace Dining",
          description: "Morning Ayurvedic consultation and 90-minute Abhyanga therapeutic massage. Afternoon relaxing in private estate gardens overlooking valleys.",
          activities: ["Ayurvedic wellness massage", "Cooking demonstration with executive chef", "Starlit candlelit dinner"]
        },
        {
          day: 4,
          title: "Transfer to Private Glass-Cabin Luxury Houseboat",
          description: "Scenic transfer to Alleppey. Board an exclusive ultra-luxury glass-walled houseboat. Cruise untouched lagoons inaccessible to standard tourist boats.",
          activities: ["Private luxury houseboat boarding", "Fresh prawn and pearl spot seafood lunch", "Sunset kayak or tender boat excursion"]
        },
        {
          day: 5,
          title: "Kumarakom Bird Sanctuary & Floating High Tea",
          description: "Early morning private canoe into Kumarakom Bird Sanctuary. Afternoon floating high tea with regional delicacies as sun sets over lake Vembanad.",
          activities: ["Dawn birding expedition with naturalist", "Floating high tea on lake", "Chef curated farewell royal banquet"]
        },
        {
          day: 6,
          title: "Gourmet Breakfast & VIP Airport Departure",
          description: "Champagne breakfast on deck. Chauffeur transfer to Cochin International Airport with fast-track check-in support.",
          activities: ["Champagne breakfast", "Artisan souvenir hamper gifting", "Executive airport drop"]
        }
      ]);

      const [pkg3] = await pool.query(
        `INSERT INTO travel_packages (
          destination_id, package_code, name, tagline, tier, description, duration_days, duration_nights,
          accommodation_type, meal_plan, transport_type, pickup_drop, inclusions, exclusions, itinerary,
          important_instructions, cancellation_policy, price_per_person, original_price, pricing_type,
          max_capacity, is_featured, status
        ) VALUES (
          1, 'PKG-KER-PREMIUM', 'Kerala Premium Experience — Royal Palaces & Private Backwater Sanctuary',
          'Colonial tea planter estates, Relais & Chateaux luxury, private Ayurvedic spas, and glass houseboats',
          'premium',
          'The pinnacle of Kerala luxury travel. Designed for discerning travelers seeking privacy, world-class gastronomy, and deep restorative wellness across the most breathtaking landscapes of South India.',
          6, 5,
          '5-Star Relais & Chateaux Tea Estate & Private Ultra-Luxury Glass Houseboat',
          'Full Board: All Gourmet Chef Meals, Floating High Teas & Champagne Breakfasts',
          'Private Luxury SUV (Innova Hycross / Fortuner) with Senior Chauffeur',
          'Cochin International Airport (COK) VIP Gate',
          ?, ?, ?,
          'Includes private butler service, daily laundry, and complimentary 90-minute Ayurvedic spa therapy.',
          '100% Free Cancellation up to 7 days prior to arrival with full refund.',
          48000.00, 62000.00, 'per_person', 12, 1, 'active'
        )`,
        [p3Inclusions, p3Exclusions, p3Itinerary]
      );
      const pkg3Id = pkg3.insertId;

      // Link Partner Services for Package 3
      await pool.query(
        `INSERT INTO package_partner_services (package_id, partner_id, service_name, service_type, cost_amount, pricing_basis, notes) VALUES
         (?, ?, 'Relais & Chateaux Colonial Tea Estate (3 Nights, Full Board)', 'accommodation', 18000.00, 'per_traveler', 'Private plantation villa, all gourmet meals included'),
         (?, ?, 'Private Glass-Cabin Ultra-Luxury Houseboat (2 Nights, Full Board)', 'accommodation', 12000.00, 'per_traveler', 'Private chef and 24/7 dedicated crew'),
         (?, ?, 'Luxury SUV Hycross 6-Day Executive Service', 'transport', 7500.00, 'per_traveler', 'Executive chauffeur, premium refreshments'),
         (?, ?, 'Ayurvedic 90-Minute Rejuvenation Spa Session', 'activity', 3500.00, 'per_traveler', 'Certified Ayurvedic doctor consultation + Abhyanga treatment'),
         (?, ?, 'Private Naturalist & Kumarakom Bird Sanctuary Guide', 'guide', 2000.00, 'per_traveler', 'Exclusive private guide service throughout')`,
        [pkg3Id, partnerHotelId, pkg3Id, partnerBoatId, pkg3Id, partnerTransportId, pkg3Id, partnerActivityId, pkg3Id, partnerGuideId]
      );

      // Seed initial Business Operating Expenses for Real Profit Analysis
      await pool.query(
        `INSERT INTO business_expenses (expense_code, category, amount, currency, expense_date, package_id, destination_id, vendor_name, description, payment_status, invoice_ref) VALUES
         ('EXP-2026-001', 'marketing', 12500.00, 'INR', '2026-10-15', ?, 1, 'Meta & Google Ads India', 'Targeted search & Instagram campaigns for Kerala high-season bookings', 'paid', 'INV-META-98231'),
         ('EXP-2026-002', 'operations', 4800.00, 'INR', '2026-10-20', ?, 1, 'Kerala Tourism Board & Forest Dept', 'Annual destination operator permits and wildlife licensing fees', 'paid', 'INV-KTB-4412'),
         ('EXP-2026-003', 'gateway_fee', 2240.00, 'INR', '2026-10-25', NULL, NULL, 'Razorpay Software Pvt Ltd', 'Payment gateway processing fees for October verified transactions', 'paid', 'RZP-STMT-OCT26')`,
        [pkg1Id, pkg2Id]
      );

      console.log("Seeding complete! 5 Partners, 3 Kerala Travel Packages, and initial Business Expenses created.");
    }

    console.log("All migrations and checks completed successfully!");
    const [finalSchema] = await pool.query("DESCRIBE bookings");
    console.table(finalSchema);
    const [pkgSchema] = await pool.query("DESCRIBE travel_packages");
    console.table(pkgSchema);
    const [prtSchema] = await pool.query("DESCRIBE partners");
    console.table(prtSchema);
    const [ppsSchema] = await pool.query("DESCRIBE package_partner_services");
    console.table(ppsSchema);
    const [expSchema] = await pool.query("DESCRIBE business_expenses");
    console.table(expSchema);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;

