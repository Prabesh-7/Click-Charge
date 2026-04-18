// import { useEffect, useState, type ChangeEvent } from "react";
// import {
//   getMyChargers,
//   getMyStation,
//   updateMyStation,
//   uploadStationImage,
//   type ManagerCharger,
//   type ManagerStation,
// } from "@/api/managerApi";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Phone, Plug, MapPin, FileText } from "lucide-react";

// type StationFormState = {
//   station_description: string;
//   phone_number: string;
//   has_wifi: boolean;
//   has_parking: boolean;
//   has_food: boolean;
//   has_coffee: boolean;
//   has_bedroom: boolean;
//   has_restroom: boolean;
//   station_images: string[];
// };

// const emptyFormState: StationFormState = {
//   station_description: "",
//   phone_number: "",
//   has_wifi: false,
//   has_parking: false,
//   has_food: false,
//   has_coffee: false,
//   has_bedroom: false,
//   has_restroom: false,
//   station_images: [],
// };

// export default function StationDetails() {
//   const [station, setStation] = useState<ManagerStation | null>(null);
//   const [chargers, setChargers] = useState<ManagerCharger[]>([]);
//   const [showDetails, setShowDetails] = useState(false);
//   const [form, setForm] = useState<StationFormState>(emptyFormState);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   const hydrateForm = (data: ManagerStation) => {
//     setForm({
//       station_description: data.station_description || "",
//       phone_number: data.phone_number || "",
//       has_wifi: data.has_wifi,
//       has_parking: data.has_parking,
//       has_food: data.has_food,
//       has_coffee: data.has_coffee,
//       has_bedroom: data.has_bedroom,
//       has_restroom: data.has_restroom,
//       station_images: data.station_images || [],
//     });
//   };

//   useEffect(() => {
//     const fetchStation = async () => {
//       try {
//         setLoading(true);
//         const [stationData, chargerData] = await Promise.all([
//           getMyStation(),
//           getMyChargers(),
//         ]);
//         setStation(stationData);
//         setChargers(chargerData);
//         hydrateForm(stationData);
//         setError(null);
//       } catch (err: any) {
//         console.error(
//           "Failed to load station details:",
//           err.response?.data || err.message,
//         );
//         setError(
//           err.response?.data?.detail ||
//             "Failed to load station details. Please try again.",
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStation();
//   }, []);

//   const handleAmenityChange = (
//     key: keyof StationFormState,
//     checked: boolean,
//   ) => {
//     setForm((prev) => ({
//       ...prev,
//       [key]: checked,
//     }));
//   };

//   const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) {
//       return;
//     }

//     try {
//       setUploading(true);
//       setError(null);
//       const uploaded = await uploadStationImage(file);
//       setForm((prev) => ({
//         ...prev,
//         station_images: [...prev.station_images, uploaded.image_url],
//       }));
//       setSuccessMessage("Image uploaded successfully.");
//     } catch (err: any) {
//       console.error(
//         "Failed to upload station image:",
//         err.response?.data || err.message,
//       );
//       setError(
//         err.response?.data?.detail ||
//           "Failed to upload image. Please try again.",
//       );
//     } finally {
//       setUploading(false);
//       event.target.value = "";
//     }
//   };

//   const removeImage = (imageUrl: string) => {
//     setForm((prev) => ({
//       ...prev,
//       station_images: prev.station_images.filter((url) => url !== imageUrl),
//     }));
//   };

//   const handleSaveDetails = async () => {
//     try {
//       setSaving(true);
//       setError(null);
//       setSuccessMessage(null);

//       const updated = await updateMyStation({
//         station_description: form.station_description || undefined,
//         phone_number: form.phone_number || undefined,
//         has_wifi: form.has_wifi,
//         has_parking: form.has_parking,
//         has_food: form.has_food,
//         has_coffee: form.has_coffee,
//         has_bedroom: form.has_bedroom,
//         has_restroom: form.has_restroom,
//         station_images: form.station_images,
//       });

