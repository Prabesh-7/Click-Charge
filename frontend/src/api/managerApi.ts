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
      type: data.type,
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
