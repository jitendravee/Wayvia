import { resolvePlace } from "./lib/places/resolver";
import type { Place } from "./lib/places/model";

(async () => {
  const place = await resolvePlace("New Delhi");
  console.log("Resolved place:", place ? {
    id: place.id,
    name: place.name,
    normalizedName: place.normalizedName,
    flight: place.flight
  } : null);
})();
