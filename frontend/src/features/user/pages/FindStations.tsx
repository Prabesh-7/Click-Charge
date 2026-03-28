import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
} from "react-leaflet";
import { MapPin, Navigation, Phone, Plug } from "lucide-react";
import { getUserStations, type UserStation } from "@/api/userApi";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";

type Coordinates = {
  latitude: number;
  longitude: number;
};

const defaultCenter: [number, number] = [27.7172, 85.324];

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

export default function FindStations() {
  const [stations, setStations] = useState<UserStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<UserStation | null>(
    null,
  );
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [directionLoadingStationId, setDirectionLoadingStationId] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const data = await getUserStations();
        setStations(data);
        setSelectedStation(data[0] || null);
      } catch (err: any) {
        console.error(
          "Failed to load stations:",
          err.response?.data || err.message,
        );
        setError(
          err.response?.data?.detail ||
            "Failed to load stations. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
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
        },
      );
    });
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
    if (!userLocation) {
      return stations;
    }

    return [...stations].sort((a, b) => {
      const distanceA = stationDistances.get(a.station_id) ?? Number.MAX_VALUE;
      const distanceB = stationDistances.get(b.station_id) ?? Number.MAX_VALUE;
      return distanceA - distanceB;
    });
  }, [stations, stationDistances, userLocation]);

  const mapCenter: [number, number] = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (selectedStation) {
      return [selectedStation.latitude, selectedStation.longitude];
    }
    if (stations.length > 0) {
      return [stations[0].latitude, stations[0].longitude];
    }

    return defaultCenter;
  }, [userLocation, selectedStation, stations]);

  const openDirections = async (station: UserStation) => {
    try {
      setError(null);
      setDirectionLoadingStationId(station.station_id);

      // Ask for location only when user explicitly requests directions.
      const currentLocation = await requestUserLocation();
      setUserLocation(currentLocation);

      const destination = `${station.latitude},${station.longitude}`;
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;

      const directionUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

      window.open(directionUrl, "_blank", "noopener,noreferrer");
    } catch (locationError: any) {
      setError(locationError?.message || "Unable to get your location.");
    } finally {
      setDirectionLoadingStationId(null);
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Find Stations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse available charging stations and get map-based directions.
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading stations...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-2 space-y-3 max-h-[72vh] overflow-auto pr-1">
            {sortedStations.length === 0 && (
              <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
                <p className="text-sm text-gray-500">
                  No stations available right now.
                </p>
              </div>
            )}

            {sortedStations.map((station) => {
              const distance = stationDistances.get(station.station_id);
              const isSelected =
                selectedStation?.station_id === station.station_id;

              return (
                <button
                  type="button"
                  key={station.station_id}
                  onClick={() => setSelectedStation(station)}
                  className={`w-full text-left bg-white border rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md ${
                    isSelected ? "border-blue-500" : "border-[#B6B6B6]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {station.station_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {station.address}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        station.available_chargers > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {station.available_chargers > 0 ? "Available" : "Busy"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <p>
                      Chargers: {station.available_chargers}/
                      {station.total_chargers} available
                    </p>
                    <p>
                      Plugs:{" "}
                      {station.charger_types.length > 0
                        ? station.charger_types.join(", ")
                        : "N/A"}
                    </p>
                    {typeof distance === "number" && (
                      <p className="font-medium text-blue-700">
                        Distance: {distance.toFixed(2)} km
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="xl:col-span-3 bg-white border border-[#B6B6B6] rounded-lg p-3 shadow-sm">
            <div className="h-[46vh] md:h-[52vh] rounded-md overflow-hidden border border-gray-200">
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation && (
                  <CircleMarker
                    center={[userLocation.latitude, userLocation.longitude]}
                    radius={10}
                    pathOptions={{
                      color: "#2563eb",
                      fillColor: "#3b82f6",
                      fillOpacity: 0.7,
                    }}
                  >
                    <Popup>Your current location</Popup>
                  </CircleMarker>
                )}

                {stations.map((station) => (
                  <CircleMarker
                    key={station.station_id}
                    center={[station.latitude, station.longitude]}
                    radius={
                      selectedStation?.station_id === station.station_id
                        ? 10
                        : 8
                    }
                    eventHandlers={{
                      click: () => setSelectedStation(station),
                    }}
                    pathOptions={{
                      color:
                        station.available_chargers > 0 ? "#16a34a" : "#6b7280",
                      fillColor:
                        station.available_chargers > 0 ? "#22c55e" : "#9ca3af",
                      fillOpacity: 0.7,
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{station.station_name}</p>
                        <p>{station.address}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

                {userLocation && selectedStation && (
                  <Polyline
                    positions={[
                      [userLocation.latitude, userLocation.longitude],
                      [selectedStation.latitude, selectedStation.longitude],
                    ]}
                    pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.75 }}
                  />
                )}
              </MapContainer>
            </div>

            {selectedStation && (
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedStation.station_name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <MapPin size={14} />
                      {selectedStation.address}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => void openDirections(selectedStation)}
                    disabled={
                      directionLoadingStationId === selectedStation.station_id
                    }
                    className="h-10 bg-green-600 hover:bg-green-700"
                  >
                    <Navigation size={16} className="mr-2" />
                    {directionLoadingStationId === selectedStation.station_id
                      ? "Getting Location..."
                      : "Get Direction"}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 flex items-center gap-2">
                    <Phone size={15} />
                    <span>
                      {selectedStation.phone_number || "Phone not available"}
                    </span>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 flex items-center gap-2">
                    <Plug size={15} />
                    <span>
                      {selectedStation.charger_types.length > 0
                        ? selectedStation.charger_types.join(", ")
                        : "Plug types not available"}
                    </span>
                  </div>
                </div>

                {typeof stationDistances.get(selectedStation.station_id) ===
                  "number" && (
                  <p className="mt-3 text-sm font-medium text-blue-700">
                    Distance from your location:{" "}
                    {stationDistances
                      .get(selectedStation.station_id)
                      ?.toFixed(2)}{" "}
                    km
                  </p>
                )}

                <p className="mt-3 text-sm text-gray-700">
                  {selectedStation.station_description ||
                    "No station description available."}
                </p>

                {selectedStation.station_images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedStation.station_images.map((imageUrl) => (
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={selectedStation.station_name}
                        className="w-full h-28 object-cover rounded-md border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
