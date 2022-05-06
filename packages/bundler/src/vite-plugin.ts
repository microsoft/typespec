import { resolve } from "path";
import type { Plugin } from "vite";
import { createCadlBundleFile } from "./bundler.js";

export interface CadlBundlePluginOptions {
  prefix: string;

  /**
   * Name of libraries to bundle.
   */
  libraries: string[];
}

export function cadlBundlePlugin(options: CadlBundlePluginOptions): Plugin {
  console.log("Plugin", options);
  let bundles: Record<string, string>;

  return {
    name: "cadl-bundle",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const id = req.url;
        if (id === undefined) {
          next();
          return;
        }
        if (id.startsWith(options.prefix) && id.endsWith(".js")) {
          const pkgId = id.slice(options.prefix.length, -".js".length);
          if (bundles[pkgId]) {
            res.writeHead(200, "Ok", { "Content-Type": "application/javascript" });
            res.write("//foo\n" + bundles[pkgId]);
            res.end();
            return;
          }
        }
        next();
      });
    },

    async buildStart() {
      bundles = await bundleLibraries(process.cwd(), options.libraries);
    },

    generateBundle() {
      console.log("Build end");
      for (const [name, code] of Object.entries(bundles)) {
        const filename = this.emitFile({
          type: "asset",
          fileName: `assets/${name}.js`,
          source: code,
        });
        console.log("Created as ", { filename, askedName: `assets/${name}.js` });
      }
    },
  };
}

async function bundleLibraries(
  projectRoot: string,
  libraries: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const library of libraries) {
    const code = await bundleLibrary(projectRoot, library);
    result[library] = code;
  }
  return result;
}
async function bundleLibrary(projectRoot: string, name: string) {
  return await createCadlBundleFile(resolve(projectRoot, "node_modules", name));
}
