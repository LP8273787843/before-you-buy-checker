// Before You Buy: Gold Coast address checker.
// Everything runs in the browser. Live data comes straight from the City of
// Gold Coast's public ArcGIS layers (they allow cross-origin requests).

const BASE = "https://services.arcgis.com/3vStCH7NDoBOZ5zn/arcgis/rest/services";
const LAYERS = {
  address: `${BASE}/CoGC_Property_Address/FeatureServer/0`,
  cadastre: `${BASE}/Cadastre_Current_view/FeatureServer/0`,
  suburbs: `${BASE}/Suburbs/FeatureServer/0`,
  floodLevel: `${BASE}/Designated_Flood_Level_for_Residential_Buildings/FeatureServer/0`,
  cityPlan: (id) => `${BASE}/City_Plan_Version_11_Open_Data/FeatureServer/${id}`,
  floodEvent: (id) => `${BASE}/Insurance_Flood_Event_2026/FeatureServer/${id}`,
};

// Council flood mapping, most frequent (worst) first.
const FLOOD_BANDS = [
  { id: 69, chance: 0.20, label: "20% a year", plain: "about a 1-in-5 chance every year" },
  { id: 70, chance: 0.05, label: "5% a year", plain: "about a 1-in-20 chance every year" },
  { id: 71, chance: 0.01, label: "1% a year", plain: "about a 1-in-100 chance every year" },
  { id: 67, chance: 0.002, label: "0.2% a year", plain: "about a 1-in-500 chance every year" },
  { id: 68, chance: 0.0005, label: "0.05% a year", plain: "about a 1-in-2,000 chance every year" },
];

// City Plan overlays checked against the lot, with a plain-English meaning.
const OVERLAYS = [
  { id: 7, name: "Bushfire hazard", level: "bad", why: "Building may need bushfire-resistant construction, and insurance can cost more.", detail: a => a.OVL2_DESC },
  { id: 67, name: "Landslide hazard", level: "bad", why: "Slopes may be unstable. Expect geotechnical reports before building or extending.", detail: a => a.SMEC_2010 ? `Hazard rating: ${a.SMEC_2010}` : "" },
  { id: 66, name: "Airport noise", level: "warn", why: "Inside the Gold Coast Airport noise contour. Aircraft noise and extra insulation rules for new homes.", detail: a => a.BUFFER_SOURCE },
  { id: 92, name: "Road traffic noise corridor", level: "warn", why: "Near a busy state-controlled road. New homes may need noise-reducing design.", detail: a => a.SUMMARY },
  { id: 93, name: "Railway noise corridor", level: "warn", why: "Near a railway line. Expect train noise.", detail: a => a.SUMMARY || a.CATEGORY },
  { id: 90, name: "Railway corridor buffer", level: "warn", why: "Within 100 m of a railway corridor.", detail: () => "" },
  { id: 60, name: "Near industry", level: "warn", why: "Close to medium or high impact industry. Possible noise, smell, dust or trucks.", detail: a => a.BUFFER_DISTANCE },
  { id: 62, name: "Near community infrastructure", level: "warn", why: "Near infrastructure such as a sewage plant or depot that can affect amenity.", detail: a => a.SENSITIVE_USE_TYPE || a.OVL2_DESC },
  { id: 61, name: "Near a waste and recycling centre", level: "warn", why: "Possible smell, noise and truck movements.", detail: a => a.OVL2_DESC },
  { id: 85, name: "Major electricity infrastructure (Powerlink)", level: "warn", why: "High-voltage lines or easements nearby. Limits on building close to them.", detail: () => "" },
  { id: 86, name: "Major electricity infrastructure (Energex)", level: "warn", why: "Substation or major powerlines nearby.", detail: () => "" },
  { id: 81, name: "Water supply pipeline buffer", level: "warn", why: "Within 20 m of a major water pipeline. Building and digging can be restricted.", detail: () => "" },
  { id: 55, name: "Heritage place", level: "warn", why: "The property is heritage listed. Changes and demolition are tightly controlled.", detail: a => a.PLACE_NAME },
  { id: 56, name: "Next to a heritage place", level: "info", why: "Neighbours a heritage-listed place, so new building must respect it.", detail: a => a.OVL2_DESC },
  { id: 27, name: "Koala habitat area", level: "warn", why: "Clearing trees is restricted and development may need koala-friendly design.", detail: () => "" },
  { id: 32, name: "Regulated vegetation", level: "warn", why: "State-protected vegetation. You may not be able to clear it.", detail: () => "" },
  { id: 34, name: "Vegetation protection order", level: "warn", why: "Specific trees are protected. Removing them needs approval.", detail: () => "" },
  { id: 35, name: "Vegetation management", level: "info", why: "Council-mapped vegetation. Clearing may need approval.", detail: a => a.OVL2_DESC },
  { id: 22, name: "Substantial remnant bushland", level: "info", why: "Significant native bushland. Clearing is restricted.", detail: () => "" },
  { id: 41, name: "Waterway", level: "warn", why: "A creek or waterway is mapped on or near the lot. Expect setbacks and possible flooding or erosion.", detail: a => a.OVL2_DESC },
  { id: 38, name: "State significant wetland", level: "warn", why: "Protected wetland. Development is limited.", detail: () => "" },
  { id: 40, name: "Local significant wetland", level: "info", why: "Council-mapped wetland. Development may be limited.", detail: () => "" },
  { id: 11, name: "Foreshore seawall setback", level: "warn", why: "Beachfront property. Coastal erosion rules and seawall requirements apply.", detail: a => a.MEASUREMENT },
  { id: 13, name: "Waterfront development control", level: "info", why: "Canal or waterfront rules apply to building setbacks, pools and jetties.", detail: a => a.OVL2_DESC },
  { id: 88, name: "Ridges and significant hills", level: "info", why: "Building height and bulk are limited to protect the skyline.", detail: () => "" },
  { id: 15, name: "Dwelling house overlay", level: "info", why: "Special rules apply to the size and siting of houses here.", detail: () => "" },
  { id: 77, name: "Party house area", level: "info", why: "Short-term 'party house' rentals are regulated here. Neighbours may be holiday lets.", detail: () => "" },
  { id: 72, name: "Light rail urban renewal area", level: "info", why: "Council plans for more density near the light rail. Expect taller buildings and change nearby.", detail: a => a.STRATEGY_AREA },
  { id: 65, name: "Agricultural land", level: "info", why: "Good-quality farm land. Subdivision and non-farm uses are limited.", detail: () => "" },
  { id: 64, name: "Next to agricultural land", level: "info", why: "Farming nearby may bring noise, spray drift or smells.", detail: () => "" },
  { id: 47, name: "Extractive resources (quarry) area", level: "warn", why: "A quarry area. Expect blasting, dust and heavy vehicles.", detail: a => a.OVL2_DESC },
  { id: 49, name: "Quarry separation area", level: "warn", why: "Buffer around a quarry. Noise and dust possible; sensitive uses are limited.", detail: () => "" },
  { id: 100, name: "Woongoolba flood mitigation catchment", level: "warn", why: "Inside a low-lying catchment relying on flood mitigation works.", detail: () => "" },
];

