// import { useEffect, useMemo, useState } from "react";
// import {
//   Bath,
//   BedDouble,
//   Car,
//   CircleUserRound,
//   Coffee,
//   Eye,
//   MapPin,
//   MessageSquare,
//   Navigation,
//   Phone,
//   Plug,
//   Plus,
//   Search,
//   Star,
//   UtensilsCrossed,
//   Wifi,
//   X,
//   Zap,
// } from "lucide-react";
// import { getUserStations, type UserStation } from "@/api/userApi";
// import {
//   getStationReviews,
//   upsertStationReview,
//   type StationReview,
// } from "@/api/stationReviewApi";
// import { getWalletSummary } from "@/api/walletApi";
// import {
//   DialogClose,
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { useNavigate } from "react-router-dom";
// import "leaflet/dist/leaflet.css";

// type Coordinates = {
//   latitude: number;
//   longitude: number;
// };

// type AmenityItem = {
//   key: string;
//   label: string;
//   enabled: boolean;
//   icon: typeof Wifi;
// };

// const buildAmenities = (station: UserStation): AmenityItem[] => [
//   {
//     key: "wifi",
//     label: "WiFi",
//     enabled: station.has_wifi,
//     icon: Wifi,
//   },
//   {
//     key: "parking",
//     label: "Parking",
//     enabled: station.has_parking,
//     icon: Car,
//   },
//   {
//     key: "food",
//     label: "Food",
//     enabled: station.has_food,
//     icon: UtensilsCrossed,
//   },
//   {
//     key: "coffee",
//     label: "Coffee",
//     enabled: station.has_coffee,
//     icon: Coffee,
//   },
//   {
//     key: "bedroom",
//     label: "Bedroom",
//     enabled: station.has_bedroom,
//     icon: BedDouble,
//   },
//   {
//     key: "restroom",
//     label: "Restroom",
//     enabled: station.has_restroom,
//     icon: Bath,
//   },
// ];

// const toRadians = (value: number) => (value * Math.PI) / 180;

// const getDistanceInKm = (from: Coordinates, to: Coordinates) => {
//   const earthRadiusKm = 6371;
//   const deltaLat = toRadians(to.latitude - from.latitude);
//   const deltaLng = toRadians(to.longitude - from.longitude);

//   const a =
//     Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
//     Math.cos(toRadians(from.latitude)) *
//       Math.cos(toRadians(to.latitude)) *
//       Math.sin(deltaLng / 2) *
//       Math.sin(deltaLng / 2);

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return earthRadiusKm * c;
// };

// const getPlugTypeBadgeClasses = (plugType: string) => {
//   const normalizedType = plugType.trim().toUpperCase();

//   if (normalizedType === "CCS2") {
//     return {
//       wrapper: "border-emerald-200 bg-emerald-50 text-emerald-700",
//       icon: "bg-emerald-600 text-white",
//     };
//   }

//   if (normalizedType === "CHADEMO") {
//     return {
//       wrapper: "border-sky-200 bg-sky-50 text-sky-700",
//       icon: "bg-sky-600 text-white",
//     };
//   }

//   if (normalizedType === "TYPE2") {
//     return {
//       wrapper: "border-amber-200 bg-amber-50 text-amber-700",
//       icon: "bg-amber-500 text-white",
//     };
//   }

//   if (normalizedType === "GBT") {
//     return {
//       wrapper: "border-violet-200 bg-violet-50 text-violet-700",
//       icon: "bg-violet-600 text-white",
//     };
//   }

//   return {
//     wrapper: "border-gray-200 bg-gray-50 text-gray-700",
//     icon: "bg-gray-600 text-white",
//   };
// };

// function PlugTypeBadge({ plugType }: { plugType: string }) {
//   const styles = getPlugTypeBadgeClasses(plugType);

//   return (
//     <span
//       className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${styles.wrapper}`}
//     >
//       <span
//         className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${styles.icon}`}
//       >
//         <Plug size={16} strokeWidth={2.2} />
//       </span>
//       {plugType}
//     </span>
//   );
// }

// function SkeletonCard() {
//   return (
//     <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
//       <div className="h-40 bg-gray-100 animate-pulse" />
//       <div className="space-y-3 p-4">
//         <div className="h-4 w-2/3 rounded-full bg-gray-100 animate-pulse" />
//         <div className="h-3 w-1/2 rounded-full bg-gray-100 animate-pulse" />
//         <div className="h-3 w-1/3 rounded-full bg-gray-100 animate-pulse" />
//         <div className="mt-4 h-8 w-full rounded-lg bg-gray-100 animate-pulse" />
//       </div>
//     </div>
//   );
// }

// export default function FindStations() {
//   const navigate = useNavigate();
//   const [stations, setStations] = useState<UserStation[]>([]);
//   const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
//   const [locationStatus, setLocationStatus] = useState<
//     "idle" | "loading" | "ready" | "blocked"
//   >("idle");
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [directionLoadingStationId, setDirectionLoadingStationId] = useState<
//     number | null
//   >(null);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedStation, setSelectedStation] = useState<UserStation | null>(
//     null,
//   );
//   const [walletBalance, setWalletBalance] = useState<number | null>(null);
//   const [stationReviews, setStationReviews] = useState<StationReview[]>([]);
//   const [reviewsLoading, setReviewsLoading] = useState(false);
//   const [reviewRating, setReviewRating] = useState<number>(0);
//   const [reviewText, setReviewText] = useState("");
//   const [submittingReview, setSubmittingReview] = useState(false);

//   const fetchStations = async (isInitialLoad = false) => {
//     try {
//       if (isInitialLoad) {
//         setLoading(true);
//       }

//       const data = await getUserStations();
//       setStations(data);
//       setError(null);
//       return data;
//     } catch (err: any) {
//       if (isInitialLoad) {
//         console.error(
//           "Failed to load stations:",
//           err.response?.data || err.message,
//         );
//         setError(
//           err.response?.data?.detail ||
//             "Failed to load stations. Please try again.",
//         );
//       }
//       return null;
//     } finally {
//       if (isInitialLoad) {
//         setLoading(false);
//       }
//     }
//   };

