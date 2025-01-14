import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection, z } from "astro:content";

export const collections = {
  docs: defineCollection({
    schema: docsSchema({
      extend: z.object({
        version: z.string().optional(),
        releaseDate: z.coerce
          .date()
          .optional()
          .describe(
            "A date string or YAML date that is compatible with JavaScript's `new Date()` constructor.",
          ),
      }),
    }),
  }),
  blog: defineCollection({
    type: "content",
    // Type-check frontmatter using a schema
    schema: z.object({
      title: z.string(),
      description: z.string(),
      image: z.string().optional(),
      publishDate: z.coerce
        .date()
        .describe(
          "A date string or YAML date that is compatible with JavaScript's `new Date()` constructor.",
        ),
    }),
  }),
};