// What each base zone means, in plain English.
const ZONE_INFO = {
  "Low density residential": ["Mainly detached houses.", "You can generally build a house and a granny flat. Big apartment blocks are unlikely next door."],
  "Medium density residential": ["Houses, townhouses and low-rise units.", "Neighbours could be redeveloped into townhouses or small apartment blocks."],
  "High density residential": ["Apartment towers and units.", "Expect tall buildings nearby, and more being built."],
  "Centre": ["Shops, offices, entertainment and high-rise living.", "Busy and noisy. Lots of new development is encouraged."],
  "Neighbourhood centre": ["Small local shops and services.", "Expect shop traffic, deliveries and some noise."],
  "Mixed use": ["A mix of businesses and homes.", "Shops, offices or light commercial uses can go next door."],
  "Emerging community": ["Land earmarked for future suburbs.", "Big change is likely: new estates, roads and construction."],
  "Rural residential": ["Large-lot homes in a semi-rural setting.", "Usually cannot be subdivided into small lots."],
  "Rural": ["Farm land and rural uses.", "Farming activity, limited services and strict subdivision limits."],
  "Township": ["Small hinterland township.", "Village character is protected and growth is limited."],
  "Low impact industry": ["Light industry and workshops.", "Not a residential zone. Expect trucks and business hours noise."],
  "Medium impact industry": ["Industry with some noise or emissions.", "Not suited to living. Expect heavy vehicles."],
  "High impact industry": ["Heavy industry.", "Not suited to living."],
  "Waterfront and marine industry": ["Boat building, marinas and marine businesses.", "Industrial waterfront uses, not housing."],
  "Extractive industry": ["Quarrying.", "Blasting, dust and heavy vehicles."],
  "Major tourism": ["Theme parks, resorts and large tourist sites.", "Crowds, events and big-venue traffic."],
  "Innovation": ["Universities, hospitals, research and tech precincts.", "Large institutional buildings and activity."],
  "Community facilities": ["Schools, hospitals, churches and other community uses.", "The land is set aside for a community purpose."],
  "Sport and recreation": ["Sports fields and recreation facilities.", "Events, lighting and weekend activity."],
  "Open space": ["Parks and public open space.", "Usually not land you can build a home on."],
  "Conservation": ["Protected natural areas.", "Development is essentially not allowed."],
  "Limited development (constrained land)": ["Land with serious constraints, often flooding.", "Very little building is allowed. Read the City Plan carefully."],
  "Special purpose": ["Land for infrastructure such as roads, rail or utilities.", "Used for public infrastructure."],
  "Unzoned": ["Not zoned under the City Plan (often roads or water).", "Check with council."],
};

