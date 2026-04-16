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
  average_rating: number;
  review_count: number;
  my_rating?: number | null;
  distance_km?: number | null;
  charger_types: string[];
  chargers: UserStationCharger[];
  created_at: string;
}

export interface GetUserStationsParams {
  radius_km?: 5 | 10;
  user_latitude?: number;
  user_longitude?: number;
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
  reserved_by_phone_number: string | null;
  reserved_at: string | null;
  created_by_manager_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: number;
  user_name: string;
  email: string;
  role: string;
  phone_number?: string | null;
  vehicle?: string | null;
  station_id?: number | null;
  created_at: string;
}

export interface UpdateUserProfilePayload {
  user_name?: string;
  email?: string;
  phone_number?: string | null;
  vehicle?: string | null;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>("/user/profile", {
    headers: authHeader(),
  });
  return data;
};

export const updateUserProfile = async (
  payload: UpdateUserProfilePayload,
): Promise<UserProfile> => {
  const { data } = await api.patch<UserProfile>("/user/profile", payload, {
    headers: authHeader(),
  });
  return data;
};

export const getUserStations = async (params?: GetUserStationsParams) => {
  const queryParams: Record<string, number> = {};

  if (params?.radius_km !== undefined) {
    queryParams.radius_km = params.radius_km;
  }
  if (params?.user_latitude !== undefined) {
    queryParams.user_latitude = params.user_latitude;
  }
  if (params?.user_longitude !== undefined) {
    queryParams.user_longitude = params.user_longitude;
  }

  const response = await api.get("/user/stations", {
    headers: authHeader(),
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });

  return response.data as UserStation[];
};

export const getStationSlots = async (
  stationId: number,
  slotDate?: string,
): Promise<StationSlot[]> => {
  const { data } = await api.get<StationSlot[]>(`/user/stations/${stationId}/slots`, {
    headers: authHeader(),
    params: slotDate ? { slot_date: slotDate } : undefined,
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
