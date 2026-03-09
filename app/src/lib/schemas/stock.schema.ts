import { z } from "zod";
import { idSchema } from "./helpers";

export const createMovementSchema = z.object({
  action: z.enum(["SUPPLIER_INCOME", "SHIPMENT", "ADJUSTMENT"]),
  itemId: idSchema,
  quantity: z.number().refine((v) => v !== 0, "Количество не может быть 0"),
  comment: z.string().optional(),
  operationKey: z.string().optional(),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
