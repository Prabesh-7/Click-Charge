import { z } from "zod";

export const chargerTypes = ["CCS2", "GBT", "TYPE2", "CHAdeMO"] as const;
export type ChargerTypeOption = (typeof chargerTypes)[number];

export const createChargerSchema = z.object({
  name: z.string().min(2, "Charger name is required"),
  connector_count: z
    .coerce.number()
    .int("Connector count must be a whole number")
    .min(1, "Connector count must be at least 1")
    .max(20, "Connector count must be at most 20")
    .default(1),
  type: z.enum(chargerTypes).refine((val) => chargerTypes.includes(val), {
    message: "Select a charger type",
  }),
  max_power_kw: z
    .coerce.number()
    .min(1, "Max power must be at least 1 kW")
    .optional()
    .default(50),
  current_transaction_id: z
    .coerce.number()
    .int()
    .optional(),
});

export type CreateChargerSchema = z.infer<typeof createChargerSchema>;