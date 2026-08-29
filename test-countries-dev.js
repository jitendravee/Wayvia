import { fetchCountriesDevPlaces } from "./lib/places/countriesDev";

async function testCountriesDev() {
  console.log("Testing countries.dev API...");

  try {
    const places = await fetchCountriesDevPlaces("pune", 5);
    console.log("Success! Found", places.length, "places");
    console.log("First place:", JSON.stringify(places[0], null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

testCountriesDev();