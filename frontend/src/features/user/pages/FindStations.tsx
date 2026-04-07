import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Car,
  Coffee,
  Eye,
  MapPin,
  Navigation,
  Phone,
  Plug,
  Plus,
  Search,
  UtensilsCrossed,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { getUserStations, type UserStation } from "@/api/userApi";
import { getWalletSummary } from "@/api/walletApi";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

type Coordinates = {
  latitude: number;
  longitude: number;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceInKm = (from: Coordinates, to: Coordinates) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const getPlugTypeBadgeClasses = (plugType: string) => {
  const normalizedType = plugType.trim().toUpperCase();

  if (normalizedType === "CCS2") {
    return {
      wrapper: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-600 text-white",
    };
  }

  if (normalizedType === "CHADEMO") {
    return {
      wrapper: "border-sky-200 bg-sky-50 text-sky-700",
      icon: "bg-sky-600 text-white",
    };
  }

  if (normalizedType === "TYPE2") {
    return {
      wrapper: "border-amber-200 bg-amber-50 text-amber-700",
      icon: "bg-amber-500 text-white",
    };
  }

  if (normalizedType === "GBT") {
    return {
      wrapper: "border-violet-200 bg-violet-50 text-violet-700",
      icon: "bg-violet-600 text-white",
    };
  }

  return {
    wrapper: "border-gray-200 bg-gray-50 text-gray-700",
    icon: "bg-gray-600 text-white",
  };
};

function PlugTypeBadge({ plugType }: { plugType: string }) {
  const styles = getPlugTypeBadgeClasses(plugType);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${styles.wrapper}`}
    >
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${styles.icon}`}
      >
        <Plug size={16} strokeWidth={2.2} />
      </span>
      {plugType}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-40 bg-gray-100 animate-pulse" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-3 w-1/3 rounded-full bg-gray-100 animate-pulse" />
        <div className="mt-4 h-8 w-full rounded-lg bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

export default function FindStations() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<UserStation[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "ready" | "blocked"
  >("idle");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [directionLoadingStationId, setDirectionLoadingStationId] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<UserStation | null>(
    null,
  );
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchStations = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }

        const data = await getUserStations();
        setStations(data);
        setError(null);
      } catch (err: any) {
        if (isInitialLoad) {
          console.error(
            "Failed to load stations:",
            err.response?.data || err.message,
          );
          setError(
            err.response?.data?.detail ||
              "Failed to load stations. Please try again.",
          );
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    void fetchStations(true);

    const intervalId = window.setInterval(() => {
      void fetchStations(false);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWalletSummary();
        setWalletBalance(Number(data.balance || 0));
      } catch {
        setWalletBalance(null);
      }
    };

    void fetchWallet();

    const walletInterval = window.setInterval(() => {
      void fetchWallet();
    }, 10000);

    return () => {
      window.clearInterval(walletInterval);
    };
  }, []);

  const requestUserLocation = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          reject(
            new Error(
              "Unable to access your location. Please allow location permission.",
            ),
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    });
  };

  const syncUserLocation = async () => {
    try {
      setError(null);
      setLocationStatus("loading");
      const currentLocation = await requestUserLocation();
      setUserLocation(currentLocation);
      setLocationStatus("ready");
    } catch {
      setLocationStatus("blocked");
      setError("Location access denied. Enable location to see distance.");
    }
  };

  const handleAskLocation = () => {
    const agreed = window.confirm(
      "Allow location access to show station distance from your current location?",
    );

    if (!agreed) {
      return;
    }

    void syncUserLocation();
  };

  const stationDistances = useMemo(() => {
    if (!userLocation) {
      return new Map<number, number>();
    }

    return new Map(
      stations.map((station) => [
        station.station_id,
        getDistanceInKm(userLocation, {
          latitude: station.latitude,
          longitude: station.longitude,
        }),
      ]),
    );
  }, [stations, userLocation]);

  const sortedStations = useMemo(() => {
    let filtered = stations;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = stations.filter(
        (station) =>
          station.station_name.toLowerCase().includes(query) ||
          station.address.toLowerCase().includes(query),
      );
    }

    if (!userLocation) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const distanceA = stationDistances.get(a.station_id) ?? Number.MAX_VALUE;
      const distanceB = stationDistances.get(b.station_id) ?? Number.MAX_VALUE;
      return distanceA - distanceB;
    });
  }, [stations, stationDistances, userLocation, searchQuery]);

  const openDirections = async (station: UserStation) => {
    try {
      setError(null);
      setDirectionLoadingStationId(station.station_id);

      const currentLocation = userLocation ?? (await requestUserLocation());
      if (!userLocation) {
        setUserLocation(currentLocation);
        setLocationStatus("ready");
      }

      const destination = `${station.latitude},${station.longitude}`;
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;

      const directionUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

      window.open(directionUrl, "_blank", "noopener,noreferrer");
    } catch (locationError: any) {
      setLocationStatus("blocked");
      setError(locationError?.message || "Unable to get your location.");
    } finally {
      setDirectionLoadingStationId(null);
    }
  };

  const availableCount = stations.filter(
    (s) => s.available_connectors > 0,
  ).length;
  const busyCount = stations.filter((s) => s.available_connectors === 0).length;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">
                  Live Network
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Charging Stations
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Find and navigate to nearby EV charging points
              </p>
            </div>

            {!loading && stations.length > 0 && (
              <div className="flex w-full max-w-lg flex-col gap-2 sm:items-end">
                <div className="grid w-full gap-2 sm:grid-cols-2">
                  <div className="flex h-14 items-center rounded-xl border border-emerald-200 bg-white px-3 shadow-sm">
                    <div className="flex w-full items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-600">
                          Total Balance
                        </p>
                        <p className="text-lg font-bold tracking-tight text-gray-900">
                          Rs{" "}
                          {walletBalance === null
                            ? "..."
                            : walletBalance.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Plus size={16} strokeWidth={2.4} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/user/wallet")}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    Add Balance
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-2xl border border-[#22C55E]/15 bg-[#22C55E]/8 px-3 py-1.5 text-xs font-medium text-[#16a34a] shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                    {availableCount} available
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    {busyCount} busy
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by station name or address…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition hover:bg-gray-300"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠</span>
            <p className="m-0">{error}</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
          {/* Skeletons */}
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {/* Empty state */}
          {!loading && sortedStations.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Zap size={22} />
              </div>
              <p className="mb-1.5 text-base font-semibold text-gray-700">
                {searchQuery ? "No results found" : "No stations available"}
              </p>
              <p className="max-w-xs text-sm text-gray-400">
                {searchQuery
                  ? `No stations match "${searchQuery}". Try a different search term.`
                  : "There are no charging stations available right now. Check back soon."}
              </p>
            </div>
          )}

          {/* Station Cards */}
          {!loading &&
            sortedStations.map((station) => {
              const distance = stationDistances.get(station.station_id);
              const isAvailable = station.available_connectors > 0;
              const plugTypes = (station.charger_types ?? []).filter(
                (plugType) => Boolean(plugType?.trim()),
              );
              const hasValidCoordinates =
                Number.isFinite(station.latitude) &&
                Number.isFinite(station.longitude);
              const mapKey = `${station.station_id}-${station.latitude}-${station.longitude}`;

              const amenities = [
                {
                  key: "wifi",
                  label: "WiFi",
                  enabled: station.has_wifi,
                  icon: Wifi,
                },
                {
                  key: "parking",
                  label: "Parking",
                  enabled: station.has_parking,
                  icon: Car,
                },
                {
                  key: "food",
                  label: "Food",
                  enabled: station.has_food,
                  icon: UtensilsCrossed,
                },
                {
                  key: "coffee",
                  label: "Coffee",
                  enabled: station.has_coffee,
                  icon: Coffee,
                },
                {
                  key: "bedroom",
                  label: "Bedroom",
                  enabled: station.has_bedroom,
                  icon: BedDouble,
                },
                {
                  key: "restroom",
                  label: "Restroom",
                  enabled: station.has_restroom,
                  icon: Bath,
                },
              ];

              return (
                <article
                  key={station.station_id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
                >
                  {/* Map */}
                  <div
                    key={`map-shell-${mapKey}`}
                    className="relative z-0 h-44 border-b border-gray-100"
                  >
                    {hasValidCoordinates ? (
                      <iframe
                        key={`map-${mapKey}`}
                        title={`Map preview of ${station.station_name}`}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${station.longitude - 0.01}%2C${station.latitude - 0.01}%2C${station.longitude + 0.01}%2C${station.latitude + 0.01}&layer=mapnik&marker=${station.latitude}%2C${station.longitude}`}
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-medium text-gray-500">
                        Map unavailable for this station
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Name + Status Badge */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-bold text-gray-900">
                          {station.station_name}
                        </h2>
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
                          <MapPin size={12} className="shrink-0" />
                          {station.address}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          isAvailable
                            ? "bg-[#22C55E]/10 text-[#22C55E]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isAvailable ? "bg-[#22C55E]" : "bg-gray-400"
                          }`}
                        />
                        {isAvailable ? "AVAILABLE" : "BUSY"}
                      </span>
                    </div>

                    {/* Distance & Phone */}
                    <div className="mb-3 flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Navigation
                          size={13}
                          className="shrink-0 text-gray-400"
                        />
                        {typeof distance === "number" ? (
                          <span className="font-medium">
                            {`${distance.toFixed(1)} km`}
                          </span>
                        ) : locationStatus === "loading" ? (
                          <span className="font-medium">
                            Getting location...
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleAskLocation}
                            className="inline-flex items-center rounded-full border border-[#22C55E]/20 bg-[#22C55E]/8 px-2.5 py-0.5 font-medium text-[#16a34a] transition hover:border-[#22C55E]/30 hover:bg-[#22C55E]/15"
                          >
                            Distance unavailable
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Phone size={13} className="shrink-0 text-gray-400" />
                        <span className="truncate">
                          {station.phone_number || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Chargers Info */}
                    <div className="mb-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          <Plug size={14} className="shrink-0 text-[#22C55E]" />
                          Plug Types
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#22C55E]/10 px-2 py-1 text-xs font-bold text-[#22C55E]">
                          {station.available_connectors}/
                          {station.total_connectors}
                        </span>
                      </div>

                      {plugTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {plugTypes.map((plugType) => (
                            <PlugTypeBadge
                              key={`${station.station_id}-${plugType}`}
                              plugType={plugType}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Plug types not available.
                        </p>
                      )}
                    </div>

                    {/* Amenities Icons */}
                    {amenities.some((a) => a.enabled) && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {amenities.map((amenity) => {
                          if (!amenity.enabled) return null;
                          const AmenityIcon = amenity.icon;
                          return (
                            <span
                              key={amenity.key}
                              title={amenity.label}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                            >
                              <AmenityIcon size={16} />
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => void openDirections(station)}
                        disabled={
                          directionLoadingStationId === station.station_id
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#22C55E] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#16a34a] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Navigation size={14} />
                        {directionLoadingStationId === station.station_id
                          ? "Getting location…"
                          : "Get Directions"}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStation(station)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/user/stations/${station.station_id}/availability`,
                            )
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-[0.98]"
                        >
                          <Plug size={13} />
                          Chargers
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>

        <Dialog
          open={selectedStation !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedStation(null);
            }
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {selectedStation && (
              <>
                <DialogHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 pb-4 pt-6 pr-14 backdrop-blur supports-backdrop-filter:bg-white/85">
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {selectedStation.station_name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500">
                    Detailed station information and amenities.
                  </DialogDescription>

                  <DialogClose
                    className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </DialogClose>
                </DialogHeader>

                <ScrollArea className="h-[70vh] bg-slate-50/60">
                  <div className="space-y-5 px-6 py-5 pb-6">
                    {selectedStation.station_images.length > 0 && (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Station Images
                          </h3>
                          <p className="mt-1 text-xs text-gray-400">
                            Photos of the station and charging area.
                          </p>
                        </div>
                        <div className="grid gap-2 p-3 sm:grid-cols-2">
                          {selectedStation.station_images.map(
                            (imageUrl, index) => (
                              <div
                                key={imageUrl}
                                className={`overflow-hidden rounded-xl border border-slate-100 bg-slate-100 ${
                                  index === 0 &&
                                  selectedStation.station_images.length > 1
                                    ? "sm:col-span-2 h-56"
                                    : "h-36"
                                }`}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`${selectedStation.station_name} ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Station Details
                      </h3>
                      <div className="space-y-2.5 text-sm text-gray-700">
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-gray-400"
                          />
                          <div>
                            <p className="text-xs text-gray-500">Address</p>
                            <p className="font-medium text-gray-900">
                              {selectedStation.address}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs text-gray-500">
                              Total Chargers
                            </p>
                            <p className="font-semibold text-gray-900">
                              {selectedStation.total_chargers}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs text-gray-500">Contact</p>
                            <p className="font-semibold text-gray-900">
                              {selectedStation.phone_number ||
                                "No phone listed"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Plugs
                      </h3>
                      {(selectedStation.charger_types ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(selectedStation.charger_types ?? []).map(
                            (plugType) => (
                              <PlugTypeBadge
                                key={`${selectedStation.station_id}-${plugType}`}
                                plugType={plugType}
                              />
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Plug types not available.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          {
                            key: "wifi",
                            label: "WiFi",
                            enabled: selectedStation.has_wifi,
                            icon: Wifi,
                          },
                          {
                            key: "parking",
                            label: "Parking",
                            enabled: selectedStation.has_parking,
                            icon: Car,
                          },
                          {
                            key: "food",
                            label: "Food",
                            enabled: selectedStation.has_food,
                            icon: UtensilsCrossed,
                          },
                          {
                            key: "coffee",
                            label: "Coffee",
                            enabled: selectedStation.has_coffee,
                            icon: Coffee,
                          },
                          {
                            key: "bedroom",
                            label: "Bedroom",
                            enabled: selectedStation.has_bedroom,
                            icon: BedDouble,
                          },
                          {
                            key: "restroom",
                            label: "Restroom",
                            enabled: selectedStation.has_restroom,
                            icon: Bath,
                          },
                        ].map((amenity) => {
                          const AmenityIcon = amenity.icon;
                          return (
                            <div
                              key={amenity.key}
                              className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                                amenity.enabled
                                  ? "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]"
                                  : "border-gray-200 bg-gray-50 text-gray-500"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <AmenityIcon size={13} />
                                {amenity.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Description
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedStation.station_description ||
                          "No station description available."}
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
