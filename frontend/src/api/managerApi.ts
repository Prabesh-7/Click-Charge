import api from "./axiosInstance";
import { type CreateChargerSchema } from "@/lib/schema/CreateChargerSchema";
import { type CreateStaffSchema } from "@/lib/schema/CreateStaffSchema";

export interface ManagerCharger {
  charger_id: number;
  station_id: number;
  name: string;
  charge_point_id: string;
  connectors: {
    connector_id: number;
    connector_number: number;
    charge_point_id: string;
    status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
    current_transaction_id?: number | null;
    reserved_by_user_id?: number | null;
    reserved_at?: string | null;
    created_at: string;
    last_status_change: string;
  }[];
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  type: "CCS2" | "GBT" | "TYPE2" | "CHAdeMO";
  price_per_kwh: number;
  max_power_kw: number;
  current_transaction_id?: number | null;
  created_at: string;
  last_status_change: string;
}

export interface ManagerStation {
  station_id: number;
  station_name: string;
  address: string;
  longitude: number;
  latitude: number;
  total_charger: number;
  station_description?: string | null;
  phone_number?: string | null;
  has_wifi: boolean;
  has_parking: boolean;
  has_food: boolean;
  has_coffee: boolean;
  has_bedroom: boolean;
  has_restroom: boolean;
  station_images: string[];
  manager_id: number | null;
  created_at: string;
}

export interface ManagerWallet {
  wallet_id: number;
  user_id: number;
  balance: number;
  updated_at: string;
}

export interface ManagerStationUpdate {
  station_description?: string;
  phone_number?: string;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_food?: boolean;
  has_coffee?: boolean;
  has_bedroom?: boolean;
  has_restroom?: boolean;
  station_images?: string[];
}

export interface ManagerStaff {
  user_id: number;
  user_name: string;
  email: string;
  role: string;
  phone_number?: string | null;
  vehicle?: string | null;
  station_id?: number | null;
  created_at: string;
}

export interface ReservationItem {
  charger_id: number;
  charger_name: string;
  charger_type: string;
  connector_id: number;
  connector_number: number;
  charge_point_id: string;
  status: "RESERVED";
  reserved_at?: string | null;
  reserved_by_user_id?: number | null;
  reserved_by_user_name?: string | null;
  reserved_by_email?: string | null;
  reserved_by_phone_number?: string | null;
}

