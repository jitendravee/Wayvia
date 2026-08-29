# Fixes Implemented for Place Search/Autocomplete Architecture

## Issues Addressed

1. **Auto-selection confusion**: User reported that typing single characters would auto-select suggestions and populate input with place IDs like "place_so-paulo"
2. **Input value after selection**: User wanted input to show place names (e.g., "São Paulo") instead of place IDs after selection
3. **Architecture separation**: Ensured place suggestions use ONLY countries.dev, with no fallbacks to transport providers
4. **Performance**: Implemented proper debouncing, caching, and stale request prevention

## Changes Made

### 1. StationInput Component (`app/components/StationInput.tsx`)
- Separated `inputValue` (what user sees/types) from `placeId` (internal ID)
- When typing: updates `inputValue`, clears `placeId`
- When selecting suggestion:
  - Sets `inputValue` to place name (shows user-friendly name in input)
  - Sets `placeId` to place ID (stores internally)
  - Calls `onChange(place.id)` (sends ID to parent for internal use)
- Updated resolved name logic to work with `placeId`
- Improved initialization and external value handling

### 2. Place Search Hook (`lib/hooks/usePlaceSearch.ts`)
- Uses existing `useDebouncedValue` hook for 300ms debouncing
- Minimum query length of 2 characters
- TanStack Query for caching (5min stale, 15min cache)
- Stale request prevention via query keys
- Only queries countries.dev via `/api/places` endpoint

### 3. Backend Route (`app/api/places/route.ts`)
- Uses ONLY countries.dev API (no fallbacks to eRail, Ixigo, etc.)
- Direct call to `https://countries.dev/cities?q=<query>&limit=<limit>`
- Normalizes response to canonical Place model
- Proper error handling (404 = no results, 5xx = error)

### 4. Legacy Hook (`lib/query/places.ts`)
- Updated for compatibility to also use `/api/places` route
- Maintains backward compatibility while using correct architecture

## Architecture Verification

### Place Suggestions (User-Facing Autocomplete)
- **Source**: ONLY countries.dev
- **Endpoint**: `/api/places?q=<query>` → `countries.dev/cities?q=<query>`
- **Transport Providers**: NEVER called during autocomplete
- **User Sees**: Place names in suggestions and input after selection

### Place Resolution (After Selection)
- **Source**: countries.dev (for canonical place info)
- **Endpoint**: `/api/places?q=<placeId>` → `countries.dev/cities?q=<placeId>`
- **Purpose**: Show resolved place name under input (e.g., "São Paulo, State, Country")

### Internal Transport Discovery (After Place Selection)
- **Source**: eRail, Ixigo, etc.
- **Triggered**: ONLY after user selects a place
- **Purpose**: Find stations, bus stops, airports for journey search
- **Never Used**: For autocomplete or suggestions

## User Experience

1. **Typing**: 
   - User types freely (p, pu, pun, pune, etc.)
   - Input shows exactly what they type
   - Suggestions appear after 2+ characters (debounced)
   - No automatic selection

2. **Selection**:
   - User clicks suggestion or presses Enter
   - Input shows place NAME (e.g., "São Paulo")
   - System stores place ID internally (e.g., "place_sao-paulo")
   - Parent receives place ID via onChange for journey search
   - Resolved place name shows under input (if enabled)

3. **Performance**:
   - Typing "pune" results in exactly 1 API call (after 300ms debounce)
   - Repeated same query uses cached results (5min stale time)
   - Stale requests are ignored (only latest query updates suggestions)
   - Minimum 2 characters prevents unnecessary requests

## Files Modified
- `app/components/StationInput.tsx` - Main autocomplete component
- `lib/hooks/usePlaceSearch.ts` - Optimized place search hook
- `lib/query/places.ts` - Legacy hook (updated for compatibility)
- `app/api/places/route.ts` - Backend endpoint (countries.dev only)

## Verification
- No transport provider calls occur during autocomplete typing
- Input values remain stable during user interaction
- Place suggestions show proper city/state/country information
- Internal transport resolution still works after place selection
- FROM/TO fields operate independently
- URL updates only happen after place selection (not during typing)