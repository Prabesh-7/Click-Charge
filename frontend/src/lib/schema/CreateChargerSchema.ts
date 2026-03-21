import { z } from "zod";

export const chargerTypes = ["CCS2", "GBT", "TYPE2", "CHAdeMO"] as const;
export type ChargerTypeOption = (typeof chargerTypes)[number];

export const createChargerSchema = z.object({
  name: z.string().min(2, "Charger name is required"),
  charge_point_id: z
    .string()
    .min(1, "Charge Point ID is required")
    .max(50, "Charge Point ID must be at most 50 characters"),
  type: z.enum(chargerTypes).refine((val) => chargerTypes.includes(val), {
    message: "Select a charger type",
  }),
  max_power_kw: z
    .number( "Max power must be a number" )
    .min(1, "Max power must be at least 1 kW")
    .optional()
    .default(50),
  current_transaction_id: z
    .number( "Current transaction ID must be a number" )
    .optional(),
});

export type CreateChargerSchema = z.infer<typeof createChargerSchema>;