import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection, z } from "astro:content";

const authorSchema = z.object({
  name: z.string(),
  title: z.string(),
  avatar: z.string().optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
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
      // Support both single author and multiple authors
      author: authorSchema.optional(),
      authorAvatar: z.string().optional(),
      authors: z.array(authorSchema).optional(),
    }),
  }),
};