export interface Slot {
  slot_id: number;
  connector_id: number;
  connector_number: number;
  charger_id: number;
  charger_name: string;
  charger_type: string;
  station_id: number;
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

export interface CreateSlotPayload {
  connector_id: number;
  start_time: string;
  end_time: string;
}

export interface UpdateSlotPayload {
  start_time?: string;
  end_time?: string;
  status?: string;
}

export interface ChargingSessionItem {
  session_id: number;
  station_id: number;
  charger_id: number;
  charger_name: string;
  connector_id: number;
  connector_number: number;
  start_time: string;
  end_time: string | null;
  started_by_user_id: number | null;
  invoice_id: string | null;
  invoice_issued_at: string | null;
  invoice_currency: string | null;
  invoice_total_energy_kwh: number | null;
  invoice_price_per_kwh: number | null;
  invoice_total_amount: number | null;
}

export interface ManagerStationReview {
  review_id: number;
  station_id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  rating: number;
  review_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagerStationReviewSummary {
  station_id: number;
  average_rating: number;
  review_count: number;
}

const authHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const addCharger = async (data: CreateChargerSchema) => {
  const response = await api.post(
    "/manager/add-charger",
    {
      name: data.name,
      connector_count: data.connector_count,
      type: data.type,
      max_power_kw: data.max_power_kw,
      current_transaction_id: data.current_transaction_id,
    },
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const createStaff = async (data: CreateStaffSchema) => {
  const response = await api.post(
    "/manager/create-staff",
    data,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getMyChargers = async () => {
  const response = await api.get(
    "/manager/my-chargers",
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getMyStation = async () => {
  const response = await api.get(
    "/manager/my-station",
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getManagerStationReviews = async (): Promise<ManagerStationReview[]> => {
  const response = await api.get("/manager/station-reviews", {
    headers: authHeader(),
  });

  return response.data as ManagerStationReview[];
};

export const getManagerStationReviewSummary = async (): Promise<ManagerStationReviewSummary> => {
  const response = await api.get("/manager/station-reviews/summary", {
    headers: authHeader(),
  });

  return response.data as ManagerStationReviewSummary;
};

export const getManagerWallet = async (): Promise<ManagerWallet> => {
  const response = await api.get("/manager/wallet", {
    headers: authHeader(),
  });
  return response.data as ManagerWallet;
};

export const updateMyStation = async (data: ManagerStationUpdate) => {
  const response = await api.put(
    "/manager/my-station",
    data,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const uploadStationImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/manager/upload-image",
    formData,
    {
      headers: {
        ...authHeader(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data as { image_url: string };
};

export const getMyStaff = async () => {
  const response = await api.get(
    "/manager/my-staff",
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const startCharging = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/manager/chargers/${chargerId}/start${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const stopCharging = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/manager/chargers/${chargerId}/stop${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const reserveConnectorSlot = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/manager/chargers/${chargerId}/reserve${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const releaseConnectorSlot = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/manager/chargers/${chargerId}/release${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getChargerMeterValues = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.get(
    `/manager/chargers/${chargerId}/meter-values${query}`,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getManagerReservations = async () => {
  const response = await api.get(
    "/manager/reservations",
    {
      headers: authHeader(),
    }
  );

  return response.data as ReservationItem[];
};

export const getManagerChargingSessions = async (): Promise<ChargingSessionItem[]> => {
  const response = await api.get("/manager/charging-sessions", {
    headers: authHeader(),
  });

  return response.data as ChargingSessionItem[];
};

export const getManagerSlots = async (slotDate?: string): Promise<Slot[]> => {
  const response = await api.get('/manager/slots', {
    headers: authHeader(),
    params: slotDate ? { slot_date: slotDate } : undefined,
  });
  return response.data as Slot[];
};

export const createManagerSlot = async (payload: CreateSlotPayload) => {
  const response = await api.post('/manager/slots', payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const updateManagerSlot = async (slotId: number, payload: UpdateSlotPayload) => {
  const response = await api.put(`/manager/slots/${slotId}`, payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const deleteManagerSlot = async (slotId: number) => {
  const response = await api.delete(`/manager/slots/${slotId}`, {
    headers: authHeader(),
  });
  return response.data;
};

export const releaseManagerSlotReservation = async (slotId: number) => {
  const response = await api.post(`/manager/slots/${slotId}/release`, {}, {
    headers: authHeader(),
  });
  return response.data;
};

export const sendManagerSlotConfirmation = async (slotId: number) => {
  const response = await api.post(`/manager/slots/${slotId}/send-confirmation`, {}, {
    headers: authHeader(),
  });
  return response.data;
};

export const updateCharger = async (chargerId: number, data: CreateChargerSchema) => {
  const response = await api.put(
    `/manager/chargers/${chargerId}`,
    {
      name: data.name,
      type: data.type,
      price_per_kwh: data.price_per_kwh,
      max_power_kw: data.max_power_kw,
      current_transaction_id: data.current_transaction_id,
    },
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const updateChargerPricing = async (chargerId: number, pricePerKwh: number) => {
  const response = await api.put(
    `/manager/chargers/${chargerId}/pricing`,
    { price_per_kwh: pricePerKwh },
    {
      headers: authHeader(),
    }
  );

  return response.data as ManagerCharger;
};

export const deleteCharger = async (chargerId: number) => {
  const response = await api.delete(
    `/manager/chargers/${chargerId}`,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const updateStaff = async (userId: number, data: CreateStaffSchema) => {
  const response = await api.put(
    `/manager/staff/${userId}`,
    data,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const deleteStaff = async (userId: number) => {
  const response = await api.delete(
    `/manager/staff/${userId}`,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};
