import * as esbuild from "esbuild";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function bundle() {
  await mkdir(dirname(__dirname) + "/dist", { recursive: true });

  /**
   * `jco componentize` evaluates the top-level JS in a WASI JS runtime which
   * does not provide Node.js built-ins. We shim the handful of built-ins that
   * show up in the compiler dependency graph so the module graph can load.
   *
   * The shims are intentionally minimal and generally throw if actually used.
   */
  const nodeBuiltinsShimPlugin = {
    name: "node-builtins-shim",
    setup(build) {
      const shims = new Map([
        [
          "node:process",
          `const p = globalThis.process ?? {
  env: {},
  argv: [],
  platform: "wasi",
  cwd() { return "/"; },
  stdout: { isTTY: false },
  stderr: { isTTY: false },
};
export default p;
export const env = p.env;
export const argv = p.argv;
export const platform = p.platform;
export const cwd = p.cwd.bind(p);
`,
        ],
        [
          "process",
          `import p from "node:process";
export default p;
export const env = p.env;
export const argv = p.argv;
export const platform = p.platform;
export const cwd = p.cwd.bind(p);
`,
        ],
        [
          "node:path",
          `function normalize(path) {
  if (path === "") return ".";
  const isAbs = path.startsWith("/");
  const parts = path.split("/").filter((p) => p && p !== ".");
  const out = [];
  for (const part of parts) {
    if (part === "..") {
      if (out.length && out[out.length - 1] !== "..") out.pop();
      else if (!isAbs) out.push("..");
    } else {
      out.push(part);
    }
  }
  const joined = out.join("/");
  return isAbs ? "/" + joined : joined || (isAbs ? "/" : ".");
}
function join(...parts) {
  return normalize(parts.filter(Boolean).join("/"));
}
function dirname(path) {
  const n = normalize(path);
  if (n === "/") return "/";
  const idx = n.lastIndexOf("/");
  if (idx === -1) return ".";
  return idx === 0 ? "/" : n.slice(0, idx);
}
function basename(path) {
  const n = normalize(path);
  const idx = n.lastIndexOf("/");
  return idx === -1 ? n : n.slice(idx + 1);
}
function extname(path) {
  const b = basename(path);
  const i = b.lastIndexOf(".");
  return i <= 0 ? "" : b.slice(i);
}
function isAbsolute(path) {
  return path.startsWith("/");
}
function resolve(...parts) {
  let out = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (!part) continue;
    out = part + "/" + out;
    if (part.startsWith("/")) break;
  }
  return normalize(out || "/");
}
function relative(from, to) {
  const f = resolve(from).split("/").filter(Boolean);
  const t = resolve(to).split("/").filter(Boolean);
  let i = 0;
  while (i < f.length && i < t.length && f[i] === t[i]) i++;
  const up = f.length - i;
  const down = t.slice(i);
  return normalize([...(up ? Array(up).fill("..") : []), ...down].join("/") || ".");
}
export const sep = "/";
export const delimiter = ":";
export { normalize, join, dirname, basename, extname, isAbsolute, resolve, relative };
export const posix = { sep, delimiter, normalize, join, dirname, basename, extname, isAbsolute, resolve, relative };
export const win32 = posix;
export default posix;
`,
        ],
        [
          "path",
          `export * from "node:path";
import p from "node:path";
export default p;
`,
        ],
        [
          "node:url",
          `export const URL = globalThis.URL;
export function pathToFileURL(path) {
  const p = path.startsWith("/") ? path : "/" + path;
  return new URL("file://" + p);
}
export function fileURLToPath(url) {
  const u = typeof url === "string" ? new URL(url) : url;
  if (u.protocol !== "file:") throw new Error("Only file: URLs are supported");
  return decodeURIComponent(u.pathname);
}
export default { URL, pathToFileURL, fileURLToPath };
`,
        ],
        [
          "url",
          `export * from "node:url";
import u from "node:url";
export default u;
`,
        ],
        [
          "node:fs",
          `function notAvailable(name) {
  return function () {
    throw new Error("fs." + name + " is not available in the wasm bundle");
  };
}
export const readFileSync = notAvailable("readFileSync");
export const writeFileSync = notAvailable("writeFileSync");
export const existsSync = () => false;
export const mkdirSync = notAvailable("mkdirSync");
export const statSync = notAvailable("statSync");
export const realpathSync = notAvailable("realpathSync");
export default { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, realpathSync };
`,
        ],
        [
          "fs",
          `export * from "node:fs";
import f from "node:fs";
export default f;
`,
        ],
        [
          "node:fs/promises",
          `function notAvailable(name) {
  return async function () {
    throw new Error("fs/promises." + name + " is not available in the wasm bundle");
  };
}
export const readFile = notAvailable("readFile");
export const writeFile = notAvailable("writeFile");
export const mkdir = notAvailable("mkdir");
export const stat = notAvailable("stat");
export const realpath = notAvailable("realpath");
export default { readFile, writeFile, mkdir, stat, realpath };
`,
        ],
        [
          "fs/promises",
          `export * from "node:fs/promises";
import f from "node:fs/promises";
export default f;
`,
        ],
      ]);

      build.onResolve({ filter: /^(node:)?(process|path|url|fs)(\/promises)?$/ }, (args) => {
        const key = args.path.startsWith("node:") ? args.path : args.path;
        if (!shims.has(key)) return null;
        return { path: key, namespace: "node-shim" };
      });

      build.onLoad({ filter: /.*/, namespace: "node-shim" }, (args) => {
        return {
          contents: shims.get(args.path),
          loader: "js",
        };
      });
    },
  };

  const result = await esbuild.build({
    entryPoints: [dirname(__dirname) + "/dist/wasm-entry.js"],
    bundle: true,
    platform: "neutral",
    target: "es2022",
    format: "esm",
    mainFields: ["module", "main"],
    banner: {
      js: `// Inject minimal Node globals for componentize-js evaluation (not a full Node runtime).
var process = globalThis.process ?? (globalThis.process = {
  env: {},
  argv: [],
  platform: "wasi",
  cwd() { return "/"; },
  stdout: { isTTY: false },
  stderr: { isTTY: false },
});
`,
    },
    outfile: dirname(__dirname) + "/dist/bundle.js",
    plugins: [nodeBuiltinsShimPlugin],
    minify: false,
    sourcemap: true,
    metafile: true,
    treeShaking: true,
  });

  // Log bundle analysis
  if (result.metafile) {
    const text = await esbuild.analyzeMetafile(result.metafile, {
      verbose: true,
    });
    console.log(text);
  }

  console.log("✓ Bundle created at dist/bundle.js");
}

bundle().catch((err) => {
  console.error("Bundle failed:", err);
  process.exit(1);
});
