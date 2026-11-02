// scripts/sync-database-galleries.cjs
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
const mysql = require("mysql2/promise");
const fs = require("fs");

async function syncDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "roamly_db",
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log("Connecting to MySQL roamly_db...");
    const [rows] = await pool.query("SELECT id, name, country, image, gallery FROM destinations ORDER BY id");
    console.log(`Found ${rows.length} destinations in MySQL database.`);

    // Read the master galleries
    const galleriesJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "final-galleries-master.json"), "utf8")
    );
    const { galleries } = galleriesJson;

    // Mapping helper to map database destination name to gallery slug
    const nameToSlug = {
      "munnar": "munnar",
      "jaipur": "jaipur",
      "gokarna": "gokarna",
      "spiti valley": "spiti",
      "spiti": "spiti",
      "udaipur": "udaipur",
      "meghalaya": "meghalaya",
      "kyoto": "kyoto",
      "bali": "bali",
      "queenstown": "queenstown",
      "manali": "manali",
      "ladakh": "ladakh",
      "ooty": "ooty",
      "coorg": "coorg",
      "goa": "goa",
      "varkala": "varkala",
      "hampi": "hampi",
      "varanasi": "varanasi",
      "rishikesh": "rishikesh",
      "andaman islands": "andaman",
      "andaman": "andaman",
      "darjeeling": "darjeeling",
      "agra": "agra",
      "gulmarg": "gulmarg",
      "tawang": "tawang",
      "rann of kutch": "kutch",
      "kutch": "kutch",
      "maldives": "maldives",
      "swiss alps": "switzerland",
      "switzerland": "switzerland",
      "thailand": "thailand",
      "paris": "paris",
      "singapore": "singapore",
      "dubai": "dubai",
      "istanbul": "istanbul",
      "cape town": "cape-town",
      "cape-town": "cape-town",
      "ananthapuram": "ananthapuram",
      "kadiri": "kadiri"
    };

    let updatedCount = 0;

    for (const row of rows) {
      const lowerName = (row.name || "").toLowerCase().trim();
      const slug = nameToSlug[lowerName] || lowerName;
      const galleryList = galleries[slug];

      if (!galleryList || galleryList.length !== 12) {
        console.warn(`[!] No 12-photo gallery found for #${row.id} ${row.name} (slug: ${slug})`);
        continue;
      }

      const newImage = galleryList[0];
      const galleryJsonStr = JSON.stringify(galleryList);
      await pool.query(
        "UPDATE destinations SET gallery = ?, image = ? WHERE id = ?",
        [galleryJsonStr, newImage, row.id]
      );

      console.log(`✓ #${row.id} ${row.name} (${slug}) -> Updated gallery with 12 verified photos.`);
      updatedCount++;
    }

    console.log(`\nSuccessfully updated ${updatedCount}/${rows.length} destinations in MySQL database!`);

    // Verify database counts
    const [checkRows] = await pool.query(
      "SELECT id, name, JSON_LENGTH(gallery) as photo_count, image FROM destinations ORDER BY id"
    );

    console.log("\n================ MYSQL DATABASE VERIFICATION ================");
    console.table(
      checkRows.map((r) => ({
        id: r.id,
        name: r.name,
        photo_count: r.photo_count,
        has_primary_image: Boolean(r.image && !r.image.includes("encrypted-tbn0"))
      }))
    );

  } catch (err) {
    console.error("Database sync failed:", err);
  } finally {
    await pool.end();
  }
}

syncDatabase();
