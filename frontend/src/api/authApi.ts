import api from "./axiosInstance";
import { type RegisterSchema} from "@/lib/schema/auth.schema";

export const registerUser = async (data: RegisterSchema) => {
  const response = await api.post("/register", data);
  return response.data;
};