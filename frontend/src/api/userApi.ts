import api from "./axiosInstance";

export interface UserStationConnector {
  connector_id: number;
  connector_number: number;
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  current_transaction_id?: number | null;
  reserved_by_user_id?: number | null;
  reserved_at?: string | null;
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

export interface StationSlot {
  slot_id: number;
  connector_id: number;
  connector_number: number;
  charger_id: number;
  charger_name: string;
  charger_type: string;
  start_time: string;
  end_time: string;
  status: string;
  reserved_by_user_id: number | null;
  reserved_by_user_name: string | null;
  reserved_by_email: string | null;
  reserved_at: string | null;
  created_by_manager_id: number | null;
  created_at: string;
  updated_at: string;
}

export const getUserStations = async () => {
  const response = await api.get("/user/stations", {
    headers: authHeader(),
  });

  return response.data as UserStation[];
};

export const getStationSlots = async (stationId: number): Promise<StationSlot[]> => {
  const { data } = await api.get<StationSlot[]>(`/user/stations/${stationId}/slots`, {
    headers: authHeader(),
  });
  return data;
};

export const reserveSlot = async (slotId: number) => {
  const { data } = await api.post(
    `/user/slots/${slotId}/reserve`,
    {},
    {
      headers: authHeader(),
    }
  );
  return data;
};

export const cancelSlotReservation = async (slotId: number) => {
  const { data } = await api.post(
    `/user/slots/${slotId}/cancel`,
    {},
    {
      headers: authHeader(),
    }
  );
  return data;
};

export const reserveConnectorByUser = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/user/chargers/${chargerId}/reserve${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const cancelConnectorReservationByUser = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/user/chargers/${chargerId}/cancel-reservation${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};
