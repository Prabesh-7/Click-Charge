import { z } from "zod";

export const chargerTypes = ["CCS2", "GBT", "TYPE2", "CHAdeMO"] as const;
export type ChargerTypeOption = (typeof chargerTypes)[number];

export const createChargerSchema = z.object({
  name: z.string().min(2, "Charger name is required"),
  type: z.enum(chargerTypes, {
    errorMap: () => ({ message: "Select a charger type" }),
  }),
});

export type CreateChargerSchema = z.infer<typeof createChargerSchema>;

