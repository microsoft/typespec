import { resolve } from "path";
import type { Plugin } from "vite";
import { CadlBundle, createCadlBundle } from "./bundler.js";

export interface CadlBundlePluginOptions {
  prefix: string;

  /**
   * Name of libraries to bundle.
   */
  libraries: string[];
}

export function cadlBundlePlugin(options: CadlBundlePluginOptions): Plugin {
  console.log("Plugin", options);
  let bundles: Record<string, CadlBundle>;

  const files = new Map<string, string>();

  return {
    name: "cadl-bundle",
    enforce: "pre",
    options: (options) => {
      console.log("Vite options", options);
      return { ...options, watch: {} };
    },
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
            res.write(bundles[pkgId].content);
            res.end();
            return;
          }
        }
        next();
      });
    },

    async buildStart() {
      bundles = {};

      for (const library of options.libraries) {
        const bundle = await bundleLibrary(process.cwd(), library);
        bundles[library] = bundle;
        for (const file of bundle.sourceFiles) {
          console.log("Watching", file);
          files.set(file, library);
          this.addWatchFile(file);
        }
      }
    },

    handleHotUpdate: async (ctx) => {
      const library = files.get(ctx.file);
      if (library) {
        bundles[library] = await bundleLibrary(process.cwd(), library);
        console.log("Library changed", library);
        // ctx.server.ws.send({
        //   type: "full-reload",
        // });
      }
    },

    generateBundle() {
      console.log("Build end");
      for (const [name, bundle] of Object.entries(bundles)) {
        const filename = this.emitFile({
          type: "asset",
          fileName: `assets/${name}.js`,
          source: bundle.content,
        });
        console.log("Created as ", { filename, askedName: `assets/${name}.js` });
      }
    },
  };
}

async function bundleLibrary(projectRoot: string, name: string) {
  return await createCadlBundle(resolve(projectRoot, "node_modules", name));
}
