
const pool = require("./config/db");

async function importDestinations() {
    try {
        // Load your existing frontend destination data
        const { destinations } = await import(
            "../src/data/destinations.js"
        );

        if (!Array.isArray(destinations)) {
            throw new Error(
                "Could not find the destinations array in src/data/destinations.js"
            );
        }

        let imported = 0;
        let skipped = 0;

        for (const destination of destinations) {
            const {
                name,
                state,
                country,
                mood,
                category,
                days,
                budget,
                image,
                gallery,
                description,
                bestTime,
                hiddenGem,
                tip
            } = destination;

            if (!name || !country) {
                console.warn(
                    `Skipping destination with missing name or country: ${name || "Unknown"}`
                );
                skipped++;
                continue;
            }

            // Convert the frontend mood array into database text
            const moodValue = Array.isArray(mood)
                ? mood.join(",")
                : (mood || "");

            const galleryValue = Array.isArray(gallery)
                ? JSON.stringify(gallery)
                : (gallery || null);

            // Avoid inserting duplicate destination, but update gallery if existing
            const [existing] = await pool.query(
                `SELECT id FROM destinations
                 WHERE LOWER(name) = LOWER(?)
                 AND LOWER(country) = LOWER(?)
                 LIMIT 1`,
                [name, country]
            );

            if (existing.length > 0) {
                if (galleryValue) {
                    await pool.query(
                        `UPDATE destinations SET gallery = ? WHERE id = ?`,
                        [galleryValue, existing[0].id]
                    );
                }
                console.log(`Updated gallery for existing destination: ${name}`);
                skipped++;
                continue;
            }

            await pool.query(
                `INSERT INTO destinations (
                    name,
                    state,
                    country,
                    mood,
                    category,
                    days,
                    budget,
                    image,
                    gallery,
                    description,
                    best_time,
                    hidden_gem,
                    tip
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name,
                    state || null,
                    country,
                    moodValue,
                    category || null,
                    days || null,
                    budget || null,
                    image || null,
                    galleryValue,
                    description || null,
                    bestTime || null,
                    hiddenGem || null,
                    tip || null
                ]
            );

            console.log(`Imported: ${name}`);
            imported++;
        }

        // Also check any existing database rows that might match DESTINATION_GALLERIES (e.g. custom admin entries)
        const { DESTINATION_GALLERIES } = await import("../src/data/destinationGalleries.js");
        const slugMap = {
            "spiti valley": "spiti",
            "andaman islands": "andaman",
            "rann of kutch": "kutch",
            "swiss alps": "switzerland",
            "cape town": "cape-town"
        };
        const [allDbRows] = await pool.query("SELECT id, name, gallery FROM destinations");
        for (const row of allDbRows) {
            const nameKey = String(row.name || "").toLowerCase().trim();
            const idKey = String(row.id || "").toLowerCase().trim();
            const resolvedSlug = slugMap[nameKey] || nameKey;
            const galleryList = DESTINATION_GALLERIES[idKey] || DESTINATION_GALLERIES[resolvedSlug] || DESTINATION_GALLERIES[nameKey];
            if (galleryList && galleryList.length >= 10) {
                await pool.query(
                    `UPDATE destinations SET gallery = ? WHERE id = ?`,
                    [JSON.stringify(galleryList), row.id]
                );
                console.log(`Synced 12-photo gallery for database row: #${row.id} ${row.name}`);
            }
        }

        const [rows] = await pool.query(
            "SELECT id, name, country, JSON_LENGTH(gallery) as photo_count FROM destinations ORDER BY id"
        );

        console.log("\n========== IMPORT SUMMARY ==========");
        console.log(`Imported: ${imported}`);
        console.log(`Skipped:  ${skipped}`);
        console.log(`Total destinations in database: ${rows.length}`);
        console.log("\nDestinations currently in MySQL with gallery photo count:");

        rows.forEach((destination) => {
            console.log(
                `#${destination.id}. ${destination.name}, ${destination.country} -> ${destination.photo_count || 0} photos`
            );
        });

    } catch (error) {
        console.error("Import failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

importDestinations();
