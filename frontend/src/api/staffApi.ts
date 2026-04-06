import api from "./axiosInstance";

export interface StaffSlot {
  slot_id: number;
  connector_id: number;
  charger_id: number;
  charger_name: string;
  station_id: number;
  station_name: string;
  start_time: string;
  end_time: string;
  status: string;
  reserved_by_user_id: number | null;
  reserved_by_username: string | null;
  reserved_at: string | null;
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
