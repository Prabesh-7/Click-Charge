import api from "./axiosInstance";

export interface UserStation {
  station_id: number;
  station_name: string;
  address: string;
  longitude: number;
  latitude: number;
  station_description?: string | null;
  phone_number?: string | null;
  has_wifi: boolean;
  has_parking: boolean;
  has_food: boolean;
  has_coffee: boolean;
  has_bedroom: boolean;
  has_restroom: boolean;
  station_images: string[];
  total_chargers: number;
  available_chargers: number;
  charger_types: string[];
  created_at: string;
}

const authHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const getUserStations = async () => {
  const response = await api.get("/user/stations", {
    headers: authHeader(),
  });

  return response.data as UserStation[];
};
