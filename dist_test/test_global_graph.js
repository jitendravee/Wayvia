import { searchJourneyPlaceFirst } from './lib/journey/searchService.js';
import { ALL_MODES } from './lib/transport/registry.js';
async function testRoute(from, to, description) {
    console.log(`\n=== ${description}: ${from} → ${to} ===`);
    try {
        const result = await searchJourneyPlaceFirst(from, to, {
            date: '2026-09-01',
            modes: ALL_MODES,
            maxConnections: 2
        });
        console.log(`Direct routes: ${result.direct.length}`);
        console.log(`Via hub: ${result.viaHub.length}`);
        console.log(`Via two hubs: ${result.viaTwoHub.length}`);
        console.log(`Via three hubs: ${result.viaThreeHub.length}`);
        console.log(`Partial coverage: ${result.partial.length}`);
        console.log(`Modes available: ${result.modesAvailable.join(', ')}`);
        // Print first few routes
        if (result.direct.length > 0) {
            console.log('First direct route:');
            console.log(JSON.stringify(result.direct[0].legs, null, 2));
        }
        if (result.viaHub.length > 0) {
            console.log('First via hub route:');
            console.log(JSON.stringify(result.viaHub[0].legs, null, 2));
        }
    }
    catch (err) {
        console.error('Error:', err.message);
    }
}
// Test cases
await testRoute('Delhi', 'Mumbai', 'A. Delhi → Mumbai');
await testRoute('Pune', 'Surat', 'B. Pune → Surat');
await testRoute('Delhi', 'Surat', 'C. Delhi → Surat');
// We'll need to know a route where direct train exists, e.g., Delhi to Chandigarh? Let's use Delhi to Jaipur (there is a train)
await testRoute('Delhi', 'Jaipur', 'D. Delhi → Jaipur (direct train)');
// A route where only bus exists: maybe a small town pair without train? Hard to know. We'll try Bhopal to Indore (there is train too). Let's just pick a pair and hope.
await testRoute('Indore', 'Bhopal', 'E. Indore → Bhopal (bus/train)');
// A route where direct transport exists but multimodal also possible: Delhi to Agra (train exists, also bus)
await testRoute('Delhi', 'Agra', 'F. Delhi → Agra (direct train, also bus)');