//   useEffect(() => {
//     void fetchStations(true);

//     const intervalId = window.setInterval(() => {
//       void fetchStations(false);
//     }, 3000);

//     return () => {
//       window.clearInterval(intervalId);
//     };
//   }, []);

//   useEffect(() => {
//     const fetchWallet = async () => {
//       try {
//         const data = await getWalletSummary();
//         setWalletBalance(Number(data.balance || 0));
//       } catch {
//         setWalletBalance(null);
//       }
//     };

//     void fetchWallet();

//     const walletInterval = window.setInterval(() => {
//       void fetchWallet();
//     }, 10000);

//     return () => {
//       window.clearInterval(walletInterval);
//     };
//   }, []);

//   const loadStationReviews = async (stationId: number) => {
//     try {
//       setReviewsLoading(true);
//       const reviews = await getStationReviews(stationId);
//       setStationReviews(reviews);
//     } catch {
//       setStationReviews([]);
//     } finally {
//       setReviewsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!selectedStation) {
//       setStationReviews([]);
//       return;
//     }

//     setReviewRating(selectedStation.my_rating ?? 0);
//     setReviewText("");
//     void loadStationReviews(selectedStation.station_id);
//   }, [selectedStation]);

//   const submitReview = async () => {
//     if (!selectedStation) {
//       return;
//     }

//     if (reviewRating < 1 || reviewRating > 5) {
//       setError("Please select a rating between 1 and 5 stars.");
//       return;
//     }

//     try {
//       setSubmittingReview(true);
//       setError(null);

//       await upsertStationReview(selectedStation.station_id, {
//         rating: reviewRating,
//         review_text: reviewText.trim() || undefined,
//       });

//       const refreshedStations = await fetchStations(false);
//       const nextStations = refreshedStations ?? stations;
//       const refreshedSelected = nextStations.find(
//         (station) => station.station_id === selectedStation.station_id,
//       );
//       if (refreshedSelected) {
//         setSelectedStation(refreshedSelected);
//       }

//       await loadStationReviews(selectedStation.station_id);
//     } catch (err: any) {
//       setError(err?.response?.data?.detail || "Failed to submit review.");
//     } finally {
//       setSubmittingReview(false);
//     }
//   };