const RD_INFO = {
  LDR1: "Low density: about 1 dwelling per lot.", LDR2: "Low density: about 1 dwelling per lot.",
  RD1: "1 dwelling per 400 m² of site area", RD2: "1 dwelling per 300 m²", RD3: "1 dwelling per 250 m²",
  RD4: "1 dwelling per 200 m²", RD4A: "1 dwelling per 166 m²", RD5: "1 dwelling per 143 m²",
  RD6: "1 dwelling per 100 m²", RD7: "1 dwelling per 50 m²", RD8: "1 dwelling per 33 m²",
};

const STREET_TYPES = {
  ST: "STREET", RD: "ROAD", AVE: "AVENUE", AV: "AVENUE", DR: "DRIVE", CT: "COURT", CRT: "COURT",
  PL: "PLACE", CRES: "CRESCENT", CR: "CRESCENT", CL: "CLOSE", PDE: "PARADE", TCE: "TERRACE",
  HWY: "HIGHWAY", BVD: "BOULEVARD", BLVD: "BOULEVARD", CCT: "CIRCUIT", CIR: "CIRCUIT", LN: "LANE",
  GR: "GROVE", GV: "GROVE", WY: "WAY", ESP: "ESPLANADE", PKWY: "PARKWAY", SQ: "SQUARE", QUAY: "QUAY",
  CNR: "CORNER", MWS: "MEWS", RISE: "RISE", ST_: "STREET",
};