//       setStation(updated);
//       hydrateForm(updated);
//       setSuccessMessage("Station details updated successfully.");
//     } catch (err: any) {
//       console.error(
//         "Failed to update station details:",
//         err.response?.data || err.message,
//       );
//       setError(
//         err.response?.data?.detail ||
//           "Failed to update station details. Please try again.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const amenityItems: Array<{ key: keyof StationFormState; label: string }> = [
//     { key: "has_wifi", label: "WiFi" },
//     { key: "has_parking", label: "Parking" },
//     { key: "has_food", label: "Food" },
//     { key: "has_coffee", label: "Coffee" },
//     { key: "has_bedroom", label: "Bedroom" },
//     { key: "has_restroom", label: "Restroom" },
//   ];

//   const chargerTypes = Array.from(
//     new Set(chargers.map((charger) => charger.type)),
//   );

//   return (
//     <main className="p-6">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Station Details</h1>
//         <p className="text-sm text-gray-500 mt-1">
//           View your station information.
//         </p>
//       </div>

//       {loading && (
//         <div className="text-center py-8">
//           <p className="text-gray-500">Loading station details...</p>
//         </div>
//       )}

//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
//           <p>{error}</p>
//         </div>
//       )}

//       {successMessage && (
//         <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
//           <p>{successMessage}</p>
//         </div>
//       )}

//       {!loading && !error && station && (
//         <div className="space-y-4">
//           <div className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
//             <div className="mb-4 flex items-start justify-between gap-4">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   {station.station_name}
//                 </h3>
//                 <p className="text-sm text-gray-600">{station.address}</p>
//               </div>

//               <Button
//                 type="button"
//                 onClick={() => setShowDetails((prev) => !prev)}
//                 className="h-10 bg-blue-600 hover:bg-blue-700"
//               >
//                 {showDetails ? "Hide Details" : "Get Details"}
//               </Button>
//             </div>

//             {showDetails && (
//               <>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
//                   <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
//                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
//                       <Phone size={16} />
//                       <span>Phone</span>
//                     </div>
//                     <p className="text-sm font-medium text-gray-900">
//                       {station.phone_number || "Not set"}
//                     </p>
//                   </div>

//                   <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
//                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
//                       <Plug size={16} />
//                       <span>Plug Types</span>
//                     </div>
//                     <p className="text-sm font-medium text-gray-900">
//                       {chargerTypes.length > 0
//                         ? chargerTypes.join(", ")
//                         : "No chargers added yet"}
//                     </p>
//                   </div>

//                   <div className="border border-gray-200 rounded-md p-3 bg-gray-50 md:col-span-2">
//                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
//                       <FileText size={16} />
//                       <span>Description</span>
//                     </div>
//                     <p className="text-sm font-medium text-gray-900">
//                       {station.station_description ||
//                         "No station description added."}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-500">Station ID:</span>
//                     <span className="text-gray-900 font-medium">
//                       #{station.station_id}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-500">Total Chargers:</span>
//                     <span className="text-gray-900 font-medium">
//                       {station.total_charger}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-500">Manager ID:</span>
//                     <span className="text-gray-900 font-medium">
//                       {station.manager_id
//                         ? `#${station.manager_id}`
//                         : "Not assigned"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-500">Location:</span>
//                     <span className="text-gray-900 font-medium text-xs flex items-center gap-1">
//                       <MapPin size={14} />
//                       {station.latitude.toFixed(4)},{" "}
//                       {station.longitude.toFixed(4)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-500">Created:</span>
//                     <span className="text-gray-900 font-medium text-xs">
//                       {new Date(station.created_at).toLocaleDateString()}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="mt-5">
//                   <p className="text-sm font-medium text-gray-700 mb-3">
//                     Amenities
//                   </p>
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
//                     <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
//                       WiFi: {station.has_wifi ? "Yes" : "No"}
//                     </div>
//                     <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
//                       Parking: {station.has_parking ? "Yes" : "No"}
//                     </div>
//                     <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
//                       Food: {station.has_food ? "Yes" : "No"}
//                     </div>
//                     <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
//                       Coffee: {station.has_coffee ? "Yes" : "No"}
//                     </div>
//                     <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
//                       Bedroom: {station.has_bedroom ? "Yes" : "No"}
//                     </div>
//                     <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
//                       Restroom: {station.has_restroom ? "Yes" : "No"}
//                     </div>
//                   </div>
//                 </div>

