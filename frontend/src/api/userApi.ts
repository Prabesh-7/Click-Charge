import api from "./axiosInstance";

export interface UserStationConnector {
  connector_id: number;
  connector_number: number;
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  current_transaction_id?: number | null;
}

export interface UserStationCharger {
  charger_id: number;
  name: string;
  type: string;
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  total_connectors: number;
  available_connectors: number;
  connectors: UserStationConnector[];
}

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
  total_connectors: number;
  available_connectors: number;
  charger_types: string[];
  chargers: UserStationCharger[];
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