// ---------- helpers ----------

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "$" + Math.round(n).toLocaleString("en-AU");
const sqlStr = (s) => s.replace(/'/g, "''");
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

async function query(layerUrl, params, timeoutMs = 30000) {
  const body = new URLSearchParams({ f: "json", ...params });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${layerUrl}/query`, { method: "POST", body, signal: ctrl.signal });
  } catch (err) {
    throw new Error(err.name === "AbortError" ? "the council map service took too long to answer" : "could not reach the council map service");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Council map service returned ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "Council map service error");
  return json.features || [];
}

// Find features that touch a geometry (point or polygon, WGS84).
function intersects(layerUrl, geom, outFields = "*") {
  const isPoly = !!geom.rings;
  return query(layerUrl, {
    geometry: JSON.stringify({ ...geom, spatialReference: { wkid: 4326 } }),
    geometryType: isPoly ? "esriGeometryPolygon" : "esriGeometryPoint",
    inSR: 4326,
    spatialRel: "esriSpatialRelIntersects",
    outFields,
    returnGeometry: false,
  });
}

// Turn what the user typed into the council's address format,
// e.g. "5/12 Bon Aire Ct, Clear Island Waters QLD 4226" -> street "12 BON AIRE COURT", suburb "CLEAR ISLAND WATERS".
function parseAddress(input) {
  let s = input.toUpperCase().replace(/\s+/g, " ").trim();
  s = s.replace(/\b(QLD|QUEENSLAND|AUSTRALIA)\b/g, "").replace(/\b4\d{3}\b/g, "");
  s = s.replace(/^(UNIT|U|APT|APARTMENT|LOT|SHOP)\s*\d+[A-Z]?\s*[,/ ]\s*/, "");
  s = s.replace(/^\d+[A-Z]?\s*\/\s*/, "");          // 5/12 -> 12
  const parts = s.split(",").map(p => p.trim()).filter(Boolean);
  let street = parts[0] || "";
  let suburb = parts[1] || "";
  street = street.split(" ").map(w => STREET_TYPES[w.replace(/\.$/, "")] || w.replace(/\.$/, "")).join(" ");
  return { street: street.trim(), suburb: suburb.trim() };
}

function whereForAddress({ street, suburb }) {
  let where = `ADDRESS LIKE '${sqlStr(street)}%'`;
  if (suburb) where += ` AND ADDRESS LIKE '%, ${sqlStr(suburb)}%'`;
  return where;
}

// Shrink the lot slightly towards its centre so neighbouring zones/overlays
// that only touch the boundary line are not reported.
function insetPolygon(rings, factor = 0.85) {
  const pts = rings[0];
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return { rings: rings.map(r => r.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor])) };
}

function polygonArea(rings) {
  // Rough area in m² (good enough to pick the largest lot).
  const r = rings[0], lat = r[0][1] * Math.PI / 180;
  const kx = 111320 * Math.cos(lat), ky = 110540;
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] * kx) * (r[i][1] * ky) - (r[i][0] * kx) * (r[j][1] * ky);
  return Math.abs(a / 2);
}

// ---------- autocomplete ----------

let suggestTimer, activeIndex = -1;
$("address").addEventListener("input", () => {
  clearTimeout(suggestTimer);
  suggestTimer = setTimeout(suggest, 300);
});
$("address").addEventListener("keydown", (e) => {
  const items = [...$("suggestions").children];
  if (!items.length || $("suggestions").hidden) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = (activeIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
  } else if (e.key === "Enter" && activeIndex >= 0) {
    e.preventDefault();
    pickSuggestion(items[activeIndex].textContent);
  } else if (e.key === "Escape") {
    $("suggestions").hidden = true;
  }
});
document.addEventListener("click", (e) => { if (!e.target.closest(".input-wrap")) $("suggestions").hidden = true; });

async function suggest() {
  const parsed = parseAddress($("address").value);
  if (!/^\d+\S*\s+\w{2,}/.test(parsed.street)) { $("suggestions").hidden = true; return; }
  try {
    const feats = await query(LAYERS.address, {
      where: whereForAddress(parsed), outFields: "ADDRESS", returnDistinctValues: true,
      returnGeometry: false, orderByFields: "ADDRESS", resultRecordCount: 8,
    });
    const list = $("suggestions");
    list.innerHTML = "";
    activeIndex = -1;
    feats.forEach(f => {
      const li = document.createElement("li");
      li.textContent = titleCase(f.attributes.ADDRESS);
      li.addEventListener("click", () => pickSuggestion(li.textContent));
      list.appendChild(li);
    });
    list.hidden = !feats.length;
  } catch { /* suggestions are optional */ }
}

function pickSuggestion(text) {
  $("address").value = text;
  $("suggestions").hidden = true;
  run(text);
}

document.querySelectorAll("[data-try]").forEach(a => a.addEventListener("click", (e) => {
  e.preventDefault();
  $("address").value = a.dataset.try;
  run(a.dataset.try);
}));

$("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  $("suggestions").hidden = true;
  run($("address").value);
});

// ---------- main lookup ----------

function setStatus(msg, isError = false) {
  $("status").textContent = msg;
  $("status").className = "status" + (isError ? " error" : "");
}

let current = null; // { suburb, ... } for the growth form

async function run(input) {
  if (!input.trim()) return;
  $("go").disabled = true;
  setStatus("Finding the address in council records…");
  try {
    const parsed = parseAddress(input);
    const addrFeats = await query(LAYERS.address, {
      where: whereForAddress(parsed), outFields: "ADDRESS,LOTPLAN", returnGeometry: true,
      outSR: 4326, orderByFields: "ADDRESS", resultRecordCount: 50,
    });
    if (!addrFeats.length) {
      setStatus("We couldn't find that address in City of Gold Coast records. Check the spelling, include the street number, and make sure it's on the Gold Coast.", true);
      return;
    }
    // Prefer an exact match on the street part.
    const exact = addrFeats.filter(f => f.attributes.ADDRESS.startsWith(parsed.street + ","));
    const chosen = exact.length ? exact : addrFeats;
    const address = chosen[0].attributes.ADDRESS;
    const same = chosen.filter(f => f.attributes.ADDRESS === address);
    const point = { x: same[0].geometry.x, y: same[0].geometry.y };
    const lotPlans = [...new Set(same.map(f => f.attributes.LOTPLAN).filter(Boolean))];

    setStatus("Fetching the lot boundary…");
    let lot = null;
    if (lotPlans.length) {
      const lots = await query(LAYERS.cadastre, {
        where: `LOTPLAN IN (${lotPlans.slice(0, 40).map(l => `'${sqlStr(l)}'`).join(",")})`,
        outFields: "LOTPLAN", returnGeometry: true, outSR: 4326, geometryPrecision: 7,
      });
      const withGeom = lots.filter(l => l.geometry && l.geometry.rings && l.geometry.rings.length);
      if (withGeom.length) lot = withGeom.sort((a, b) => polygonArea(b.geometry.rings) - polygonArea(a.geometry.rings))[0];
    }
    const lotGeom = lot ? insetPolygon(lot.geometry.rings) : point;

    // ~45 layer checks run at once; show progress because a few council layers are slow.
    const total = 7 + FLOOD_BANDS.length + OVERLAYS.length;
    let done = 0;
    const tick = (p) => p.finally(() => setStatus(`Checking zoning, flood maps and overlays… ${++done} of ${total} done`));
    const check = (...args) => tick(intersects(...args));
    setStatus(`Checking zoning, flood maps and overlays… 0 of ${total} done`);
    const [zone, suburbF, height, density, minLot, floodOverlay, floodLevel, bands, overlayHits] = await Promise.all([
      check(LAYERS.cityPlan(3), point),
      check(LAYERS.suburbs, point, "SUBURBS").catch(() => []),
      check(LAYERS.cityPlan(5), point).catch(() => []),
      check(LAYERS.cityPlan(87), point).catch(() => []),
      check(LAYERS.cityPlan(73), point).catch(() => []),
      check(LAYERS.cityPlan(53), lotGeom).catch(() => null),
      check(LAYERS.floodLevel, point).catch(() => []),
      Promise.all(FLOOD_BANDS.map(b => check(LAYERS.floodEvent(b.id), lotGeom, "OBJECTID").then(f => f.length > 0).catch(() => null))),
      Promise.all(OVERLAYS.map(o => check(LAYERS.cityPlan(o.id), lotGeom).then(f => f.length ? { o, f } : null).catch(() => ({ o, failed: true })))),
    ]);

    const suburb = suburbF[0]?.attributes.SUBURBS || address.split(",")[1]?.trim() || "";
    const result = {
      address, point, lot, lotPlans, suburb,
      zone: zone[0]?.attributes,
      height: height[0]?.attributes,
      density: density[0]?.attributes,
      minLot: minLot[0]?.attributes,
      floodOverlay: floodOverlay ? floodOverlay.length > 0 : null,
      floodLevel: floodLevel[0]?.attributes,
      bands,
      overlays: overlayHits.filter(h => h && !h.failed),
      overlaysFailed: overlayHits.filter(h => h && h.failed).map(h => h.o.name),
    };
    render(result);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus(`Sorry, the council map service could not be reached (${err.message}). Check your internet connection and try again.`, true);
  } finally {
    $("go").disabled = false;
  }
}

// ---------- rendering ----------

let map, mapLayers = [];

function render(r) {
  $("results").hidden = false;
  $("r-address").textContent = titleCase(r.address);
  $("r-meta").textContent = [
    r.suburb && `Suburb: ${titleCase(r.suburb)}`,
    r.lotPlans.length && `Lot on plan: ${r.lotPlans.slice(0, 3).join(", ")}${r.lotPlans.length > 3 ? ` +${r.lotPlans.length - 3} more` : ""}`,
  ].filter(Boolean).join(" · ");

  drawMap(r);
  const summary = [];
  renderZone(r, summary);
  renderFlood(r, summary);
  renderOverlays(r, summary);
  current = { suburb: r.suburb.toUpperCase() };
  const growth = renderGrowth(sampleSeries(current.suburb), summary);
  current.summaryBase = summary.slice(0, summary.length - (growth ? 1 : 0));

  $("r-summary").innerHTML = summary.map(s => `<li class="${s.level}">${s.html}</li>`).join("");
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function drawMap(r) {
  if (!window.L) { $("map").textContent = "Map could not load (no internet?)."; return; }
  if (!map) {
    map = L.map("map", { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap contributors",
    }).addTo(map);
  }
  mapLayers.forEach(l => l.remove());
  mapLayers = [];
  const ll = [r.point.y, r.point.x];
  mapLayers.push(L.marker(ll).addTo(map));
  if (r.lot) {
    const poly = L.polygon(r.lot.geometry.rings.map(ring => ring.map(([x, y]) => [y, x])), { color: "#0f6e6e", weight: 2, fillOpacity: 0.15 }).addTo(map);
    mapLayers.push(poly);
    map.fitBounds(poly.getBounds(), { maxZoom: 18, padding: [20, 20] });
  } else {
    map.setView(ll, 17);
  }
  setTimeout(() => map.invalidateSize(), 50);
}

function renderZone(r, summary) {
  if (!r.zone) {
    $("r-zone").innerHTML = `<p>No zone found at this point. Check the official City Plan map.</p>`;
    summary.push({ level: "warn", html: "<strong>Zoning:</strong> not found in the council data. Check the official map." });
    return;
  }
  const full = r.zone.ZONE;
  const base = r.zone.LVL1_ZONE || full.split(",")[0];
  const precinct = full.includes(",") ? full.split(",").slice(1).join(",").trim() : "";
  const [what, means] = ZONE_INFO[base] || ["See the City Plan for what this zone allows.", ""];
  const rd = r.density?.RESIDENTIAL_DENSITY;
  const h = r.height;
  const heightText = h ? (h.HEIGHT_IN_METRES === "HX" ? "No set height limit (HX)" :
    [h.STOREY_NUMBER && h.STOREY_NUMBER !== "N/A" && `${h.STOREY_NUMBER} storeys`, h.HEIGHT_IN_METRES && h.HEIGHT_IN_METRES !== "N/A" && `${h.HEIGHT_IN_METRES.replace(/\s*m$/i, "")} m`].filter(Boolean).join(" / ")) : "";

  $("r-zone").innerHTML = `
    <p class="zone-name">${esc(full)}</p>
    <p><strong>What it's for:</strong> ${esc(what)}</p>
    ${means ? `<p><strong>What it means for you:</strong> ${esc(means)}</p>` : ""}
    <dl class="kv">
      ${precinct ? `<dt>Precinct</dt><dd>${esc(precinct)}</dd>` : ""}
      ${heightText ? `<dt>Building height</dt><dd>${esc(heightText)}</dd>` : ""}
      ${rd ? `<dt>Residential density</dt><dd>${esc(rd)}${RD_INFO[rd] ? ` (${esc(RD_INFO[rd])})` : ""}</dd>` : ""}
      ${r.minLot?.MLS ? `<dt>Minimum lot size</dt><dd>${esc(r.minLot.MLS)}</dd>` : ""}
    </dl>`;

  const lvl = /industry|Limited development|Conservation|Open space|Extractive/.test(base) ? "bad"
    : /High density|Centre|Mixed use|Emerging/.test(base) ? "warn" : "info";
  summary.push({ level: lvl, html: `<strong>Zoning:</strong> ${esc(full)}. ${esc(what)} ${esc(means)}` });
}

function renderFlood(r, summary) {
  const worst = FLOOD_BANDS.findIndex((b, i) => r.bands[i]);
  const bandBar = `<div class="flood-bands">${FLOOD_BANDS.map((b, i) =>
    `<span class="${r.bands[i] ? "hit" : ""}" title="${esc(b.plain)}">${esc(b.label)}${r.bands[i] ? "<br>in area" : r.bands[i] === null ? "<br>not checked" : ""}</span>`).join("")}</div>`;
  const unchecked = FLOOD_BANDS.filter((b, i) => r.bands[i] === null).map(b => b.label);
  const uncheckedNote = unchecked.length
    ? ` <em>The council's ${unchecked.join(", ")} flood layer${unchecked.length > 1 ? "s" : ""} didn't respond in time, so ${unchecked.length > 1 ? "they weren't" : "it wasn't"} checked. Try again or check the official map.</em>` : "";

  let level, headline, explain;
  if (worst === -1) {
    level = r.floodOverlay ? "warn" : "good";
    headline = r.floodOverlay ? "Flagged for flood assessment" : "Not in mapped flood areas";
    explain = r.floodOverlay
      ? "The lot isn't inside the council's mapped river/creek flood events, but the City Plan still flags it as needing a flood assessment for new building work."
      : "The lot is outside the council's mapped river and creek flood events. Local stormwater flooding can still happen.";
  } else {
    const b = FLOOD_BANDS[worst];
    const over30 = 1 - Math.pow(1 - b.chance, 30);
    level = b.chance >= 0.01 ? "bad" : "warn";
    headline = b.chance >= 0.05 ? "High flood risk" : b.chance >= 0.01 ? "Moderate flood risk" : "Low but real flood risk";
    explain = `Part of the lot is inside the council's ${b.label} flood area, which means ${b.plain}. Over a 30-year mortgage that adds up to roughly a <strong>${Math.round(over30 * 100)}% chance</strong> of at least one flood that size.`;
  }
  if (unchecked.length && level === "good") { level = "warn"; headline = "Partly checked"; }
  explain += uncheckedNote;

  let dfl = "";
  const fl = r.floodLevel;
  if (fl && fl.FLOODLVLDES != null) {
    const ground = fl.GROUNDCENTRE;
    const diff = ground != null ? fl.FLOODLVLDES - ground : null;
    dfl = `<dl class="kv">
      <dt>Designated flood level</dt><dd>${fl.FLOODLVLDES.toFixed(2)} m AHD</dd>
      ${ground != null ? `<dt>Ground at centre of lot</dt><dd>${ground.toFixed(2)} m AHD</dd>` : ""}
    </dl>
    ${diff != null ? `<p class="small muted">${diff > 0
      ? `The council's design flood level is about <strong>${diff.toFixed(1)} m above</strong> the ground at the centre of this lot. New homes must have floors built above it.`
      : `The ground at the centre of the lot sits above the council's design flood level.`}</p>` : ""}`;
  }

  $("r-flood").innerHTML = `
    <p><span class="pill ${level}">${esc(headline)}</span></p>
    <p>${explain}</p>
    ${bandBar}
    <p class="small muted">Bands show how often a flood that big is expected. Red = the lot overlaps that flood area.
    City Plan flood overlay: <strong>${r.floodOverlay === null ? "Not checked (service didn't respond)" : r.floodOverlay ? "Yes, flood assessment required" : "No"}</strong>.</p>
    ${dfl}`;

  summary.push({ level, html: `<strong>Flood:</strong> ${esc(headline)}. ${explain}` });
}

