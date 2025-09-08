import type { APIRoute } from "astro";
import {
  generateLlmstxt,
  generateLlmstxtFull,
  processDocsForLlmsTxt,
  type DocEntry,
  type TopicProps,
} from "./index";

export type RouteParams = { path: string; llms_type: "llms" | "llms-full" };
export type RouteProps = Pick<Required<TopicProps>, "title" | "description" | "docs">;

export const spreadLlmsTxtRoute: APIRoute<RouteProps, RouteParams> = async ({
  props,
  params,
  site,
}) => {
  const { title, docs, description } = props;
  const { llms_type } = params;

  if (llms_type === "llms") {
    const llmsData = await processDocsForLlmsTxt({
      title,
      description,
      docs,
      // Use blank pathPrefix to include all docs in the llms.txt
      llmsSections: [{ name: "Docs", pathPrefix: "" }],
      site,
    });

    const llmstxt = generateLlmstxt(llmsData);
    return new Response(llmstxt, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } else {
    const llmstxt = generateLlmstxtFull(description, docs);
    return new Response(llmstxt, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }
};

export const markdownRoute: APIRoute<{ doc: DocEntry }> = async ({ props }) => {
  const { doc } = props;
  return new Response(doc.body ?? "", {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
