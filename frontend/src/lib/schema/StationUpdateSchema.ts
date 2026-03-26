import { z } from "zod";

export const stationUpdateSchema = z.object({
  station_name: z.string().min(3, "Station name must be at least 3 characters"),
  address: z.string().min(5, "Address is required"),
  longitude: z.number(),
  latitude: z.number(),
  total_charger: z.number().int().min(1, "At least 1 charger is required"),
});

export type StationUpdateSchema = z.infer<typeof stationUpdateSchema>;
