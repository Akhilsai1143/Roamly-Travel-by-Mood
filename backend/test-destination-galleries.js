// backend/test-destination-galleries.js
const pool = require("./config/db");
const destinationController = require("./controllers/destinationController");

async function testDestinationApi() {
  try {
    console.log("Testing backend destination queries...");

    // 1. Test getDestinations (list)
    const reqMock = { query: { page: 1, limit: 10 } };
    let jsonResult = null;
    const resMock = {
      json: (data) => { jsonResult = data; }
    };
    const nextMock = (err) => { if (err) console.error(err); };

    await destinationController.getDestinations(reqMock, resMock, nextMock);

    console.log(`getDestinations returned ${jsonResult.destinations.length} destinations on page 1.`);
    for (const d of jsonResult.destinations.slice(0, 5)) {
      console.log(`  Destination: ${d.name} -> Gallery length: ${d.gallery ? d.gallery.length : 0}`);
    }

    // 2. Test getDestination by ID (e.g. Udaipur, id = 5)
    let singleDest = null;
    const reqSingle = { params: { id: 5 } };
    const resSingle = { json: (data) => { singleDest = data; } };

    await destinationController.getDestination(reqSingle, resSingle, nextMock);
    console.log(`\nSingle destination #${singleDest.id} (${singleDest.name}):`);
    console.log(`  Photo count: ${singleDest.gallery ? singleDest.gallery.length : 0}`);
    console.log(`  First photo: ${singleDest.gallery ? singleDest.gallery[0] : "none"}`);

    if (singleDest.gallery && singleDest.gallery.length === 12) {
      console.log("\n✓ PASS: Backend API returns complete 12-photo gallery correctly!");
    } else {
      console.error("\n✗ FAIL: Backend API did not return 12 photos!");
    }

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await pool.end();
  }
}

testDestinationApi();