//                 {station.station_images.length > 0 && (
//                   <div className="mt-5">
//                     <p className="text-sm font-medium text-gray-700 mb-3">
//                       Station Images
//                     </p>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//                       {station.station_images.map((imageUrl) => (
//                         <div
//                           key={imageUrl}
//                           className="border border-gray-200 rounded-md p-2"
//                         >
//                           <img
//                             src={imageUrl}
//                             alt="Station"
//                             className="w-full h-36 object-cover rounded"
//                           />
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>

//           <div className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Additional Information
//               </h3>
//               <p className="text-sm text-gray-500 mt-1">
//                 Add your station contact, amenities, and photos.
//               </p>
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium text-gray-700">
//                 Station Description
//               </label>
//               <textarea
//                 value={form.station_description}
//                 onChange={(event) =>
//                   setForm((prev) => ({
//                     ...prev,
//                     station_description: event.target.value,
//                   }))
//                 }
//                 placeholder="Describe station highlights, operation hours, and service notes."
//                 className="min-h-24 w-full rounded-md border border-[#B6B6B6] px-3 py-2 text-sm text-gray-900 focus:outline-none"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium text-gray-700">
//                 Phone Number
//               </label>
//               <Input
//                 value={form.phone_number}
//                 onChange={(event) =>
//                   setForm((prev) => ({
//                     ...prev,
//                     phone_number: event.target.value,
//                   }))
//                 }
//                 placeholder="e.g. +977-9800000000"
//                 className="h-10 border border-[#B6B6B6]"
//               />
//             </div>

