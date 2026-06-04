import { existsSync, readFileSync, readdirSync } from "fs";
import matter from "gray-matter";
import MiniSearch from "minisearch";
import { join, relative } from "path";

const REPO = "pinterest/typespec";
const BRANCH = "main";
const DOCS_PREFIX = "website/src/content/docs/docs/";
const COMPILER_PREFIX = "packages/compiler/src/";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

export interface DocEntry {
  id: string;
  path: string;
  title: string;
  topic: string;
  headings: string[];
  content: string;
}

let cachedIndex: MiniSearch<DocEntry> | null = null;
let cachedDocs: Map<string, DocEntry> | null = null;
let cachedCompilerFiles: Map<string, string> | null = null;

function getLocalDocsRoot(): string | null {
  const paths = [
    join(import.meta.dirname, "..", "assets", "docs"),
    join(import.meta.dirname, "..", "..", "..", "website", "src", "content", "docs", "docs"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function getLocalCompilerSrcRoot(): string | null {
  const paths = [
    join(import.meta.dirname, "..", "assets", "compiler-src"),
    join(import.meta.dirname, "..", "..", "..", "packages", "compiler", "src"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function walkDir(dir: string, ext: string[]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, ext));
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

async function fetchGitHubTree(): Promise<string[]> {
  const url = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = (await res.json()) as { tree: Array<{ path: string; type: string }> };
  return data.tree.filter((t) => t.type === "blob").map((t) => t.path);
}

async function fetchFileContent(repoPath: string): Promise<string> {
  const res = await fetch(`${RAW_BASE}${repoPath}`);
  if (!res.ok) throw new Error(`Failed to fetch ${repoPath}: ${res.status}`);
  return res.text();
}

function extractTopic(relPath: string): string {
  const first = relPath.split("/")[0];
  return first ?? "other";
}

function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  for (const line of content.split("\n")) {
    const match = line.match(/^#{1,4}\s+(.+)/);
    if (match) headings.push(match[1]);
  }
  return headings;
}

function buildIndexFromLocal(docsRoot: string): {
  index: MiniSearch<DocEntry>;
  docs: Map<string, DocEntry>;
} {
  const files = walkDir(docsRoot, [".md", ".mdx"]);
  const docs = new Map<string, DocEntry>();

  for (const file of files) {
    const relPath = relative(docsRoot, file);
    if (relPath.startsWith("release-notes/")) continue;

    const raw = readFileSync(file, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    const entry: DocEntry = {
      id: relPath,
      path: relPath,
      title: (frontmatter.title as string) ?? relPath,
      topic: extractTopic(relPath),
      headings: extractHeadings(content),
      content,
    };
    docs.set(relPath, entry);
  }

  const index = new MiniSearch<DocEntry>({
    fields: ["title", "headings", "content"],
    storeFields: ["path", "title", "topic"],
    searchOptions: { boost: { title: 3, headings: 2 }, fuzzy: 0.2, prefix: true },
  });
  index.addAll(Array.from(docs.values()));
  return { index, docs };
}

async function buildIndexFromGitHub(): Promise<{
  index: MiniSearch<DocEntry>;
  docs: Map<string, DocEntry>;
}> {
  const tree = await fetchGitHubTree();
  const docPaths = tree.filter(
    (p) =>
      p.startsWith(DOCS_PREFIX) &&
      (p.endsWith(".md") || p.endsWith(".mdx")) &&
      !p.includes("release-notes/"),
  );

  const docs = new Map<string, DocEntry>();
  const fetches = docPaths.map(async (fullPath) => {
    const relPath = fullPath.slice(DOCS_PREFIX.length);
    const raw = await fetchFileContent(fullPath);
    const { data: frontmatter, content } = matter(raw);

    const entry: DocEntry = {
      id: relPath,
      path: relPath,
      title: (frontmatter.title as string) ?? relPath,
      topic: extractTopic(relPath),
      headings: extractHeadings(content),
      content,
    };
    docs.set(relPath, entry);
  });

  await Promise.all(fetches);

  const index = new MiniSearch<DocEntry>({
    fields: ["title", "headings", "content"],
    storeFields: ["path", "title", "topic"],
    searchOptions: { boost: { title: 3, headings: 2 }, fuzzy: 0.2, prefix: true },
  });
  index.addAll(Array.from(docs.values()));
  return { index, docs };
}

async function ensureIndex(): Promise<{
  index: MiniSearch<DocEntry>;
  docs: Map<string, DocEntry>;
}> {
  if (cachedIndex && cachedDocs) return { index: cachedIndex, docs: cachedDocs };

  const localRoot = getLocalDocsRoot();
  const result = localRoot ? buildIndexFromLocal(localRoot) : await buildIndexFromGitHub();

  cachedIndex = result.index;
  cachedDocs = result.docs;
  return result;
}

async function ensureCompilerFiles(): Promise<Map<string, string>> {
  if (cachedCompilerFiles) return cachedCompilerFiles;

  const localRoot = getLocalCompilerSrcRoot();
  if (localRoot) {
    const files = new Map<string, string>();
    for (const subdir of ["typekit/kits", "typekit", "core", "experimental"]) {
      const dir = join(localRoot, subdir);
      if (!existsSync(dir)) continue;
      for (const file of walkDir(dir, [".ts"])) {
        const relPath = relative(localRoot, file);
        files.set(relPath, readFileSync(file, "utf-8"));
      }
    }
    cachedCompilerFiles = files;
    return files;
  }

  const tree = await fetchGitHubTree();
  const compilerPaths = tree.filter(
    (p) =>
      p.startsWith(COMPILER_PREFIX) &&
      p.endsWith(".ts") &&
      (p.includes("/typekit/") || p.includes("/core/") || p.includes("/experimental/")),
  );

  const files = new Map<string, string>();
  const fetches = compilerPaths.map(async (fullPath) => {
    const relPath = fullPath.slice(COMPILER_PREFIX.length);
    const content = await fetchFileContent(fullPath);
    files.set(relPath, content);
  });
  await Promise.all(fetches);

  cachedCompilerFiles = files;
  return files;
}

export async function searchDocs(
  query: string,
  topic?: string,
  maxResults: number = 3,
): Promise<DocEntry[]> {
  const { index, docs } = await ensureIndex();

  let results = index.search(query);
  if (topic) {
    results = results.filter((r) => r.topic === topic);
  }

  return results
    .slice(0, maxResults)
    .map((r) => docs.get(r.id)!)
    .filter(Boolean);
}

export async function getDocByPath(path: string): Promise<DocEntry | undefined> {
  const { docs } = await ensureIndex();
  return docs.get(path);
}

export async function getTypeSignature(symbol: string): Promise<string | null> {
  const files = await ensureCompilerFiles();
  const results: string[] = [];

  for (const [relPath, content] of files) {
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
      const symbolPattern = new RegExp(
        `\\b(export\\s+)?(interface|type|function|const|class)\\s+${escapeRegex(symbol)}\\b`,
      );
      if (!symbolPattern.test(lines[i])) continue;

      let start = i;
      while (
        start > 0 &&
        (lines[start - 1].trimStart().startsWith("*") ||
          lines[start - 1].trimStart().startsWith("/**") ||
          lines[start - 1].trimStart().startsWith("//") ||
          lines[start - 1].trim() === "")
      ) {
        start--;
      }
      if (lines[start].trim() === "") start++;

      let end = i;
      let braceCount = 0;
      let started = false;
      while (end < lines.length) {
        for (const ch of lines[end]) {
          if (ch === "{" || ch === "(") {
            braceCount++;
            started = true;
          }
          if (ch === "}" || ch === ")") braceCount--;
        }
        if (started && braceCount <= 0) break;
        if (!started && (lines[end].endsWith(";") || lines[end].endsWith(","))) break;
        end++;
      }

      const block = lines.slice(start, end + 1).join("\n");
      results.push(`// ${relPath}:${start + 1}\n${block}`);
      break;
    }
  }

  return results.length > 0 ? results.join("\n\n---\n\n") : null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
