import { z } from "zod";

// Manager info
const managerSchema = z.object({
  user_name: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username cannot exceed 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone_number: z.string().optional(),
});

// Station info
const stationSchema = z.object({
  station_name: z.string().min(3, "Station name is required"),
  address: z.string().min(5, "Address is required"),
  longitude: z.number(),
  latitude: z.number(),
  total_charger: z.number().min(1, "At least 1 charger is required"),
});

// Combine manager + station
export const createManagerStationSchema = z.object({
  manager: managerSchema,
  station: stationSchema,
});

export type CreateManagerStationSchema = z.infer<typeof createManagerStationSchema>;