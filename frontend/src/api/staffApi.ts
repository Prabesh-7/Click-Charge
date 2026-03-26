import api from "./axiosInstance";

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

export const startChargingByStaff = async (chargerId: number) => {
  const response = await api.post(
    `/staff/chargers/${chargerId}/start`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const stopChargingByStaff = async (chargerId: number) => {
  const response = await api.post(
    `/staff/chargers/${chargerId}/stop`,
    {},
    {
      headers: authHeader(),
    }
  );

  return response.data;
};

export const getChargerMeterValuesByStaff = async (chargerId: number) => {
  const response = await api.get(`/staff/chargers/${chargerId}/meter-values`, {
    headers: authHeader(),
  });

  return response.data;
};
