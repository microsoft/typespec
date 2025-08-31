import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

type DocItems = Awaited<ReturnType<typeof getCollection<"docs">>>;

export async function getStaticPaths() {
  const docs = await getCollection("docs");

  return docs
    .filter((doc) => {
      // Exclude release notes
      if (doc.id.includes("/release-notes/")) return false;
      return true;
    })
    .map((doc) => ({
      params: { slug: generateMarkdownPath(doc.id) },
      props: { doc },
    }));
}

export const GET: APIRoute<{ doc: DocItems[number] }> = async ({ props }) => {
  const { doc } = props;
  const rawContent = doc.body;

  return new Response(rawContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};

function generateMarkdownPath(docId: string): string {
  // All of the docs in the collection have `docs` prepended to the path - we need to
  // remove this since it'll be prepended again given this route is in the `docs` folder.
  const path = docId.startsWith("docs") ? docId.slice(5) : docId;

  // If the final path fragment does not include a file extension, use `index.html.md`
  if (path.endsWith("/")) {
    return `${path}index.html`;
  }

  const finalPathFragment = path.split("/").pop() ?? "";
  if (!finalPathFragment.includes(".")) {
    return `${path}/index.html`;
  }

  return path;
}
