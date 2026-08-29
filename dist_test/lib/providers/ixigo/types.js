/**
 * Shapes for the two ixigo endpoints we call:
 *   - GET  https://www.ixigo.com/abus-autocompleter/api/v1/results?s=<query>
 *   - POST https://www.ixigo.com/wap/GetBusList
 *
 * Both reverse-engineered from real captured samples (not guessed) —
 * except the GetBusList *request* body, which is inferred (see
 * client.ts's buildBusListRequest for exactly what's uncertain there and
 * why). Only the fields this codebase actually reads are typed; ixigo's
 * real responses carry a lot more we don't need (deals, banners, filter
 * lists, etc.) and those are left untyped rather than modeled.
 */
export {};
