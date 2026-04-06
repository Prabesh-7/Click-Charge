import api from "./axiosInstance";
import { type CreateManagerStationSchema} from "@/lib/schema/CreateManagerStationSchema";
import { type StationUpdateSubmitValues } from "@/lib/schema/StationUpdateSchema";

const authHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const createManagerStation = async (data: CreateManagerStationSchema) => {
  const response = await api.post("/admin/create-manager-station", data);


  
  return response.data;
};



export const getStations = async () => {
  const response = await api.get(
    "/admin/stations",
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const updateStation = async (stationId: number, data: StationUpdateSubmitValues) => {
  const response = await api.put(
    `/admin/stations/${stationId}`,
    {
      station_name: data.station_name,
      address: data.address,
      longitude: data.longitude,
      latitude: data.latitude,
      total_charger: data.total_charger,
    },
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const deleteStation = async (stationId: number) => {
  const response = await api.delete(
    `/admin/stations/${stationId}`,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};