//             <div>
//               <p className="text-sm font-medium text-gray-700 mb-3">
//                 Amenities
//               </p>
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                 {amenityItems.map((item) => (
//                   <label
//                     key={item.key}
//                     className="flex items-center gap-2 text-sm text-gray-700"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={Boolean(form[item.key])}
//                       onChange={(event) =>
//                         handleAmenityChange(item.key, event.target.checked)
//                       }
//                     />
//                     {item.label}
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <div className="space-y-3">
//               <p className="text-sm font-medium text-gray-700">
//                 Station Images
//               </p>
//               <input
//                 type="file"
//                 accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
//                 onChange={handleImageUpload}
//                 disabled={uploading}
//                 className="block w-full text-sm text-gray-700"
//               />
//               {uploading && (
//                 <p className="text-sm text-gray-500">Uploading image...</p>
//               )}

//               {form.station_images.length > 0 && (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//                   {form.station_images.map((imageUrl) => (
//                     <div
//                       key={imageUrl}
//                       className="border border-gray-200 rounded-md p-2"
//                     >
//                       <img
//                         src={imageUrl}
//                         alt="Station"
//                         className="w-full h-36 object-cover rounded"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => removeImage(imageUrl)}
//                         className="text-xs text-red-600 mt-2 hover:underline"
//                       >
//                         Remove
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="pt-2">
//               <Button
//                 type="button"
//                 onClick={handleSaveDetails}
//                 disabled={saving || uploading}
//                 className="h-11 bg-green-500 hover:bg-green-600"
//               >
//                 {saving ? "Saving..." : "Save Details"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

import { useEffect, useState, type ChangeEvent } from "react";
import {
  getMyChargers,
  getMyStation,
  updateMyStation,
  uploadStationImage,
  type ManagerCharger,
  type ManagerStation,
} from "@/api/managerApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  Plug,
  MapPin,
  FileText,
  Wifi,
  Car,
  UtensilsCrossed,
  Coffee,
  BedDouble,
  Bath,
  Hash,
  CalendarDays,
  UserCircle,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
  Save,
  Zap,
  Signal,
} from "lucide-react";
import { toast } from "sonner";

type StationFormState = {
  station_description: string;
  phone_number: string;
  has_wifi: boolean;
  has_parking: boolean;
  has_food: boolean;
  has_coffee: boolean;
  has_bedroom: boolean;
  has_restroom: boolean;
  station_images: string[];
};

const emptyFormState: StationFormState = {
  station_description: "",
  phone_number: "",
  has_wifi: false,
  has_parking: false,
  has_food: false,
  has_coffee: false,
  has_bedroom: false,
  has_restroom: false,
  station_images: [],
};

const AMENITY_META: Array<{
  key: keyof StationFormState;
  label: string;
  icon: typeof Wifi;
}> = [
  { key: "has_wifi", label: "WiFi", icon: Wifi },
  { key: "has_parking", label: "Parking", icon: Car },
  { key: "has_food", label: "Food", icon: UtensilsCrossed },
  { key: "has_coffee", label: "Coffee", icon: Coffee },
  { key: "has_bedroom", label: "Bedroom", icon: BedDouble },
  { key: "has_restroom", label: "Restroom", icon: Bath },
];

export default function StationDetails() {
  const [station, setStation] = useState<ManagerStation | null>(null);
  const [chargers, setChargers] = useState<ManagerCharger[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState<StationFormState>(emptyFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hydrateForm = (data: ManagerStation) => {
    setForm({
      station_description: data.station_description || "",
      phone_number: data.phone_number || "",
      has_wifi: data.has_wifi,
      has_parking: data.has_parking,
      has_food: data.has_food,
      has_coffee: data.has_coffee,
      has_bedroom: data.has_bedroom,
      has_restroom: data.has_restroom,
      station_images: data.station_images || [],
    });
  };

  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const [stationData, chargerData] = await Promise.all([
          getMyStation(),
          getMyChargers(),
        ]);
        setStation(stationData);
        setChargers(chargerData);
        hydrateForm(stationData);
        setError(null);
      } catch (err: any) {
        console.error(
          "Failed to load station details:",
          err.response?.data || err.message,
        );
        setError(
          err.response?.data?.detail ||
            "Failed to load station details. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, []);

  const handleAmenityChange = (
    key: keyof StationFormState,
    checked: boolean,
  ) => {
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const uploaded = await uploadStationImage(file);
      setForm((prev) => ({
        ...prev,
        station_images: [...prev.station_images, uploaded.image_url],
      }));
      const message = "Image uploaded successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err: any) {
      console.error(
        "Failed to upload station image:",
        err.response?.data || err.message,
      );
      const message =
        err.response?.data?.detail ||
        "Failed to upload image. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      station_images: prev.station_images.filter((url) => url !== imageUrl),
    }));
  };

  const handleSaveDetails = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await updateMyStation({
        station_description: form.station_description || undefined,
        phone_number: form.phone_number || undefined,
        has_wifi: form.has_wifi,
        has_parking: form.has_parking,
        has_food: form.has_food,
        has_coffee: form.has_coffee,
        has_bedroom: form.has_bedroom,
        has_restroom: form.has_restroom,
        station_images: form.station_images,
      });

      setStation(updated);
      hydrateForm(updated);
      const message = "Station details updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err: any) {
      console.error(
        "Failed to update station details:",
        err.response?.data || err.message,
      );
      const message =
        err.response?.data?.detail ||
        "Failed to update station details. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const chargerTypes = Array.from(
    new Set(chargers.map((charger) => charger.type)),
  );

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Top header bar — mirrors FindStations */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">
              Station Manager
            </span>
            {!loading && station && (
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </div>

          {!loading && station && (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 sm:inline-flex">
                <Signal size={13} className="text-gray-400" />
                {station.total_charger} charger
                {station.total_charger === 1 ? "" : "s"}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                <Hash size={13} className="text-gray-400" />
                <span className="hidden sm:inline">Station</span> #
                {station.station_id}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Station Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View station information and manage amenities, contact, and photos.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="shrink-0">⚠</span>
            <p className="m-0 flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span className="shrink-0">✓</span>
            <p className="m-0 flex-1">{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="shrink-0 text-emerald-400 hover:text-emerald-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-gray-100 bg-white"
              />
            ))}
            <div className="col-span-full h-64 animate-pulse rounded-xl border border-gray-100 bg-white" />
          </div>
        )}

        {!loading && !error && station && (
          <div className="space-y-5">
            {/* ── Stat chips row ── */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <Hash size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">
                  ID #{station.station_id}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <Signal size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">
                  {station.total_charger} charger
                  {station.total_charger === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <CalendarDays size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">
                  Since {new Date(station.created_at).toLocaleDateString()}
                </span>
              </div>
              {station.manager_id && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <UserCircle size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-700">
                    Manager #{station.manager_id}
                  </span>
                </div>
              )}
            </div>

            {/* ── Station overview card ── */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-gray-900">
                    {station.station_name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={12} className="shrink-0 text-gray-400" />
                    {station.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp size={13} />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} />
                      Expand
                    </>
                  )}
                </button>
              </div>

              {showDetails && (
                <div className="divide-y divide-gray-100">
                  {/* Quick info grid */}
                  <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-3">
                    <div className="border-b border-gray-100 px-5 py-4 sm:border-b-0 sm:border-r">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        <Phone size={11} />
                        Phone
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {station.phone_number || (
                          <span className="font-normal text-gray-400">
                            Not set
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="border-b border-gray-100 px-5 py-4 sm:border-b-0 sm:border-r">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        <Plug size={11} />
                        Plug Types
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {chargerTypes.length > 0 ? (
                          chargerTypes.join(", ")
                        ) : (
                          <span className="font-normal text-gray-400">
                            No chargers added
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="px-5 py-4">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        <MapPin size={11} />
                        Coordinates
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-gray-900">
                        {station.latitude.toFixed(4)},{" "}
                        {station.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-5 py-4">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      <FileText size={11} />
                      Description
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {station.station_description || (
                        <span className="text-gray-400">
                          No description added.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Amenities read-only */}
                  <div className="px-5 py-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      Amenities
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                      {AMENITY_META.map(({ key, label, icon: Icon }) => {
                        const enabled = Boolean(
                          station[key as keyof ManagerStation],
                        );
                        return (
                          <div
                            key={key}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                              enabled
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-gray-100 bg-gray-50 text-gray-400"
                            }`}
                          >
                            <Icon size={12} />
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Station images read-only */}
                  {station.station_images.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Photos
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {station.station_images.map((imageUrl, index) => (
                          <div
                            key={imageUrl}
                            className={`overflow-hidden rounded-lg bg-gray-100 ${
                              index === 0 && station.station_images.length > 1
                                ? "col-span-2 h-44"
                                : "h-28"
                            }`}
                          >
                            <img
                              src={imageUrl}
                              alt={`Station photo ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Edit panel ── */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* Panel header */}
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-base font-bold text-gray-900">
                  Edit Station Info
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Update contact details, amenities, and photos.
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Description */}
                <div className="px-5 py-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Station Description
                  </label>
                  <textarea
                    value={form.station_description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        station_description: event.target.value,
                      }))
                    }
                    placeholder="Describe station highlights, operation hours, and service notes…"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Phone */}
                <div className="px-5 py-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Phone Number
                  </label>
                  <div className="relative max-w-sm">
                    <Phone
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      value={form.phone_number}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          phone_number: event.target.value,
                        }))
                      }
                      placeholder="+977-9800000000"
                      className="h-10 border-gray-200 bg-gray-50 pl-9 text-sm focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div className="px-5 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Amenities
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                    {AMENITY_META.map(({ key, label, icon: Icon }) => {
                      const checked = Boolean(form[key]);
                      return (
                        <label
                          key={key}
                          className={`flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                            checked
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              handleAmenityChange(key, event.target.checked)
                            }
                            className="sr-only"
                          />
                          <Icon size={12} />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Images */}
                <div className="px-5 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Station Photos
                  </p>

                  {/* Upload trigger */}
                  <label
                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm font-semibold transition ${
                      uploading
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        : "border-gray-300 bg-white text-gray-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <ImagePlus size={16} />
                    {uploading ? "Uploading…" : "Click to upload a photo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="sr-only"
                    />
                  </label>

                  {/* Image grid with remove */}
                  {form.station_images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {form.station_images.map((imageUrl, index) => (
                        <div
                          key={imageUrl}
                          className={`group relative overflow-hidden rounded-lg bg-gray-100 ${
                            index === 0 && form.station_images.length > 1
                              ? "col-span-2 h-44"
                              : "h-28"
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`Station photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(imageUrl)}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/60 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                            aria-label="Remove image"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save action */}
                <div className="flex items-center justify-between gap-4 bg-gray-50 px-5 py-4">
                  <p className="text-xs text-gray-400">
                    Changes will be visible to users immediately after saving.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    disabled={saving || uploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
