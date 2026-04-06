import { z } from "zod";

export const stationUpdateSchema = z.object({
  station_name: z.string().min(3, "Station name must be at least 3 characters"),
  address: z.string().min(5, "Address is required"),
  longitude: z.coerce.number().finite("Longitude must be a valid number"),
  latitude: z.coerce.number().finite("Latitude must be a valid number"),
  total_charger: z.coerce
    .number()
    .int("Total chargers must be a whole number")
    .min(1, "At least 1 charger is required"),
});

export type StationUpdateFormValues = z.input<typeof stationUpdateSchema>;
export type StationUpdateSubmitValues = z.output<typeof stationUpdateSchema>;
export type StationUpdateSchema = StationUpdateSubmitValues;
