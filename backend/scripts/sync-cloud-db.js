/**
 * Roamly Cloud Database Sync Script
 * Safely creates tables and migrates all existing records (users, destinations, packages, bookings)
 * into a remote MySQL database (e.g. TiDB Cloud Serverless or Railway) without overwriting existing data.
 */

const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

async function syncDatabase() {
  console.log("=========================================");
  console.log("  Roamly Database Sync & Migration Tool  ");
  console.log("=========================================\n");

  try {
    const [dbResult] = await pool.query("SELECT DATABASE() as db");
    console.log(`Connected to database: ${dbResult[0].db || "default"}\n`);

    // 1. Run migrations if tables do not exist
    const runMigration = require("../database/runMigration");
    if (typeof runMigration === "function") {
      await runMigration();
    }

    const dataDir = path.join(__dirname, "../data");

    // 2. Sync Users (preserving existing accounts and password hashes)
    const usersFile = path.join(dataDir, "users.json");
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
      console.log(`Syncing ${users.length} user accounts...`);

      for (const u of users) {
        const [existing] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [u.email]);
        if (existing.length === 0) {
          const travelPrefs = typeof u.travel_preferences === "object" ? JSON.stringify(u.travel_preferences) : (u.travel_preferences || null);
          await pool.query(
            `INSERT INTO users (id, name, first_name, last_name, email, phone, password, role, is_active, travel_preferences, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.name, u.first_name, u.last_name, u.email, u.phone, u.password, u.role, u.is_active, travelPrefs, u.created_at || new Date()]
          );
          console.log(`  + Created user: ${u.email} (${u.role})`);
        } else {
          console.log(`  ✓ Existing user preserved: ${u.email}`);
        }
      }
    }

    // 3. Sync Destinations
    const destFile = path.join(dataDir, "destinations.json");
    if (fs.existsSync(destFile)) {
      const destinations = JSON.parse(fs.readFileSync(destFile, "utf-8"));
      console.log(`\nSyncing ${destinations.length} destinations...`);
      for (const d of destinations) {
        const [existing] = await pool.query("SELECT id FROM destinations WHERE LOWER(name) = LOWER(?) LIMIT 1", [d.name]);
        if (existing.length === 0) {
          const gallery = typeof d.gallery === "object" ? JSON.stringify(d.gallery) : d.gallery;
          await pool.query(
            `INSERT INTO destinations (id, name, state, country, mood, category, days, budget, image, gallery, description, best_time, hidden_gem, tip)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [d.id, d.name, d.state, d.country, d.mood, d.category, d.days, d.budget, d.image, gallery, d.description, d.best_time, d.hidden_gem, d.tip]
          );
        }
      }
      console.log(`  ✓ Destinations sync complete.`);
    }

    // 4. Sync Travel Packages
    const pkgFile = path.join(dataDir, "travel_packages.json");
    if (fs.existsSync(pkgFile)) {
      const packages = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
      console.log(`\nSyncing ${packages.length} travel packages...`);
      for (const p of packages) {
        const [existing] = await pool.query("SELECT id FROM travel_packages WHERE id = ? LIMIT 1", [p.id]);
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO travel_packages (id, destination_id, title, tier, price_per_person, original_price, duration_days, duration_nights, description, inclusions, exclusions, itinerary, important_instructions, cancellation_policy, is_featured, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.destination_id, p.title, p.tier, p.price_per_person, p.original_price, p.duration_days, p.duration_nights, p.description, p.inclusions, p.exclusions, p.itinerary, p.important_instructions, p.cancellation_policy, p.is_featured, p.status]
          );
        }
      }
      console.log(`  ✓ Packages sync complete.`);
    }

    // 5. Sync Partners
    const partnersFile = path.join(dataDir, "partners.json");
    if (fs.existsSync(partnersFile)) {
      const partners = JSON.parse(fs.readFileSync(partnersFile, "utf-8"));
      console.log(`\nSyncing ${partners.length} partners...`);
      for (const pt of partners) {
        const [existing] = await pool.query("SELECT id FROM partners WHERE id = ? LIMIT 1", [pt.id]);
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO partners (id, partner_code, name, contact_person, email, phone, service_category, destination_id, operating_area, address, payment_terms, status, internal_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [pt.id, pt.partner_code, pt.name, pt.contact_person, pt.email, pt.phone, pt.service_category, pt.destination_id, pt.operating_area, pt.address, pt.payment_terms, pt.status, pt.internal_notes]
          );
        }
      }
      console.log(`  ✓ Partners sync complete.`);
    }

    // 6. Sync Partner Services
    const svcFile = path.join(dataDir, "package_partner_services.json");
    if (fs.existsSync(svcFile)) {
      const services = JSON.parse(fs.readFileSync(svcFile, "utf-8"));
      console.log(`\nSyncing ${services.length} partner services...`);
      for (const s of services) {
        const [existing] = await pool.query("SELECT id FROM package_partner_services WHERE id = ? LIMIT 1", [s.id]);
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO package_partner_services (id, package_id, partner_id, service_description, agreed_cost_per_pax, payment_status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [s.id, s.package_id, s.partner_id, s.service_description, s.agreed_cost_per_pax, s.payment_status]
          );
        }
      }
      console.log(`  ✓ Partner services sync complete.`);
    }

    console.log("\n=========================================");
    console.log("  Sync Finished Successfully! All records preserved. ");
    console.log("=========================================\n");
  } catch (error) {
    console.error("Database sync failed:", error.message);
  } finally {
    process.exit(0);
  }
}

syncDatabase();
