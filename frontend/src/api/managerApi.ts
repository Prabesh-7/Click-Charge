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
    created_at: string;
    last_status_change: string;
  }[];
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  type: "CCS2" | "GBT" | "TYPE2" | "CHAdeMO";
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
  manager_id: number | null;
  created_at: string;
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

export const updateCharger = async (chargerId: number, data: CreateChargerSchema) => {
  const response = await api.put(
    `/manager/chargers/${chargerId}`,
    {
      name: data.name,
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
