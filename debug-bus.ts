import { resolveIxigoCity } from "./lib/providers/ixigo/cityResolve";
import { ixigoBusProvider } from "./lib/providers/ixigoBus";
import { ixigoGetBusList } from "./lib/providers/ixigo/client";

// Test Pune to Mumbai route
async function testPuneMumbai() {
  console.log("Testing Pune to Mumbai bus route...");

  const puneCode = "PUNE";
  const mumbaiCode = "MUMBAI"; // or "BCT" for Mumbai Central

  try {
    const [puneMatch, mumbaiMatch] = await Promise.all([
      resolveIxigoCity(puneCode),
      resolveIxigoCity(mumbaiCode)
    ]);

    console.log("Pune match:", puneMatch);
    console.log("Mumbai match:", mumbaiMatch);

    if (!puneMatch || !mumbaiMatch) {
      console.error("Failed to resolve city matches");
      return;
    }

    // Test the provider search method
    console.log("Testing ixigoBusProvider.search...");
    const legs = await ixigoBusProvider.search(puneCode, mumbaiCode, "2026-08-31");
    console.log("Found legs:", legs.length);
    console.log("First few legs:", legs.slice(0, 3));

  } catch (error) {
    console.error("Error:", error);
  }
}

testPuneMumbai();