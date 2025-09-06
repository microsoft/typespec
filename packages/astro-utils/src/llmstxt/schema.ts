import { z } from "astro:content";

export const llmstxtSchema = z.object({
  description: z.string(),
});
