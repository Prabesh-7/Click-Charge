import api from "./axiosInstance";
import { type CreateChargerSchema } from "@/lib/schema/CreateChargerSchema";
import { type CreateStaffSchema } from "@/lib/schema/CreateStaffSchema";

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
      charge_point_id: data.charge_point_id,
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

export const startCharging = async (chargerId: number) => {
  const response = await api.post(
    `/manager/chargers/${chargerId}/start`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const stopCharging = async (chargerId: number) => {
  const response = await api.post(
    `/manager/chargers/${chargerId}/stop`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getChargerMeterValues = async (chargerId: number) => {
  const response = await api.get(
    `/manager/chargers/${chargerId}/meter-values`,
    {
      headers: authHeader(),
    }
  );

  return response.data;
};