//   const requestUserLocation = (): Promise<Coordinates> => {
//     return new Promise((resolve, reject) => {
//       if (!navigator.geolocation) {
//         reject(new Error("Geolocation is not supported by your browser."));
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           resolve({
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//           });
//         },
//         () => {
//           reject(
//             new Error(
//               "Unable to access your location. Please allow location permission.",
//             ),
//           );
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 60000,
//         },
//       );
//     });
//   };

//   const syncUserLocation = async () => {
//     try {
//       setError(null);
//       setLocationStatus("loading");
//       const currentLocation = await requestUserLocation();
//       setUserLocation(currentLocation);
//       setLocationStatus("ready");
//     } catch {
//       setLocationStatus("blocked");
//       setError("Location access denied. Enable location to see distance.");
//     }
//   };

//   const handleAskLocation = () => {
//     const agreed = window.confirm(
//       "Allow location access to show station distance from your current location?",
//     );

//     if (!agreed) {
//       return;
//     }

//     void syncUserLocation();
//   };

//   const stationDistances = useMemo(() => {
//     if (!userLocation) {
//       return new Map<number, number>();
//     }

//     return new Map(
//       stations.map((station) => [
//         station.station_id,
//         getDistanceInKm(userLocation, {
//           latitude: station.latitude,
//           longitude: station.longitude,
//         }),
//       ]),
//     );
//   }, [stations, userLocation]);

//   const sortedStations = useMemo(() => {
//     let filtered = stations;

//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase();
//       filtered = stations.filter(
//         (station) =>
//           station.station_name.toLowerCase().includes(query) ||
//           station.address.toLowerCase().includes(query),
//       );
//     }

//     if (!userLocation) {
//       return filtered;
//     }

//     return [...filtered].sort((a, b) => {
//       const distanceA = stationDistances.get(a.station_id) ?? Number.MAX_VALUE;
//       const distanceB = stationDistances.get(b.station_id) ?? Number.MAX_VALUE;
//       return distanceA - distanceB;
//     });
//   }, [stations, stationDistances, userLocation, searchQuery]);

//   const openDirections = async (station: UserStation) => {
//     try {
//       setError(null);
//       setDirectionLoadingStationId(station.station_id);

//       const currentLocation = userLocation ?? (await requestUserLocation());
//       if (!userLocation) {
//         setUserLocation(currentLocation);
//         setLocationStatus("ready");
//       }

//       const destination = `${station.latitude},${station.longitude}`;
//       const origin = `${currentLocation.latitude},${currentLocation.longitude}`;

//       const directionUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

//       window.open(directionUrl, "_blank", "noopener,noreferrer");
//     } catch (locationError: any) {
//       setLocationStatus("blocked");
//       setError(locationError?.message || "Unable to get your location.");
//     } finally {
//       setDirectionLoadingStationId(null);
//     }
//   };

//   const availableCount = stations.filter(
//     (s) => s.available_connectors > 0,
//   ).length;
//   const busyCount = stations.filter((s) => s.available_connectors === 0).length;

//   return (
//     <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dff4e9_0%,#f8fafc_40%,#f8fafc_100%)] px-4 py-6 md:px-6 md:py-10">
//       <div className="mx-auto max-w-7xl">
//         <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//           <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
//             <div className="max-w-2xl">
//               <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
//                 <span className="h-2 w-2 rounded-full bg-emerald-500" />
//                 Live network
//               </div>
//               <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
//                 Find Charging Stations
//               </h1>
//               <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
//                 Search nearby charging stations, compare availability, and open
//                 directions in a simple layout that stays easy to read.
//               </p>
//               <div className="mt-4">
//                 <button
//                   type="button"
//                   onClick={() => navigate("/user/profile")}
//                   className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
//                 >
//                   <CircleUserRound size={16} />
//                   My Profile
//                 </button>
//               </div>
//             </div>

//             {!loading && stations.length > 0 && (
//               <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl lg:justify-end">
//                 <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
//                   <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
//                     Wallet Balance
//                   </p>
//                   <p className="mt-1 text-xl font-bold text-slate-900">
//                     Rs{" "}
//                     {walletBalance === null ? "..." : walletBalance.toFixed(2)}
//                   </p>
//                 </div>

//                 <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
//                   <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
//                     Station Health
//                   </p>
//                   <p className="mt-1 text-xl font-bold text-slate-900">
//                     {stations.length} stations live
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
//                   <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
//                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//                     {availableCount} available
//                   </span>
//                   <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
//                     <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
//                     {busyCount} busy
//                   </span>
//                   <button
//                     type="button"
//                     onClick={() => navigate("/user/wallet")}
//                     className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
//                   >
//                     <Plus size={14} strokeWidth={2.3} />
//                     Manage Wallet
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="px-5 py-5">
//             <div className="relative">
//               <Search
//                 size={15}
//                 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
//               />
//               <input
//                 type="text"
//                 placeholder="Search by station name or address"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
//               />
//               {searchQuery && (
//                 <button
//                   type="button"
//                   onClick={() => setSearchQuery("")}
//                   className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
//                 >
//                   <X size={11} />
//                 </button>
//               )}
//             </div>
//           </div>
//         </section>

//         {/* Error */}
//         {error && (
//           <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//             <span className="mt-0.5 shrink-0">⚠</span>
//             <p className="m-0">{error}</p>
//           </div>
//         )}

//         {/* Grid */}
//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
//           {/* Skeletons */}
//           {loading && (
//             <>
//               <SkeletonCard />
//               <SkeletonCard />
//               <SkeletonCard />
//               <SkeletonCard />
//             </>
//           )}

//           {/* Empty state */}
//           {!loading && sortedStations.length === 0 && (
//             <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
//               <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
//                 <Zap size={22} />
//               </div>
//               <p className="mb-1.5 text-base font-semibold text-gray-700">
//                 {searchQuery ? "No results found" : "No stations available"}
//               </p>
//               <p className="max-w-xs text-sm text-gray-400">
//                 {searchQuery
//                   ? `No stations match "${searchQuery}". Try a different search term.`
//                   : "There are no charging stations available right now. Check back soon."}
//               </p>
//             </div>
//           )}

//           {/* Station Cards */}
//           {!loading &&
//             sortedStations.map((station) => {
//               const distance = stationDistances.get(station.station_id);
//               const isAvailable = station.available_connectors > 0;
//               const plugTypes = (station.charger_types ?? []).filter(
//                 (plugType) => Boolean(plugType?.trim()),
//               );
//               const amenities = buildAmenities(station);
//               const hasValidCoordinates =
//                 Number.isFinite(station.latitude) &&
//                 Number.isFinite(station.longitude);
//               const mapKey = `${station.station_id}-${station.latitude}-${station.longitude}`;

//               return (
//                 <article
//                   key={station.station_id}
//                   className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
//                 >
//                   {/* Map */}
//                   <div
//                     key={`map-shell-${mapKey}`}
//                     className="relative z-0 h-44 border-b border-slate-100"
//                   >
//                     {hasValidCoordinates ? (
//                       <iframe
//                         key={`map-${mapKey}`}
//                         title={`Map preview of ${station.station_name}`}
//                         src={`https://www.openstreetmap.org/export/embed.html?bbox=${station.longitude - 0.01}%2C${station.latitude - 0.01}%2C${station.longitude + 0.01}%2C${station.latitude + 0.01}&layer=mapnik&marker=${station.latitude}%2C${station.longitude}`}
//                         className="h-full w-full border-0"
//                         loading="lazy"
//                         referrerPolicy="no-referrer-when-downgrade"
//                       />
//                     ) : (
//                       <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-medium text-gray-500">
//                         Map unavailable for this station
//                       </div>
//                     )}
//                   </div>

//                   {/* Card Body */}
//                   <div className="p-4 md:p-5">
//                     {/* Name + Status Badge */}
//                     <div className="mb-4 flex items-start justify-between gap-3">
//                       <div className="min-w-0 flex-1">
//                         <h2 className="truncate text-lg font-bold text-slate-900">
//                           {station.station_name}
//                         </h2>
//                         <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500">
//                           <MapPin size={12} className="shrink-0" />
//                           {station.address}
//                         </p>
//                         <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
//                           <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
//                             <Star
//                               size={12}
//                               className="fill-amber-400 text-amber-500"
//                             />
//                             {station.review_count > 0
//                               ? station.average_rating.toFixed(1)
//                               : "New"}
//                           </span>
//                           <span className="text-slate-500">
//                             {station.review_count} review
//                             {station.review_count === 1 ? "" : "s"}
//                           </span>
//                         </div>
//                       </div>
//                       <span
//                         className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
//                           isAvailable
//                             ? "bg-[#22C55E]/10 text-[#22C55E]"
//                             : "bg-gray-100 text-gray-500"
//                         }`}
//                       >
//                         <span
//                           className={`h-1.5 w-1.5 rounded-full ${
//                             isAvailable ? "bg-[#22C55E]" : "bg-gray-400"
//                           }`}
//                         />
//                         {isAvailable ? "AVAILABLE" : "BUSY"}
//                       </span>
//                     </div>

//                     {/* Distance & Phone */}
//                     <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
//                       <div className="flex items-center gap-1.5 text-sm text-slate-600">
//                         <Navigation
//                           size={13}
//                           className="shrink-0 text-slate-400"
//                         />
//                         {typeof distance === "number" ? (
//                           <span className="font-medium text-slate-700">
//                             {`${distance.toFixed(1)} km`}
//                           </span>
//                         ) : locationStatus === "loading" ? (
//                           <span className="font-medium text-slate-700">
//                             Getting location...
//                           </span>
//                         ) : (
//                           <button
//                             type="button"
//                             onClick={handleAskLocation}
//                             className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700 transition hover:bg-emerald-100"
//                           >
//                             Distance unavailable
//                           </button>
//                         )}
//                       </div>
//                       <div className="flex items-center gap-1.5 text-sm text-slate-600">
//                         <Phone size={13} className="shrink-0 text-slate-400" />
//                         <span className="truncate text-slate-700">
//                           {station.phone_number || "N/A"}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Chargers Info */}
//                     <div className="mb-4 space-y-3">
//                       <div className="flex items-center justify-between gap-2">
//                         <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
//                           <Plug
//                             size={14}
//                             className="shrink-0 text-emerald-600"
//                           />
//                           Plug Types
//                         </div>
//                         <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
//                           {station.available_connectors}/
//                           {station.total_connectors}
//                         </span>
//                       </div>

//                       {plugTypes.length > 0 ? (
//                         <div className="flex flex-wrap gap-2">
//                           {plugTypes.map((plugType) => (
//                             <PlugTypeBadge
//                               key={`${station.station_id}-${plugType}`}
//                               plugType={plugType}
//                             />
//                           ))}
//                         </div>
//                       ) : (
//                         <p className="text-xs text-slate-500">
//                           Plug types not available.
//                         </p>
//                       )}
//                     </div>

//                     {/* Amenities Icons */}
//                     {amenities.some((a) => a.enabled) && (
//                       <div className="mb-4 flex flex-wrap gap-2">
//                         {amenities.map((amenity) => {
//                           if (!amenity.enabled) return null;
//                           const AmenityIcon = amenity.icon;
//                           return (
//                             <span
//                               key={amenity.key}
//                               title={amenity.label}
//                               className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
//                             >
//                               <AmenityIcon size={16} />
//                             </span>
//                           );
//                         })}
//                       </div>
//                     )}

//                     {/* Actions */}
//                     <div className="flex flex-col gap-2.5">
//                       <button
//                         type="button"
//                         onClick={() => void openDirections(station)}
//                         disabled={
//                           directionLoadingStationId === station.station_id
//                         }
//                         className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
//                       >
//                         <Navigation size={14} />
//                         {directionLoadingStationId === station.station_id
//                           ? "Getting location…"
//                           : "Get Directions"}
//                       </button>

//                       <div className="grid grid-cols-2 gap-2">
//                         <button
//                           type="button"
//                           onClick={() => setSelectedStation(station)}
//                           className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
//                         >
//                           <Eye size={13} />
//                           Details
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() =>
//                             navigate(
//                               `/user/stations/${station.station_id}/availability`,
//                             )
//                           }
//                           className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]"
//                         >
//                           <Plug size={13} />
//                           Chargers
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </article>
//               );
//             })}
//         </div>

//         <Dialog
//           open={selectedStation !== null}
//           onOpenChange={(open) => {
//             if (!open) {
//               setSelectedStation(null);
//             }
//           }}
//         >
//           <DialogContent
//             showCloseButton={false}
//             className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
//           >
//             {selectedStation && (
//               <>
//                 <DialogHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 pb-4 pt-6 pr-14 backdrop-blur supports-backdrop-filter:bg-white/85">
//                   <DialogTitle className="text-xl font-bold text-gray-900">
//                     {selectedStation.station_name}
//                   </DialogTitle>
//                   <DialogDescription className="text-slate-500">
//                     Detailed station information and amenities.
//                   </DialogDescription>

//                   <DialogClose
//                     className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
//                     aria-label="Close"
//                   >
//                     <X size={16} />
//                   </DialogClose>
//                 </DialogHeader>

//                 <ScrollArea className="h-[70vh] bg-slate-50/60">
//                   <div className="space-y-5 px-6 py-5 pb-6">
//                     <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//                       <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                         Station Details
//                       </h3>
//                       <div className="space-y-2.5 text-sm text-gray-700">
//                         <div className="flex items-start gap-2">
//                           <MapPin
//                             size={15}
//                             className="mt-0.5 shrink-0 text-gray-400"
//                           />
//                           <div>
//                             <p className="text-xs text-gray-500">Address</p>
//                             <p className="font-medium text-gray-900">
//                               {selectedStation.address}
//                             </p>
//                           </div>
//                         </div>
//                         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//                           <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
//                             <p className="text-xs text-gray-500">
//                               Total Chargers
//                             </p>
//                             <p className="font-semibold text-gray-900">
//                               {selectedStation.total_chargers}
//                             </p>
//                           </div>
//                           <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
//                             <p className="text-xs text-gray-500">Contact</p>
//                             <p className="font-semibold text-gray-900">
//                               {selectedStation.phone_number ||
//                                 "No phone listed"}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//                       <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                         Ratings & Reviews
//                       </h3>

//                       <div className="mb-4 grid gap-3 sm:grid-cols-2">
//                         <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
//                           <p className="text-xs text-amber-700">
//                             Average Rating
//                           </p>
//                           <p className="mt-1 flex items-center gap-1 text-lg font-bold text-amber-800">
//                             <Star
//                               size={16}
//                               className="fill-amber-400 text-amber-500"
//                             />
//                             {selectedStation.review_count > 0
//                               ? selectedStation.average_rating.toFixed(1)
//                               : "No ratings yet"}
//                           </p>
//                         </div>
//                         <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
//                           <p className="text-xs text-slate-500">
//                             Total Reviews
//                           </p>
//                           <p className="mt-1 text-lg font-bold text-slate-800">
//                             {selectedStation.review_count}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="mb-3">
//                         <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
//                           Your Rating
//                         </p>
//                         <div className="flex items-center gap-1">
//                           {[1, 2, 3, 4, 5].map((value) => (
//                             <button
//                               key={value}
//                               type="button"
//                               onClick={() => setReviewRating(value)}
//                               className="rounded-md p-1 transition hover:bg-amber-50"
//                               aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
//                             >
//                               <Star
//                                 size={18}
//                                 className={
//                                   value <= reviewRating
//                                     ? "fill-amber-400 text-amber-500"
//                                     : "text-slate-300"
//                                 }
//                               />
//                             </button>
//                           ))}
//                         </div>
//                       </div>

//                       <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
//                         Your Review
//                       </label>
//                       <textarea
//                         value={reviewText}
//                         onChange={(e) => setReviewText(e.target.value)}
//                         rows={3}
//                         maxLength={1000}
//                         placeholder="Share your charging experience (optional)."
//                         className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
//                       />

//                       <div className="mt-3 flex items-center justify-between gap-3">
//                         <p className="text-xs text-slate-500">
//                           {selectedStation.my_rating
//                             ? `Your last rating: ${selectedStation.my_rating}/5`
//                             : "You have not reviewed this station yet."}
//                         </p>
//                         <button
//                           type="button"
//                           onClick={() => void submitReview()}
//                           disabled={submittingReview}
//                           className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
//                         >
//                           <MessageSquare size={13} />
//                           {submittingReview ? "Submitting..." : "Submit Review"}
//                         </button>
//                       </div>

//                       <div className="mt-4 border-t border-slate-100 pt-4">
//                         <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
//                           Recent Reviews
//                         </p>
//                         {reviewsLoading ? (
//                           <p className="text-sm text-slate-500">
//                             Loading reviews...
//                           </p>
//                         ) : stationReviews.length === 0 ? (
//                           <p className="text-sm text-slate-500">
//                             No reviews yet.
//                           </p>
//                         ) : (
//                           <div className="space-y-2">
//                             {stationReviews.slice(0, 5).map((review) => (
//                               <div
//                                 key={review.review_id}
//                                 className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
//                               >
//                                 <div className="flex items-center justify-between gap-2">
//                                   <p className="truncate text-xs font-semibold text-slate-700">
//                                     {review.user_name || "User"}
//                                   </p>
//                                   <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
//                                     <Star
//                                       size={12}
//                                       className="fill-amber-400 text-amber-500"
//                                     />
//                                     {review.rating}/5
//                                   </span>
//                                 </div>
//                                 <p className="mt-1 text-xs text-slate-600">
//                                   {review.review_text || "No comment provided."}
//                                 </p>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//                       <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                         Plugs
//                       </h3>
//                       {(selectedStation.charger_types ?? []).length > 0 ? (
//                         <div className="flex flex-wrap gap-2">
//                           {(selectedStation.charger_types ?? []).map(
//                             (plugType) => (
//                               <PlugTypeBadge
//                                 key={`${selectedStation.station_id}-${plugType}`}
//                                 plugType={plugType}
//                               />
//                             ),
//                           )}
//                         </div>
//                       ) : (
//                         <p className="text-sm text-gray-500">
//                           Plug types not available.
//                         </p>
//                       )}
//                     </div>

//                     <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//                       <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                         Amenities
//                       </h3>
//                       {(() => {
//                         const amenities = buildAmenities(selectedStation);
//                         return (
//                           <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
//                             {amenities.map((amenity) => {
//                               const AmenityIcon = amenity.icon;
//                               return (
//                                 <div
//                                   key={amenity.key}
//                                   className={`rounded-lg border px-3 py-2 text-xs font-medium ${
//                                     amenity.enabled
//                                       ? "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]"
//                                       : "border-gray-200 bg-gray-50 text-gray-500"
//                                   }`}
//                                 >
//                                   <span className="inline-flex items-center gap-1.5">
//                                     <AmenityIcon size={13} />
//                                     {amenity.label}
//                                   </span>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         );
//                       })()}
//                     </div>

//                     <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//                       <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
//                         Description
//                       </h3>
//                       <p className="text-sm text-gray-700 leading-relaxed">
//                         {selectedStation.station_description ||
//                           "No station description available."}
//                       </p>
//                     </div>

//                     {selectedStation.station_images.length > 0 && (
//                       <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//                         <div className="border-b border-slate-200 px-4 py-3">
//                           <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
//                             Station Images
//                           </h3>
//                           <p className="mt-1 text-xs text-gray-400">
//                             Photos of the station and charging area.
//                           </p>
//                         </div>
//                         <div className="grid gap-2 p-3 sm:grid-cols-2">
//                           {selectedStation.station_images.map(
//                             (imageUrl, index) => (
//                               <div
//                                 key={imageUrl}
//                                 className={`overflow-hidden rounded-xl border border-slate-100 bg-slate-100 ${
//                                   index === 0 &&
//                                   selectedStation.station_images.length > 1
//                                     ? "sm:col-span-2 h-56"
//                                     : "h-36"
//                                 }`}
//                               >
//                                 <img
//                                   src={imageUrl}
//                                   alt={`${selectedStation.station_name} ${index + 1}`}
//                                   className="h-full w-full object-cover"
//                                 />
//                               </div>
//                             ),
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </ScrollArea>
//               </>
//             )}
//           </DialogContent>
//         </Dialog>
//       </div>
//     </main>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Car,
  CircleUserRound,
  Coffee,
  Eye,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Plug,
  Plus,
  Search,
  Star,
  UtensilsCrossed,
  Wifi,
  X,
  Zap,
  ChevronRight,
  Signal,
  Wallet,
} from "lucide-react";
import { getUserStations, type UserStation } from "@/api/userApi";
import {
  getStationReviews,
  upsertStationReview,
  type StationReview,
} from "@/api/stationReviewApi";
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
import { toast } from "sonner";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type DistanceFilter = "all" | 5 | 10;

const normalizeDistanceFilter = (value: unknown): DistanceFilter => {
  if (value === 5 || value === "5" || value === 5.0 || value === "5.0") {
    return 5;
  }
  if (value === 10 || value === "10" || value === 10.0 || value === "10.0") {
    return 10;
  }
  return "all";
};

type AmenityItem = {
  key: string;
  label: string;
  enabled: boolean;
  icon: typeof Wifi;
};

const buildAmenities = (station: UserStation): AmenityItem[] => [
  { key: "wifi", label: "WiFi", enabled: station.has_wifi, icon: Wifi },
  { key: "parking", label: "Parking", enabled: station.has_parking, icon: Car },
  {
    key: "food",
    label: "Food",
    enabled: station.has_food,
    icon: UtensilsCrossed,
  },
  { key: "coffee", label: "Coffee", enabled: station.has_coffee, icon: Coffee },
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
  if (normalizedType === "CCS2")
    return {
      wrapper: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-600 text-white",
    };
  if (normalizedType === "CHADEMO")
    return {
      wrapper: "border-sky-200 bg-sky-50 text-sky-700",
      icon: "bg-sky-600 text-white",
    };
  if (normalizedType === "TYPE2")
    return {
      wrapper: "border-amber-200 bg-amber-50 text-amber-700",
      icon: "bg-amber-500 text-white",
    };
  if (normalizedType === "GBT")
    return {
      wrapper: "border-violet-200 bg-violet-50 text-violet-700",
      icon: "bg-violet-600 text-white",
    };
  return {
    wrapper: "border-gray-200 bg-gray-50 text-gray-700",
    icon: "bg-gray-600 text-white",
  };
};

function PlugTypeBadge({ plugType }: { plugType: string }) {
  const styles = getPlugTypeBadgeClasses(plugType);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${styles.wrapper}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded ${styles.icon}`}
      >
        <Plug size={11} strokeWidth={2.4} />
      </span>
      {plugType}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="h-36 bg-gray-50 animate-pulse" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
        <div className="mt-4 h-9 w-full rounded-lg bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

const toErrorMessage = (err: unknown, fallback: string) => {
  const anyErr = err as any;
  const detail = anyErr?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && typeof item.msg === "string") {
          return item.msg;
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");

    if (message) {
      return message;
    }
  }

  if (
    detail &&
    typeof detail === "object" &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  if (typeof anyErr?.message === "string" && anyErr.message.trim()) {
    return anyErr.message;
  }

  return fallback;
};

export default function FindStations() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<UserStation[]>([]);
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("all");
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
  const [stationReviews, setStationReviews] = useState<StationReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchStations = async (
    isInitialLoad = false,
    options?: { location?: Coordinates | null; filter?: DistanceFilter },
  ) => {
    try {
      if (isInitialLoad) setLoading(true);

      const activeLocation = options?.location ?? userLocation;
      const activeFilter = options?.filter ?? distanceFilter;
      const params = activeLocation
        ? {
            user_latitude: activeLocation.latitude,
            user_longitude: activeLocation.longitude,
            radius_km: activeFilter === "all" ? undefined : activeFilter,
          }
        : undefined;

      const data = await getUserStations(params);
      if (!Array.isArray(data)) {
        setStations([]);
        setError("Unexpected station response from server.");
        return [];
      }

      setStations(data);
      setError(null);
      return data;
    } catch (err: unknown) {
      setError(
        toErrorMessage(err, "Failed to load stations. Please try again."),
      );
      return null;
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStations(true, {
      location: userLocation,
      filter: distanceFilter,
    });
    const intervalId = window.setInterval(() => {
      void fetchStations(false, {
        location: userLocation,
        filter: distanceFilter,
      });
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [userLocation, distanceFilter]);

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
    return () => window.clearInterval(walletInterval);
  }, []);

  const loadStationReviews = async (stationId: number) => {
    try {
      setReviewsLoading(true);
      const reviews = await getStationReviews(stationId);
      setStationReviews(reviews);
    } catch {
      setStationReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStation) {
      setStationReviews([]);
      return;
    }
    setReviewRating(selectedStation.my_rating ?? 0);
    setReviewText("");
    void loadStationReviews(selectedStation.station_id);
  }, [selectedStation]);

  const submitReview = async () => {
    if (!selectedStation) return;
    if (reviewRating < 1 || reviewRating > 5) {
      const message = "Please select a rating between 1 and 5 stars.";
      setError(message);
      toast.error(message);
      return;
    }
    try {
      setSubmittingReview(true);
      setError(null);
      await upsertStationReview(selectedStation.station_id, {
        rating: reviewRating,
        review_text: reviewText.trim() || undefined,
      });
      const refreshedStations = await fetchStations(false);
      const nextStations = refreshedStations ?? stations;
      const refreshedSelected = nextStations.find(
        (s) => s.station_id === selectedStation.station_id,
      );
      if (refreshedSelected) setSelectedStation(refreshedSelected);
      await loadStationReviews(selectedStation.station_id);
      toast.success("Review submitted successfully.");
    } catch (err: any) {
      const message = err?.response?.data?.detail || "Failed to submit review.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const requestUserLocation = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        () =>
          reject(
            new Error(
              "Unable to access your location. Please allow location permission.",
            ),
          ),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  };

  const ensureUserLocation = async (): Promise<Coordinates> => {
    if (userLocation) {
      return userLocation;
    }

    try {
      setError(null);
      setLocationStatus("loading");
      const currentLocation = await requestUserLocation();
      setUserLocation(currentLocation);
      setLocationStatus("ready");
      return currentLocation;
    } catch {
      setLocationStatus("blocked");
      throw new Error(
        "Location access denied. Enable location to see distance.",
      );
    }
  };

  const handleAskLocation = () => {
    const agreed = window.confirm(
      "Allow location access to show station distance from your current location?",
    );
    if (!agreed) return;

    void (async () => {
      try {
        await ensureUserLocation();
      } catch (locationError: unknown) {
        const message = toErrorMessage(
          locationError,
          "Unable to get your location.",
        );
        setError(message);
        toast.error(message);
      }
    })();
  };

  const handleDistanceFilterChange = (nextFilterRaw: unknown) => {
    const nextFilter = normalizeDistanceFilter(nextFilterRaw);

    if (nextFilter === "all") {
      setDistanceFilter("all");
      return;
    }

    void (async () => {
      try {
        if (!userLocation) {
          const agreed = window.confirm(
            "Allow location access to filter stations by distance and show exact distance?",
          );
          if (!agreed) {
            return;
          }
        }

        await ensureUserLocation();
        setDistanceFilter(nextFilter);
      } catch (locationError: unknown) {
        const message = toErrorMessage(
          locationError,
          "Unable to get your location.",
        );
        setError(message);
        toast.error(message);
      }
    })();
  };

  const stationDistances = useMemo(() => {
    const withDistance = stations
      .map((station) => {
        if (typeof station.distance_km === "number") {
          return [station.station_id, station.distance_km] as const;
        }

        if (userLocation) {
          return [
            station.station_id,
            getDistanceInKm(userLocation, {
              latitude: station.latitude,
              longitude: station.longitude,
            }),
          ] as const;
        }

        return null;
      })
      .filter((item): item is readonly [number, number] => item !== null);

    return new Map<number, number>(withDistance);
  }, [stations, userLocation]);

  const sortedStations = useMemo(() => {
    let filtered = stations;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = stations.filter(
        (s) =>
          s.station_name.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query),
      );
    }
    if (!userLocation) return filtered;
    return [...filtered].sort((a, b) => {
      const dA = stationDistances.get(a.station_id) ?? Number.MAX_VALUE;
      const dB = stationDistances.get(b.station_id) ?? Number.MAX_VALUE;
      return dA - dB;
    });
  }, [stations, stationDistances, userLocation, searchQuery]);

  const openDirections = async (station: UserStation) => {
    try {
      setError(null);
      setDirectionLoadingStationId(station.station_id);
      const currentLocation = await ensureUserLocation();
      const destination = `${station.latitude},${station.longitude}`;
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (locationError: unknown) {
      setLocationStatus("blocked");
      const message = toErrorMessage(
        locationError,
        "Unable to get your location.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setDirectionLoadingStationId(null);
    }
  };

  const availableCount = stations.filter(
    (s) => s.available_connectors > 0,
  ).length;
  const busyCount = stations.filter((s) => s.available_connectors === 0).length;

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Top nav bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">
              EV Network
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/user/wallet")}
              className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:inline-flex"
            >
              <Wallet size={13} />
              Rs {walletBalance === null ? "—" : walletBalance.toFixed(2)}
            </button>
            <button
              type="button"
              onClick={() => navigate("/user/profile")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <CircleUserRound size={13} />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Page heading + stats */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Charging Stations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Find, compare, and navigate to nearby EV charging stations.
          </p>

          {!loading && stations.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <Signal size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">
                  {stations.length} stations
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">
                  {availableCount} available
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-xs font-semibold text-gray-600">
                  {busyCount} busy
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/user/wallet")}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus size={13} strokeWidth={2.5} />
                Manage Wallet
              </button>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="mb-6 relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name or address…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
            >
              <X size={10} />
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Distance
          </span>
          {(
            [
              { label: "All", value: "all" },
              { label: "Within 5 km", value: 5 },
              { label: "Within 10 km", value: 10 },
            ] as const
          ).map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleDistanceFilterChange(item.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                distanceFilter === item.value
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
          {locationStatus === "ready" && (
            <span className="text-xs text-gray-500">Location active</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="shrink-0">⚠</span>
            <p className="m-0 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="shrink-0 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {!loading && sortedStations.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Zap size={22} />
              </div>
              <p className="mb-1 text-sm font-semibold text-gray-700">
                {searchQuery ? "No results found" : "No stations available"}
              </p>
              <p className="max-w-xs text-sm text-gray-400">
                {searchQuery
                  ? `No stations match "${searchQuery}".`
                  : "Check back soon."}
              </p>
            </div>
          )}

          {!loading &&
            sortedStations.map((station) => {
              const distance = stationDistances.get(station.station_id);
              const isAvailable = station.available_connectors > 0;
              const plugTypes = (station.charger_types ?? []).filter((p) =>
                Boolean(p?.trim()),
              );
              const amenities = buildAmenities(station);
              const hasValidCoordinates =
                Number.isFinite(station.latitude) &&
                Number.isFinite(station.longitude);
              const mapKey = `${station.station_id}-${station.latitude}-${station.longitude}`;

              return (
                <article
                  key={station.station_id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Map */}
                  <div
                    key={`map-shell-${mapKey}`}
                    className="relative h-36 shrink-0 border-b border-gray-100"
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
                      <div className="flex h-full w-full items-center justify-center bg-gray-50 text-xs text-gray-400">
                        Map unavailable
                      </div>
                    )}
                    {/* Availability pill overlaid on map */}
                    <span
                      className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${isAvailable ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-200"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-white" : "bg-gray-400"}`}
                      />
                      {isAvailable ? "Available" : "Busy"}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-4">
                    {/* Station name + address */}
                    <div className="mb-3">
                      <h2 className="truncate text-sm font-bold text-gray-900">
                        {station.station_name}
                      </h2>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                        <MapPin size={11} className="shrink-0 text-gray-400" />
                        {station.address}
                      </p>
                    </div>

                    {/* Meta row: rating · distance · connectors */}
                    <div className="mb-3 flex items-center gap-3 border-b border-gray-100 pb-3 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                        <Star
                          size={11}
                          className="fill-amber-400 text-amber-400"
                        />
                        {station.review_count > 0
                          ? station.average_rating.toFixed(1)
                          : "New"}
                        <span className="font-normal text-gray-400">
                          ({station.review_count})
                        </span>
                      </span>

                      <span className="flex items-center gap-1 text-gray-500">
                        <Navigation size={11} className="text-gray-400" />
                        {typeof distance === "number" ? (
                          <span className="font-medium text-gray-700">
                            {distance.toFixed(1)} km
                          </span>
                        ) : locationStatus === "loading" ? (
                          <span className="text-gray-400">Locating…</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleAskLocation}
                            className="font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
                          >
                            Show distance
                          </button>
                        )}
                      </span>

                      <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-semibold text-gray-700">
                        <Plug size={10} className="text-emerald-600" />
                        {station.available_connectors}/
                        {station.total_connectors}
                      </span>
                    </div>

                    {/* Plug types */}
                    {plugTypes.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {plugTypes.map((p) => (
                          <PlugTypeBadge
                            key={`${station.station_id}-${p}`}
                            plugType={p}
                          />
                        ))}
                      </div>
                    )}

                    {/* Amenities */}
                    {amenities.some((a) => a.enabled) && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {amenities
                          .filter((a) => a.enabled)
                          .map((amenity) => {
                            const Icon = amenity.icon;
                            return (
                              <span
                                key={amenity.key}
                                title={amenity.label}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-600"
                              >
                                <Icon size={11} />
                                {amenity.label}
                              </span>
                            );
                          })}
                      </div>
                    )}

                    {/* Phone */}
                    {station.phone_number && (
                      <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone size={11} className="text-gray-400" />
                        {station.phone_number}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void openDirections(station)}
                        disabled={
                          directionLoadingStationId === station.station_id
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Navigation size={13} />
                        {directionLoadingStationId === station.station_id
                          ? "Getting location…"
                          : "Get Directions"}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStation(station)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                        >
                          <Eye size={12} />
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/user/stations/${station.station_id}/availability`,
                            )
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                        >
                          <Plug size={12} />
                          Chargers
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={selectedStation !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedStation(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-xl p-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          {selectedStation && (
            <>
              <DialogHeader className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div>
                    <DialogTitle className="text-base font-bold text-gray-900">
                      {selectedStation.station_name}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} />
                      {selectedStation.address}
                    </DialogDescription>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${selectedStation.available_connectors > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${selectedStation.available_connectors > 0 ? "bg-emerald-500" : "bg-gray-400"}`}
                    />
                    {selectedStation.available_connectors > 0
                      ? "Available"
                      : "Busy"}
                  </span>
                </div>
                <DialogClose className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-600">
                  <X size={14} />
                </DialogClose>
              </DialogHeader>

              <ScrollArea className="h-[72vh]">
                <div className="space-y-4 p-5">
                  {/* Station info */}
                  <section className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      Station Info
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-gray-500">
                          Total Chargers
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">
                          {selectedStation.total_chargers}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">Contact</p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">
                          {selectedStation.phone_number || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[11px] text-gray-500">Description</p>
                        <p className="mt-0.5 text-sm text-gray-700 leading-relaxed">
                          {selectedStation.station_description ||
                            "No description available."}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Plug types */}
                  <section className="rounded-lg border border-gray-100 bg-white p-4">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      Plug Types
                    </h3>
                    {(selectedStation.charger_types ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(selectedStation.charger_types ?? []).map((p) => (
                          <PlugTypeBadge
                            key={`${selectedStation.station_id}-${p}`}
                            plugType={p}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Not specified.</p>
                    )}
                  </section>

                  {/* Amenities */}
                  <section className="rounded-lg border border-gray-100 bg-white p-4">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      Amenities
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {buildAmenities(selectedStation).map((amenity) => {
                        const Icon = amenity.icon;
                        return (
                          <div
                            key={amenity.key}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${amenity.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-100 bg-gray-50 text-gray-400"}`}
                          >
                            <Icon size={12} />
                            {amenity.label}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Rating summary */}
                  <section className="rounded-lg border border-gray-100 bg-white p-4">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      Ratings & Reviews
                    </h3>

                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {selectedStation.review_count > 0
                            ? selectedStation.average_rating.toFixed(1)
                            : "—"}
                        </span>
                        <Star
                          size={16}
                          className="mb-0.5 fill-amber-400 text-amber-400"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedStation.review_count} review
                        {selectedStation.review_count === 1 ? "" : "s"}
                      </div>
                    </div>

                    {/* Write review */}
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-gray-700">
                        Rate this station
                      </p>
                      <div className="mb-3 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReviewRating(value)}
                            className="rounded p-1 transition hover:bg-amber-50"
                            aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                          >
                            <Star
                              size={20}
                              className={
                                value <= reviewRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }
                            />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <button
                            type="button"
                            onClick={() => setReviewRating(0)}
                            className="ml-1 text-xs text-gray-400 hover:text-gray-600"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder="Share your experience (optional)…"
                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-gray-400">
                          {selectedStation.my_rating
                            ? `Your last rating: ${selectedStation.my_rating}/5`
                            : "Not reviewed yet"}
                        </p>
                        <button
                          type="button"
                          onClick={() => void submitReview()}
                          disabled={submittingReview || reviewRating === 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <MessageSquare size={12} />
                          {submittingReview ? "Submitting…" : "Submit"}
                        </button>
                      </div>
                    </div>

                    {/* Review list */}
                    <div className="mt-4">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Recent reviews
                      </p>
                      {reviewsLoading ? (
                        <p className="text-xs text-gray-400">Loading…</p>
                      ) : stationReviews.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          No reviews yet. Be the first!
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stationReviews.slice(0, 5).map((review) => (
                            <div
                              key={review.review_id}
                              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-gray-700">
                                  {review.user_name || "User"}
                                </p>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                                  <Star
                                    size={11}
                                    className="fill-amber-400 text-amber-400"
                                  />
                                  {review.rating}/5
                                </span>
                              </div>
                              {review.review_text && (
                                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                                  {review.review_text}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Images */}
                  {selectedStation.station_images.length > 0 && (
                    <section className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                          Photos
                        </h3>
                      </div>
                      <div className="grid gap-2 p-3 sm:grid-cols-2">
                        {selectedStation.station_images.map(
                          (imageUrl, index) => (
                            <div
                              key={imageUrl}
                              className={`overflow-hidden rounded-lg bg-gray-100 ${index === 0 && selectedStation.station_images.length > 1 ? "sm:col-span-2 h-48" : "h-32"}`}
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
                    </section>
                  )}

                  {/* Navigate CTA inside dialog */}
                  <button
                    type="button"
                    onClick={() => {
                      void openDirections(selectedStation);
                      setSelectedStation(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Navigation size={15} />
                    Navigate to Station
                    <ChevronRight size={15} />
                  </button>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
