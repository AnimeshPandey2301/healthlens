"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin, Star, Clock, Navigation } from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type DoctorResult = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string; // hospital | doctors | clinic | pharmacy
  phone?: string;
  website?: string;
  opening_hours?: string;
};

/* ─────────────────────────────────────────────
   Overpass API — fetch nearby healthcare places
   Uses multiple mirrors for reliability
───────────────────────────────────────────── */
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function overpassFetch(query: string): Promise<Response> {
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(
        mirror + "?data=" + encodeURIComponent(query),
        { signal: AbortSignal.timeout(18000) }
      );
      if (res.ok) return res;
    } catch {
      /* try next mirror */
    }
  }
  throw new Error("All Overpass mirrors failed");
}

async function fetchNearbyDoctors(
  lat: number,
  lng: number,
  radiusM = 3000
): Promise<DoctorResult[]> {
  const query = `
    [out:json][timeout:25];
    (
      nwr["amenity"="hospital"](around:${radiusM},${lat},${lng});
      nwr["amenity"="doctors"](around:${radiusM},${lat},${lng});
      nwr["amenity"="clinic"](around:${radiusM},${lat},${lng});
      nwr["amenity"="health_centre"](around:${radiusM},${lat},${lng});
      nwr["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
      nwr["healthcare"="doctor"](around:${radiusM},${lat},${lng});
      nwr["healthcare"="hospital"](around:${radiusM},${lat},${lng});
      nwr["healthcare"="clinic"](around:${radiusM},${lat},${lng});
    );
    out center 30;
  `;

  const res = await overpassFetch(query);
  const data = await res.json();
  const results: DoctorResult[] = [];

  for (const el of data.elements ?? []) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) continue;

    const tags = el.tags ?? {};
    const name =
      tags.name ||
      tags["name:en"] ||
      tags["amenity"] ||
      tags["healthcare"] ||
      "Healthcare Facility";

    const address = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"],
      tags["addr:city"],
    ]
      .filter(Boolean)
      .join(", ") || "Address not listed";

    results.push({
      id: el.id,
      name,
      address,
      lat: elLat,
      lng: elLng,
      type: tags["amenity"] || tags["healthcare"] || "clinic",
      phone: tags["contact:phone"] || tags["phone"],
      website: tags["website"] || tags["contact:website"],
      opening_hours: tags["opening_hours"],
    });
  }

  // deduplicate by name+lat
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.name}|${r.lat.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ─────────────────────────────────────────────
   Text search: Nominatim (specific places) + Overpass (nearby)
───────────────────────────────────────────── */
async function searchDoctorsByText(
  query: string,
  lat: number,
  lng: number
): Promise<DoctorResult[]> {
  let searchLat = lat;
  let searchLng = lng;
  const nomPlaces: DoctorResult[] = [];

  // 1. Nominatim: find specific named places (e.g. "CIMS Hospital Mathura")
  try {
    const nomUrl =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1` +
      `&accept-language=en`;
    const nomRes = await fetch(nomUrl, {
      headers: { "User-Agent": "HealthLens/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const nomData: NominatimResult[] = await nomRes.json();

    if (nomData?.length > 0) {
      // Use first result as new search centre
      searchLat = parseFloat(nomData[0].lat);
      searchLng = parseFloat(nomData[0].lon);

      // Turn each Nominatim hit that looks like a place into a marker
      for (const r of nomData) {
        const cls = r.class ?? "";
        const typ = r.type ?? "";
        const isHealth =
          cls === "amenity" ||
          cls === "healthcare" ||
          ["hospital", "clinic", "doctors", "pharmacy", "health_centre"].includes(typ);
        if (!isHealth) continue;

        const parts = (r.display_name ?? "").split(",");
        nomPlaces.push({
          id: parseInt(r.osm_id ?? "0") || Math.random() * 1e9,
          name: parts[0]?.trim() || query,
          address: parts.slice(1, 4).join(",").trim() || "Address not listed",
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          type: typ || "clinic",
        });
      }
    }
  } catch {
    /* geocode failed — search around user location */
  }

  // 2. Overpass: broader area search around the resolved centre
  let overpassResults: DoctorResult[] = [];
  try {
    overpassResults = await fetchNearbyDoctors(searchLat, searchLng, 5000);
  } catch {
    /* overpass failed — use Nominatim results only */
  }

  // 3. Merge: Nominatim-specific hits first, then Overpass
  const merged = [...nomPlaces, ...overpassResults];
  const seen = new Set<string>();
  return merged.filter((r) => {
    const key = `${r.name.toLowerCase()}|${r.lat.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type NominatimResult = {
  osm_id?: string;
  lat: string;
  lon: string;
  display_name?: string;
  class?: string;
  type?: string;
};

/* ─────────────────────────────────────────────
   Specialty → Overpass tag map
   Searches near user’s GPS — never geocodes the specialty label
───────────────────────────────────────────── */
const SPECIALTY_MAP: Record<string, string[]> = {
  "General Physician": [
    `nwr["amenity"="doctors"]`,
    `nwr["amenity"="health_centre"]`,
    `nwr["amenity"="clinic"]`,
    `nwr["healthcare"="doctor"]`,
  ],
  Cardiologist: [
    `nwr["healthcare:speciality"="cardiology"]`,
    `nwr["name"~"cardiolog",i]`,
    `nwr["name"~"heart",i]`,
  ],
  Dermatologist: [
    `nwr["healthcare:speciality"="dermatology"]`,
    `nwr["name"~"dermatolog",i]`,
    `nwr["name"~"skin",i]`,
  ],
  Neurologist: [
    `nwr["healthcare:speciality"="neurology"]`,
    `nwr["name"~"neurolog",i]`,
    `nwr["name"~"brain",i]`,
  ],
  Pediatrician: [
    `nwr["healthcare:speciality"="paediatrics"]`,
    `nwr["healthcare:speciality"="pediatrics"]`,
    `nwr["name"~"pediat",i]`,
    `nwr["name"~"child",i]`,
    `nwr["name"~"balrog",i]`,
  ],
  Orthopedist: [
    `nwr["healthcare:speciality"="orthopaedics"]`,
    `nwr["healthcare:speciality"="orthopedics"]`,
    `nwr["name"~"ortho",i]`,
    `nwr["name"~"bone",i]`,
  ],
  Gynecologist: [
    `nwr["healthcare:speciality"="gynaecology"]`,
    `nwr["healthcare:speciality"="gynecology"]`,
    `nwr["name"~"gynec",i]`,
    `nwr["name"~"women",i]`,
    `nwr["name"~"maternity",i]`,
  ],
  Dentist: [
    `nwr["amenity"="dentist"]`,
    `nwr["healthcare"="dentist"]`,
    `nwr["name"~"dent",i]`,
  ],
  "Eye Specialist": [
    `nwr["healthcare:speciality"="ophthalmology"]`,
    `nwr["amenity"="optometrist"]`,
    `nwr["name"~"eye",i]`,
    `nwr["name"~"ophthal",i]`,
    `nwr["name"~"vision",i]`,
  ],
};

async function fetchSpecialtyNearby(
  lat: number,
  lng: number,
  specialtyLabel: string,
  radiusM = 5000
): Promise<DoctorResult[]> {
  const filters = SPECIALTY_MAP[specialtyLabel];

  // Fallback to generic healthcare search if specialty not in map
  if (!filters || filters.length === 0) {
    return fetchNearbyDoctors(lat, lng, radiusM);
  }

  const filterLines = filters
    .map((f) => `${f}(around:${radiusM},${lat},${lng});`)
    .join("\n      ");

  const query = `
    [out:json][timeout:25];
    (
      ${filterLines}
    );
    out center 30;
  `;

  const res = await overpassFetch(query);
  const data = await res.json();
  const results: DoctorResult[] = [];

  for (const el of data.elements ?? []) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) continue;

    const tags = el.tags ?? {};
    const name =
      tags.name || tags["name:en"] || tags["amenity"] || tags["healthcare"] || specialtyLabel;

    const address = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"],
      tags["addr:city"],
    ].filter(Boolean).join(", ") || "Address not listed";

    results.push({
      id: el.id,
      name,
      address,
      lat: elLat,
      lng: elLng,
      type: tags["amenity"] || tags["healthcare"] || "clinic",
      phone: tags["contact:phone"] || tags["phone"],
      website: tags["website"] || tags["contact:website"],
      opening_hours: tags["opening_hours"],
    });
  }

  // If specialty query returns nothing, fall back to generic search near user
  if (results.length === 0) {
    return fetchNearbyDoctors(lat, lng, radiusM);
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.name}|${r.lat.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ─────────────────────────────────────────────
   Icon colour per type
───────────────────────────────────────────── */
function markerColor(type: string): string {
  if (type === "hospital") return "#EF4444";
  if (type === "pharmacy") return "#8B5CF6";
  if (type === "doctors" || type === "doctor") return "#0D9488";
  return "#F59E0B";
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    hospital: "Hospital",
    doctors: "Doctor",
    doctor: "Doctor",
    clinic: "Clinic",
    health_centre: "Health Centre",
    pharmacy: "Pharmacy",
  };
  return map[type] ?? "Clinic";
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
interface DoctorMapProps {
  externalQuery?: string;
}

export default function DoctorMap({ externalQuery }: DoctorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorList, setDoctorList] = useState<DoctorResult[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResult | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const userLatRef = useRef(28.6139);
  const userLngRef = useRef(77.209);

  /* ── Build Leaflet markers from results ── */
  const renderMarkers = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (L: any, results: DoctorResult[], mapInst: any) => {
      // Clear old markers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }

      if (results.length === 0) {
        setNoResults(true);
        return;
      }

      setNoResults(false);
      const layer = markersLayerRef.current;

      results.forEach((doc) => {
        const color = markerColor(doc.type);
        const iconHtml = `
          <div style="
            width:34px;height:34px;background:${color};border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-size:16px;font-weight:700;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            border:2.5px solid #fff;cursor:pointer;
          ">+</div>`;

        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });

        const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          doc.address + " " + doc.name
        )}`;

        const popup = L.popup({ maxWidth: 260 }).setContent(`
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:4px 0;">
            <span style="display:inline-block;background:${color}22;color:${color};
              font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;margin-bottom:6px;">
              ${typeLabel(doc.type)}
            </span>
            <p style="font-size:14px;font-weight:700;color:#1E3A5F;margin:0 0 3px 0;">${doc.name}</p>
            <p style="font-size:11px;color:#6B7280;margin:0 0 8px 0;line-height:1.5;">${doc.address}</p>
            ${doc.opening_hours
              ? `<p style="font-size:11px;color:#059669;margin:0 0 6px 0;">🕐 ${doc.opening_hours}</p>`
              : ""}
            ${doc.phone
              ? `<p style="font-size:11px;color:#374151;margin:0 0 6px 0;">📞 ${doc.phone}</p>`
              : ""}
            <div style="display:flex;gap:6px;margin-top:10px;">
              <a href="${dirUrl}" target="_blank" rel="noopener noreferrer"
                style="flex:1;background:#0D9488;color:#fff;border-radius:8px;
                  padding:7px 0;font-size:12px;font-weight:600;text-align:center;
                  text-decoration:none;display:block;">
                Get Directions
              </a>
              ${doc.website
                ? `<a href="${doc.website}" target="_blank" rel="noopener noreferrer"
                    style="flex:1;background:#F3F4F6;color:#374151;border-radius:8px;
                      padding:7px 0;font-size:12px;font-weight:600;text-align:center;
                      text-decoration:none;display:block;">
                    Website
                  </a>`
                : ""}
            </div>
          </div>`);

        const marker = L.marker([doc.lat, doc.lng], { icon }).bindPopup(popup);
        marker.on("click", () => setSelectedDoctor(doc));
        layer.addLayer(marker);
      });

      setDoctorList(results);

      // Fit map to markers
      try {
        mapInst.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 15 });
      } catch {
        /* single marker or empty — stay at current zoom */
      }
    },
    []
  );

  /* ── Init map on mount ── */
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    const initMap = async (lat: number, lng: number) => {
      try {
        const L = (await import("leaflet")).default;

        // Fix default icon paths (common Next.js issue with Leaflet)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        if (cancelled || !mapRef.current) return;

        // Create map
        const mapInst = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 14,
          zoomControl: true,
        });

        // OpenStreetMap tiles — completely free
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInst);

        // "You are here" blue pulsing dot
        const youHereIcon = L.divIcon({
          html: `<div style="
            width:16px;height:16px;background:#2563EB;border-radius:50%;
            border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.25);
          "></div>`,
          className: "",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([lat, lng], { icon: youHereIcon })
          .addTo(mapInst)
          .bindPopup("📍 You are here");

        // Markers layer group
        const layer = L.layerGroup().addTo(mapInst);
        markersLayerRef.current = layer;
        mapInstanceRef.current = mapInst;

        // Fetch nearby doctors
        const results = await fetchNearbyDoctors(lat, lng, 3000);
        if (!cancelled) {
          renderMarkers(L, results, mapInst);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Map init error:", err);
        if (!cancelled) {
          setLocationError("Failed to load map. Please refresh the page.");
          setIsLoading(false);
        }
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        userLatRef.current = lat;
        userLngRef.current = lng;
        initMap(lat, lng);
      },
      () => {
        setLocationError(
          "Location not shared — showing doctors in New Delhi by default."
        );
        initMap(28.6139, 77.209);
      },
      { timeout: 7000, enableHighAccuracy: false, maximumAge: 60000 }
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Shared search runner (used by form submit + specialty chips) ── */
  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim() || !mapInstanceRef.current) return;
      setIsSearching(true);
      setNoResults(false);
      try {
        const L = (await import("leaflet")).default;
        const results = await searchDoctorsByText(
          q.trim(),
          userLatRef.current,
          userLngRef.current
        );
        renderMarkers(L, results, mapInstanceRef.current);
        // Pan map to first result
        if (results.length > 0 && mapInstanceRef.current) {
          mapInstanceRef.current.setView([results[0].lat, results[0].lng], 14, { animate: true });
        }
      } catch {
        setNoResults(true);
      } finally {
        setIsSearching(false);
      }
    },
    [renderMarkers]
  );

  /* ── Form submit search ── */
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await runSearch(searchQuery);
    },
    [searchQuery, runSearch]
  );

  /* ── Specialty chip trigger: always searches near user's GPS location ── */
  useEffect(() => {
    if (!externalQuery || isLoading) return;
    setSearchQuery(""); // clear search bar text when using chips

    const doSpecialtySearch = async () => {
      setIsSearching(true);
      setNoResults(false);
      try {
        const L = (await import("leaflet")).default;
        // Always use current GPS location — never geocode the specialty label
        const results = await fetchSpecialtyNearby(
          userLatRef.current,
          userLngRef.current,
          externalQuery
        );
        renderMarkers(L, results, mapInstanceRef.current);
        // Re-center map on user location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(
            [userLatRef.current, userLngRef.current],
            14,
            { animate: true }
          );
        }
      } catch {
        setNoResults(true);
      } finally {
        setIsSearching(false);
      }
    };

    doSpecialtySearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  /* ── Pan to doctor on sidebar click ── */
  const panToDoctor = (doc: DoctorResult) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([doc.lat, doc.lng], 16, { animate: true });
    setSelectedDoctor(doc);

    // Open its popup
    markersLayerRef.current?.eachLayer((layer: any) => {
      if (
        layer.getLatLng?.().lat === doc.lat &&
        layer.getLatLng?.().lng === doc.lng
      ) {
        layer.openPopup();
      }
    });
  };

  /* ─────────────── JSX ─────────────── */
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-gray-200"
      style={{ height: "75vh" }}
    >
      {/* Leaflet CSS injected inline to avoid Next.js import issues */}
      <style>{`
        @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        .leaflet-container { font-family: system-ui, -apple-system, sans-serif; }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border: 1px solid #e5e7eb;
        }
        .leaflet-popup-tip { display: none; }
      `}</style>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[500] flex flex-col items-center justify-center">
          <div className="animate-spin border-4 border-teal-600 border-t-transparent rounded-full w-10 h-10" />
          <p className="text-sm text-gray-500 mt-3 font-medium">
            Finding nearby doctors…
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Using OpenStreetMap data
          </p>
        </div>
      )}

      {/* Error / Location Banner */}
      {locationError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 shadow-sm flex items-center gap-3 max-w-sm w-[calc(100%-2rem)]">
          <span className="flex-1">{locationError}</span>
          <button
            onClick={() => setLocationError(null)}
            className="text-amber-500 hover:text-amber-700 font-bold text-base leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      {!isLoading && (
        <form
          onSubmit={handleSearch}
          className="absolute top-4 left-4 z-[400] bg-white rounded-xl shadow-md border border-gray-200 flex items-center gap-2 px-4 py-2.5"
          style={{ right: doctorList.length > 0 ? "calc(1rem + 17rem + 1rem)" : "1rem" }}
        >
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctors, clinics, specialists…"
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400 min-w-0"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors shrink-0"
          >
            {isSearching ? "…" : "Search"}
          </button>
        </form>
      )}

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />

      {/* No Results */}
      {!isLoading && noResults && (
        <div className="absolute inset-0 flex items-center justify-center z-[300] pointer-events-none">
          <div className="bg-white/95 rounded-2xl shadow-lg px-8 py-8 flex flex-col items-center text-center pointer-events-auto">
            <span className="text-4xl mb-3">🩺</span>
            <p className="font-semibold text-gray-600 text-base">
              No results found nearby
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try a different search or zoom out
            </p>
          </div>
        </div>
      )}

      {/* Doctor Sidebar */}
      {doctorList.length > 0 && (
        <div className="absolute right-4 top-20 bottom-4 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 z-[400] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-white rounded-t-2xl shrink-0">
            <p className="font-semibold text-sm text-[#1E3A5F]">
              Nearby Results{" "}
              <span className="text-teal-600">({doctorList.length})</span>
            </p>
          </div>

          {/* Legend */}
          <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/70 flex flex-wrap gap-x-3 gap-y-1 shrink-0">
            {[
              { color: "#EF4444", label: "Hospital" },
              { color: "#0D9488", label: "Doctor" },
              { color: "#F59E0B", label: "Clinic" },
              { color: "#8B5CF6", label: "Pharmacy" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1 text-xs text-gray-500">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {doctorList.map((doc) => (
              <div
                key={doc.id}
                onClick={() => panToDoctor(doc)}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-teal-50 transition-colors ${
                  selectedDoctor?.id === doc.id
                    ? "bg-teal-50 border-l-4 border-l-teal-500"
                    : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="shrink-0 mt-0.5 w-2 h-2 rounded-full"
                    style={{ background: markerColor(doc.type) }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#1E3A5F] truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {doc.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background: markerColor(doc.type) + "22",
                          color: markerColor(doc.type),
                        }}
                      >
                        {typeLabel(doc.type)}
                      </span>
                      {doc.opening_hours && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Clock size={10} />
                          {doc.opening_hours.length > 12
                            ? doc.opening_hours.slice(0, 12) + "…"
                            : doc.opening_hours}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer attribution */}
          <div className="px-4 py-2 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-400 text-center">
              Data ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-teal-600"
              >
                OpenStreetMap
              </a>{" "}
              contributors
            </p>
          </div>
        </div>
      )}

      {/* Legend floating (when no sidebar) */}
      {!isLoading && doctorList.length === 0 && !noResults && (
        <div className="absolute bottom-6 left-4 z-[400] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow border border-gray-100 flex gap-3">
          {[
            { color: "#EF4444", label: "Hospital" },
            { color: "#0D9488", label: "Doctor" },
            { color: "#F59E0B", label: "Clinic" },
            { color: "#8B5CF6", label: "Pharmacy" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1 text-xs text-gray-600">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
