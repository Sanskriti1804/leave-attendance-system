import { z } from "zod";

export const leaveHistoryParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
