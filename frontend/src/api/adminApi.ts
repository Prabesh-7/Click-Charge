import api from "./axiosInstance";
import { type CreateManagerStationSchema} from "@/lib/schema/CreateManagerStationSchema";


export const createManagerStation = async (data: CreateManagerStationSchema) => {
  const response = await api.post("/admin/create-manager-station", data);


  
  return response.data;
};