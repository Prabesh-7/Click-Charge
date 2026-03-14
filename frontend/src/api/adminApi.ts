import api from "./axiosInstance";
import { type CreateManagerStationSchema} from "@/lib/schema/CreateManagerStationSchema";

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