function renderOverlays(r, summary) {
  const failedNote = r.overlaysFailed.length
    ? `<p class="small"><em>Not checked (the council service didn't respond in time): ${esc(r.overlaysFailed.join(", "))}. Try again or check the official map.</em></p>` : "";
  if (!r.overlays.length) {
    const checked = OVERLAYS.length - r.overlaysFailed.length;
    $("r-overlays").innerHTML = `<p><span class="pill good">None of the ${checked} overlays we checked were found on this lot.</span></p>${failedNote}`;
    summary.push({ level: r.overlaysFailed.length ? "warn" : "good", html: `<strong>Other overlays:</strong> none of the hazard, noise, environment or heritage overlays we checked were found.${r.overlaysFailed.length ? ` ${r.overlaysFailed.length} couldn't be checked.` : ""}` });
    return;
  }
  const order = { bad: 0, warn: 1, info: 2 };
  const hits = r.overlays.slice().sort((a, b) => order[a.o.level] - order[b.o.level]);
  $("r-overlays").innerHTML = `<ul class="overlay-list">${hits.map(({ o, f }) => {
    const details = [...new Set(f.map(x => o.detail(x.attributes)).filter(Boolean))].join("; ");
    return `<li><span class="pill ${o.level}">${o.level === "bad" ? "Hazard" : o.level === "warn" ? "Watch out" : "Good to know"}</span>
      <strong>${esc(o.name)}</strong>${esc(o.why)}${details ? `<div class="detail">${esc(details)}</div>` : ""}</li>`;
  }).join("")}</ul>${failedNote}`;

  const serious = hits.filter(h => h.o.level !== "info").map(h => h.o.name);
  const minor = hits.filter(h => h.o.level === "info").map(h => h.o.name);
  summary.push({
    level: hits.some(h => h.o.level === "bad") ? "bad" : serious.length ? "warn" : "info",
    html: `<strong>Other overlays (${hits.length}):</strong> ${serious.length ? `watch out for ${esc(serious.join(", "))}.` : ""} ${minor.length ? `Also: ${esc(minor.join(", "))}.` : ""}`,
  });
}

// ---------- growth & the doubling myth ----------

function sampleSeries(suburb) {
  const data = window.SAMPLE_GROWTH || {};
  const known = data[suburb];
  return { source: "sample", suburb, generic: !known, points: Object.entries(known || data._DEFAULT).map(([y, p]) => [Number(y), p]) };
}

function analyse(points) {
  const [y1, p1] = points[0], [y2, p2] = points[points.length - 1];
  const years = y2 - y1;
  const cagr = Math.pow(p2 / p1, 1 / years) - 1;
  const doubling = cagr > 0 ? Math.log(2) / Math.log(1 + cagr) : Infinity;
  // Weakest stretch of 10+ years, to show flat periods.
  let weakest = null;
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    const span = points[j][0] - points[i][0];
    if (span < 10) continue;
    const g = Math.pow(points[j][1] / points[i][1], 1 / span) - 1;
    if (!weakest || g < weakest.g) weakest = { from: points[i][0], to: points[j][0], g, change: points[j][1] / points[i][1] - 1 };
  }
  return { y1, p1, y2, p2, years, cagr, doubling, weakest };
}

function renderGrowth(series, summary) {
  const a = analyse(series.points);
  const name = titleCase(series.suburb || "this suburb");
  const srcTag = $("growth-src");
  if (series.source === "sample") {
    srcTag.className = "src sample"; srcTag.textContent = "Sample data, not real";
  } else {
    srcTag.className = "src user"; srcTag.textContent = "Your figures";
  }

  const banner = series.source === "sample"
    ? `<div class="sample-banner"><strong>Sample data.</strong> No free, open source of historical Gold Coast suburb medians could be connected, so these numbers are <strong>invented for demonstration</strong>${series.generic ? ` (a generic Gold Coast example; ${esc(name)} has no sample of its own)` : ""}. They are not real sales figures. Use “Use your own real figures” below to plug in real medians.</div>`
    : "";

  const rows = series.points.map(([y, p], i) => {
    const prev = series.points[i - 1];
    const ch = prev ? (p / prev[1] - 1) * 100 : null;
    return `<tr><td>${y}</td><td>${money(p)}</td><td>${ch == null ? "–" : `${ch >= 0 ? "+" : ""}${ch.toFixed(0)}%`}</td></tr>`;
  }).join("");

  $("r-growth").innerHTML = `${banner}
    <p>${series.source === "sample" ? "Sample median" : "Median"} house price in <strong>${esc(name)}</strong> went from <strong>${money(a.p1)}</strong> in ${a.y1} to <strong>${money(a.p2)}</strong> in ${a.y2}: an average of <strong>${(a.cagr * 100).toFixed(1)}% a year</strong> over ${a.years} years.</p>
    <table class="years"><thead><tr><th>Year</th><th>Median</th><th>Change</th></tr></thead><tbody>${rows}</tbody></table>
    ${a.weakest && a.weakest.g < 0.035 ? `<p class="small">Weakest stretch: ${a.weakest.from}–${a.weakest.to}, prices changed ${(a.weakest.change * 100).toFixed(0)}% in ${a.weakest.to - a.weakest.from} years (${(a.weakest.g * 100).toFixed(1)}% a year). Growth is not steady.</p>` : ""}`;

  renderMyth(a, series, name);

  const label = series.source === "sample" ? " (sample data, not real)" : " (your figures)";
  const dt = isFinite(a.doubling) ? `${a.doubling.toFixed(1)} years` : "never (prices fell)";
  const fits = a.doubling >= 7 && a.doubling <= 10;
  const item = {
    level: fits ? "info" : "warn",
    html: `<strong>Growth${label}:</strong> ${(a.cagr * 100).toFixed(1)}% a year since ${a.y1}, so prices double about every <strong>${dt}</strong>. ${fits ? "That roughly matches the 7–10 year rule here, but it isn't guaranteed." : "That does <em>not</em> match the “doubles every 7–10 years” rule."}`,
  };
  summary.push(item);
  return item;
}

function renderMyth(a, series, name) {
  const dt = a.doubling;
  const dtText = isFinite(dt) ? dt.toFixed(1) : "∞";
  let verdict;
  if (!isFinite(dt)) verdict = `Prices went <strong>backwards</strong>. At this rate they never double.`;
  else if (dt < 7) verdict = `Faster than the myth. But fast past growth doesn't promise fast future growth, and a single good stretch can hide flat years.`;
  else if (dt <= 10) verdict = `Roughly in line with the myth for this period. Look at the weakest stretch: even here, growth came in bursts, not every year.`;
  else verdict = `Slower than the myth. Someone who bought in ${a.y1} expecting a doubling within 10 years would have been ${a.p1 * 2 > interpolate(series.points, a.y1 + 10) ? "disappointed" : "lucky"}.`;

  $("r-myth").innerHTML = `
    <div class="big-compare">
      <div><span class="num">${dtText} yrs</span><span class="lbl">Actual doubling time${series.source === "sample" ? " (sample)" : ""}</span></div>
      <div><span class="num">7–10 yrs</span><span class="lbl">The myth</span></div>
      <div><span class="num">${(a.cagr * 100).toFixed(1)}%</span><span class="lbl">vs 7.2–10.4% a year the myth needs</span></div>
    </div>
    <p>${verdict}</p>
    <p class="small muted">To double in 7 years prices must grow about 10.4% every year; in 10 years, about 7.2%. Growth depends on location, timing, interest rates and new supply, so some markets stay flat or fall for a decade.</p>`;

  $("r-chart").innerHTML = chartSvg(series.points, name) +
    `<div class="legend"><span><i style="background:var(--accent)"></i>${esc(name)}${series.source === "sample" ? " (sample)" : ""}</span>
     <span><i style="background:var(--bad)"></i>Myth: doubles every 7 years</span>
     <span><i style="background:var(--warn)"></i>Myth: doubles every 10 years</span></div>`;
}

function interpolate(points, year) {
  for (let i = 1; i < points.length; i++) {
    const [y0, p0] = points[i - 1], [y1, p1] = points[i];
    if (year <= y1) return p0 + (p1 - p0) * (year - y0) / (y1 - y0);
  }
  return points[points.length - 1][1];
}

function chartSvg(points, name) {
  const W = 640, H = 260, L = 70, R = 16, T = 16, B = 30;
  const y0 = points[0][0], y1 = points[points.length - 1][0], p0 = points[0][1];
  const myth = (years) => { const out = []; for (let y = y0; y <= y1; y++) out.push([y, p0 * Math.pow(2, (y - y0) / years)]); return out; };
  const m7 = myth(7), m10 = myth(10);
  const maxP = Math.max(...points.map(p => p[1]), ...m7.map(p => p[1])) * 1.05;
  const x = (yr) => L + (yr - y0) / Math.max(1, y1 - y0) * (W - L - R);
  const y = (p) => T + (1 - p / maxP) * (H - T - B);
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => maxP * f);
  const step = Math.max(1, Math.round((y1 - y0) / 5));
  const xt = []; for (let yr = y0; yr <= y1; yr += step) xt.push(yr);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price growth in ${esc(name)} compared with the doubling myth">
    ${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${t === 0 ? "$0" : t >= 1e6 ? "$" + (t / 1e6).toFixed(1) + "m" : "$" + Math.round(t / 1000) + "k"}</text>`).join("")}
    ${xt.map(yr => `<text x="${x(yr)}" y="${H - 8}" text-anchor="middle">${yr}</text>`).join("")}
    <path d="${path(m7)}" fill="none" stroke="var(--bad)" stroke-width="2" stroke-dasharray="5 4"/>
    <path d="${path(m10)}" fill="none" stroke="var(--warn)" stroke-width="2" stroke-dasharray="5 4"/>
    <path d="${path(points)}" fill="none" stroke="var(--accent)" stroke-width="3"/>
    ${points.map(p => `<circle cx="${x(p[0])}" cy="${y(p[1])}" r="4" fill="var(--accent)"/>`).join("")}
  </svg>`;
}

$("own-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const y1 = +$("own-y1").value, p1 = +$("own-p1").value, y2 = +$("own-y2").value, p2 = +$("own-p2").value;
  if (!(y2 > y1) || !(p1 > 0) || !(p2 > 0)) { alert("Please enter an end year after the start year, and prices above zero."); return; }
  const summary = (current?.summaryBase || []).slice();
  renderGrowth({ source: "user", suburb: current?.suburb || "", points: [[y1, p1], [y2, p2]] }, summary);
  $("r-summary").innerHTML = summary.map(s => `<li class="${s.level}">${s.html}</li>`).join("");
});
