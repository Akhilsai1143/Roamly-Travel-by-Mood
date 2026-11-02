const http = require("http");

function post(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path,
        method: "POST",
        headers
      },
      (res) => {
        let resBody = "";
        res.on("data", (chunk) => (resBody += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resBody });
          }
        });
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("===============================================================");
  console.log("=== Testing Roamly AI Travel Assistant 8 User Questions ===");
  console.log("===============================================================\n");

  let allPassed = true;

  // Question 1: "What is the highest cost in your packages?"
  console.log("[Test 1]: 'What is the highest cost in your packages?'");
  const res1 = await post("/api/ai/chat", { message: "What is the highest cost in your packages?" });
  const hasHighestPkg = res1.data?.reply?.includes("Ladakh Royal Sanctuary") || res1.data?.reply?.includes("58,000");
  const has58000 = res1.data?.reply?.includes("58,000");
  const intent1 = res1.data?.intent === "PACKAGE_PRICE_HIGHEST";
  console.log(`  - Status: ${res1.status}`);
  console.log(`  - Intent: ${res1.data?.intent} (Expected: PACKAGE_PRICE_HIGHEST) -> ${intent1 ? "PASS" : "FAIL"}`);
  console.log(`  - Mentions Highest Package: ${hasHighestPkg ? "PASS" : "FAIL"}`);
  console.log(`  - Mentions exact price '58,000': ${has58000 ? "PASS" : "FAIL"}`);
  console.log(`  - Package Card returned: ${res1.data?.packages?.length === 1 ? "PASS" : "FAIL"}`);
  if (!hasHighestPkg || !has58000 || !intent1) allPassed = false;

  // Question 2: "What is the cheapest package?"
  console.log("\n[Test 2]: 'What is the cheapest package?'");
  const res2 = await post("/api/ai/chat", { message: "What is the cheapest package?" });
  const hasCheapestPkg = res2.data?.reply?.includes("Goa Coastal Breeze") || res2.data?.reply?.includes("14,500");
  const has14500 = res2.data?.reply?.includes("14,500");
  const intent2 = res2.data?.intent === "PACKAGE_PRICE_LOWEST";
  console.log(`  - Status: ${res2.status}`);
  console.log(`  - Intent: ${res2.data?.intent} (Expected: PACKAGE_PRICE_LOWEST) -> ${intent2 ? "PASS" : "FAIL"}`);
  console.log(`  - Mentions Cheapest Package (Goa Coastal Breeze): ${hasCheapestPkg ? "PASS" : "FAIL"}`);
  console.log(`  - Mentions exact price '14,500': ${has14500 ? "PASS" : "FAIL"}`);
  console.log(`  - Package Card returned: ${res2.data?.packages?.length === 1 ? "PASS" : "FAIL"}`);
  if (!hasCheapestPkg || !has14500 || !intent2) allPassed = false;

  // Question 3: "Show me packages under ₹10,000."
  console.log("\n[Test 3]: 'Show me packages under ₹10,000.'");
  const res3 = await post("/api/ai/chat", { message: "Show me packages under ₹10,000." });
  const statesNoPackages = res3.data?.reply?.includes("do not have any travel packages") && res3.data?.reply?.includes("10,000");
  const packageCount3 = res3.data?.packages?.length === 0;
  console.log(`  - Status: ${res3.status}`);
  console.log(`  - Intent: ${res3.data?.intent} (Expected: PACKAGE_SEARCH)`);
  console.log(`  - Honestly states no packages under ₹10,000: ${statesNoPackages ? "PASS" : "FAIL"}`);
  console.log(`  - Does NOT return false package cards (packages count = 0): ${packageCount3 ? "PASS" : "FAIL"}`);
  if (!statesNoPackages || !packageCount3) allPassed = false;

  // Question 4: "Suggest peaceful mountain destinations."
  console.log("\n[Test 4]: 'Suggest peaceful mountain destinations.'");
  const res4 = await post("/api/ai/chat", { message: "Suggest peaceful mountain destinations." });
  const hasMountainDest = res4.data?.destinations?.length > 0;
  const packageCount4 = res4.data?.packages?.length === 0;
  console.log(`  - Status: ${res4.status}`);
  console.log(`  - Intent: ${res4.data?.intent} (Expected: DESTINATION_RECOMMENDATION)`);
  console.log(`  - Destinations returned: ${res4.data?.destinations?.map(d => d.name).join(", ")}`);
  console.log(`  - Does NOT force package recommendations (packages count = 0): ${packageCount4 ? "PASS" : "FAIL"}`);
  if (!hasMountainDest || !packageCount4) allPassed = false;

  // Question 5: "What is the weather like in Ooty?"
  console.log("\n[Test 5]: 'What is the weather like in Ooty?'");
  const res5 = await post("/api/ai/chat", { message: "What is the weather like in Ooty?" });
  const mentionsRealtimeLimitation = res5.data?.reply?.includes("real-time") || res5.data?.reply?.includes("live");
  const mentionsOoty = res5.data?.reply?.includes("Ooty");
  const packageCount5 = res5.data?.packages?.length === 0;
  console.log(`  - Status: ${res5.status}`);
  console.log(`  - Intent: ${res5.data?.intent} (Expected: TRAVEL_INFORMATION)`);
  console.log(`  - Explains live weather limitation honestly: ${mentionsRealtimeLimitation ? "PASS" : "FAIL"}`);
  console.log(`  - Provides Ooty seasonal climate: ${mentionsOoty ? "PASS" : "FAIL"}`);
  console.log(`  - Does NOT force package recommendations (packages count = 0): ${packageCount5 ? "PASS" : "FAIL"}`);
  if (!mentionsRealtimeLimitation || !mentionsOoty || !packageCount5) allPassed = false;

  // Question 6: "Create a 3-day itinerary for Goa."
  console.log("\n[Test 6]: 'Create a 3-day itinerary for Goa.'");
  const res6 = await post("/api/ai/chat", { message: "Create a 3-day itinerary for Goa." });
  const hasDay1 = res6.data?.reply?.includes("Day 1");
  const hasDay2 = res6.data?.reply?.includes("Day 2");
  const hasDay3 = res6.data?.reply?.includes("Day 3");
  const mentionsGoa = res6.data?.reply?.includes("Goa");
  const packageCount6 = res6.data?.packages?.length === 0;
  console.log(`  - Status: ${res6.status}`);
  console.log(`  - Intent: ${res6.data?.intent} (Expected: ITINERARY_GENERATION)`);
  console.log(`  - Structured Day 1, 2, 3 itinerary for Goa: ${hasDay1 && hasDay2 && hasDay3 && mentionsGoa ? "PASS" : "FAIL"}`);
  console.log(`  - Does NOT force package recommendations (packages count = 0): ${packageCount6 ? "PASS" : "FAIL"}`);
  if (!hasDay1 || !hasDay2 || !hasDay3 || !packageCount6) allPassed = false;

  // Question 7: "Hello."
  console.log("\n[Test 7]: 'Hello.'");
  const res7 = await post("/api/ai/chat", { message: "Hello." });
  const isGreeting = res7.data?.reply?.includes("Aria") || res7.data?.reply?.includes("Hello");
  const doesNotHavePackagesHeading = !res7.data?.reply?.includes("Verified Travel Packages for You");
  const packageCount7 = res7.data?.packages?.length === 0;
  console.log(`  - Status: ${res7.status}`);
  console.log(`  - Intent: ${res7.data?.intent} (Expected: GENERAL_CHAT)`);
  console.log(`  - Natural greeting from Aria: ${isGreeting ? "PASS" : "FAIL"}`);
  console.log(`  - Does NOT show package recommendation: ${doesNotHavePackagesHeading && packageCount7 ? "PASS" : "FAIL"}`);
  if (!isGreeting || !doesNotHavePackagesHeading || !packageCount7) allPassed = false;

  // Question 8: "Compare the Kerala and Goa packages."
  console.log("\n[Test 8]: 'Compare the Kerala and Goa packages.'");
  const res8 = await post("/api/ai/chat", { message: "Compare the Kerala and Goa packages." });
  const mentionsKerala = res8.data?.reply?.includes("Kerala");
  const mentionsGoaPackages = res8.data?.reply?.includes("Goa Packages");
  console.log(`  - Status: ${res8.status}`);
  console.log(`  - Intent: ${res8.data?.intent} (Expected: PACKAGE_COMPARISON)`);
  console.log(`  - Mentions Kerala packages: ${mentionsKerala ? "PASS" : "FAIL"}`);
  console.log(`  - Mentions Goa packages: ${mentionsGoaPackages ? "PASS" : "FAIL"}`);
  if (!mentionsKerala || !mentionsGoaPackages) allPassed = false;

  // Test 9: Consecutive multi-turn questions in same chat session
  console.log("\n[Test 9]: Consecutive Multi-Turn Conversation");
  const history = [
    { role: "user", text: "Hello." },
    { role: "assistant", text: res7.data?.reply }
  ];
  // Next question in session: "What is the highest cost in your packages?"
  const res9 = await post("/api/ai/chat", {
    message: "What is the highest cost in your packages?",
    history
  });
  const turn2Success = res9.data?.intent === "PACKAGE_PRICE_HIGHEST" && (res9.data?.reply?.includes("Ladakh Royal Sanctuary") || res9.data?.reply?.includes("58,000"));
  console.log(`  - Consecutive Turn 2 (Highest cost): ${turn2Success ? "PASS" : "FAIL"}`);
  if (!turn2Success) allPassed = false;

  // Test 10: "i want to visit ladakh"
  console.log("\n[Test 10]: 'i want to visit ladakh'");
  const res10 = await post("/api/ai/chat", { message: "i want to visit ladakh" });
  const mentionsLadakh = res10.data?.reply?.includes("Ladakh");
  const hasLadakhPackages = res10.data?.packages?.some(p => p.name?.includes("Ladakh"));
  const notJustKerala = !res10.data?.reply?.includes("Kerala Explorer");
  console.log(`  - Status: ${res10.status}`);
  console.log(`  - Intent: ${res10.data?.intent} (Expected: DESTINATION_RECOMMENDATION)`);
  console.log(`  - Responds with Ladakh destination guide: ${mentionsLadakh ? "PASS" : "FAIL"}`);
  console.log(`  - Provides verified Ladakh packages: ${hasLadakhPackages ? "PASS" : "FAIL"}`);
  console.log(`  - Does NOT show only Kerala: ${notJustKerala ? "PASS" : "FAIL"}`);
  if (!mentionsLadakh || !hasLadakhPackages || !notJustKerala) allPassed = false;

  console.log("\n===============================================================");
  if (allPassed) {
    console.log(">>> ALL 9 TESTS PASSED 100% SUCCESSFULLY! <<<");
  } else {
    console.log(">>> SOME TESTS FAILED! CHECK OUTPUT ABOVE. <<<");
  }
  console.log("===============================================================");

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
