import { resolve } from "path";
import type { Plugin } from "vite";
import { CadlBundle, createCadlBundle } from "./bundler.js";

export interface CadlBundlePluginOptions {
  folderName: string;

  /**
   * Name of libraries to bundle.
   */
  libraries: string[];
}

export function cadlBundlePlugin(options: CadlBundlePluginOptions): Plugin {
  let bundles: Record<string, CadlBundle>;

  const files = new Map<string, string>();

  return {
    name: "cadl-bundle",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const id = req.url;
        if (id === undefined) {
          next();
          return;
        }
        const start = `/${options.folderName}/`;
        if (id.startsWith(start) && id.endsWith(".js")) {
          const pkgId = id.slice(start.length, -".js".length);
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
          files.set(file, library);
          this.addWatchFile(file);
        }
      }
    },

    async handleHotUpdate(ctx) {
      const library = files.get(ctx.file);
      if (library) {
        bundles[library] = await bundleLibrary(process.cwd(), library);
        // ctx.server.ws.send({
        //   type: "full-reload",
        // });
      }
    },

    generateBundle() {
      for (const [name, bundle] of Object.entries(bundles)) {
        this.emitFile({
          type: "asset",
          fileName: `${options.folderName}/${name}.js`,
          source: bundle.content,
        });
      }
    },
  };
}

async function bundleLibrary(projectRoot: string, name: string) {
  return await createCadlBundle(resolve(projectRoot, "node_modules", name));
}
