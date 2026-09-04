import { z } from "zod";

export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"] as const;
export const ALLOWED_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"] as const;

export const documentIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const uploadLeaveIdSchema = z.coerce.number().int().positive();

export type DocumentIdParams = z.infer<typeof documentIdParamsSchema>;
