import api from "./axiosInstance";

export interface StaffSlot {
  slot_id: number;
  connector_id: number;
  connector_number: number;
  charger_id: number;
  charger_name: string;
  charger_type: string;
  station_id: number;
  station_name?: string;
  start_time: string;
  end_time: string;
  status: string;
  reserved_by_user_id: number | null;
  reserved_by_user_name?: string | null;
  reserved_by_username?: string | null;
  reserved_by_email?: string | null;
  reserved_by_phone_number?: string | null;
  reserved_at: string | null;
  created_by_manager_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

const authHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const getMyChargersByStaff = async () => {
  const response = await api.get("/staff/my-chargers", {
    headers: authHeader(),
  });

  return response.data;
};

export const startChargingByStaff = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/staff/chargers/${chargerId}/start${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const stopChargingByStaff = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/staff/chargers/${chargerId}/stop${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const reserveConnectorByStaff = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/staff/chargers/${chargerId}/reserve${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const releaseConnectorByStaff = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.post(
    `/staff/chargers/${chargerId}/release${query}`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getStaffReservations = async () => {
  const response = await api.get("/staff/reservations", {
    headers: authHeader(),
  });

  return response.data;
};

export const getStaffSlots = async (slotDate?: string): Promise<StaffSlot[]> => {
  const response = await api.get('/staff/slots', {
    headers: authHeader(),
    params: slotDate ? { slot_date: slotDate } : undefined,
  });
  return response.data as StaffSlot[];
};

export interface CreateStaffSlotPayload {
  connector_id: number;
  start_time: string;
  end_time: string;
}

export const createStaffSlot = async (payload: CreateStaffSlotPayload) => {
  const response = await api.post('/staff/slots', payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const releaseStaffSlotReservation = async (slotId: number) => {
  const response = await api.post(`/staff/slots/${slotId}/release`, {}, {
    headers: authHeader(),
  });
  return response.data;
};

export const getChargerMeterValuesByStaff = async (chargerId: number, connectorId?: number) => {
  const query = connectorId ? `?connector_id=${connectorId}` : "";
  const response = await api.get(`/staff/chargers/${chargerId}/meter-values${query}`, {
    headers: authHeader(),
  });

  return response.data;
};
