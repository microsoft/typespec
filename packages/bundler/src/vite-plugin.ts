import { resolvePath } from "@cadl-lang/compiler";
import { resolve } from "path";
import type { IndexHtmlTransformContext, Plugin, ResolvedConfig } from "vite";
import { CadlBundle, CadlBundleDefinition, createCadlBundle, watchCadlBundle } from "./bundler.js";

export interface CadlBundlePluginOptions {
  folderName: string;

  /**
   * Name of libraries to bundle.
   */
  libraries: string[];
}

export function cadlBundlePlugin(options: CadlBundlePluginOptions): Plugin {
  let config: ResolvedConfig;
  const definitions: Record<string, CadlBundleDefinition> = {};
  const bundles: Record<string, CadlBundle> = {};

  return {
    name: "cadl-bundle",
    enforce: "pre",
    async configResolved(c) {
      config = c;
    },
    async buildStart() {
      for (const name of options.libraries) {
        const bundle = await bundleLibrary(config.root, name);
        bundles[name] = bundle;
        definitions[name] = bundle.definition;
      }
    },
    async configureServer(server) {
      for (const library of options.libraries) {
        await watchBundleLibrary(config.root, library, (bundle) => {
          bundles[library] = bundle;
          definitions[library] = bundle.definition;
          server.ws.send({ type: "full-reload" });
        });
      }

      server.middlewares.use((req, res, next) => {
        const id = req.url;
        if (id === undefined) {
          next();
          return;
        }
        const start = `/${options.folderName}/`;

        const resolveFilename = (path: string) => {
          if (path === "") {
            return "index.js";
          } else {
            return `${path}.js`;
          }
        };
        const findPkgName = (id: string): [string, string] | undefined => {
          const segments = id.slice(start.length, -".js".length).split("/");
          if (bundles[segments[0]]) {
            return [segments[0], resolveFilename(segments.slice(1).join("/"))];
          }
          const inFolder = segments[0] + "/" + segments[1];
          if (bundles[inFolder]) {
            return [inFolder, resolveFilename(segments.slice(2).join("/"))];
          }
          return undefined;
        };
        if (id.startsWith(start) && id.endsWith(".js")) {
          const found = findPkgName(id);
          if (found) {
            const [pkgId, path] = found;
            const file = bundles[pkgId].files.find((x) => x.filename === path);
            if (file) {
              res.writeHead(200, "Ok", { "Content-Type": "application/javascript" });
              res.write(file.content);
              res.end();
              return;
            }
          }
        }
        next();
      });
    },

    async generateBundle() {
      for (const name of options.libraries) {
        for (const file of bundles[name].files) {
          this.emitFile({
            type: "asset",
            fileName: `${options.folderName}/${name}/${file.filename}`,
            source: file.content,
          });
        }
      }
    },

    transformIndexHtml: {
      enforce: "post",
      transform: (html: string, ctx: IndexHtmlTransformContext) => {
        // Inject the importmap before the html script. Cannot just use injectTo:head-prepend as vite will inject its own script before that and cause a failure.
        const importMapTag = `<script type="importmap">\n${JSON.stringify(
          createImportMap(options.folderName, definitions),
          null,
          2
        )}\n</script>`;
        return html.replace("<html", importMapTag + "\n<html");
      },
    },
  };
}

function createImportMap(folderName: string, definitions: Record<string, CadlBundleDefinition>) {
  const imports: Record<string, string> = {};
  for (const [library, definition] of Object.entries(definitions)) {
    imports[library] = `./${folderName}/${library}/index.js`;
    for (const name of Object.keys(definition.exports)) {
      imports[library + "/http"] = "./" + resolvePath(`./${folderName}/${library}`, name) + ".js";
    }
  }
  const importMap = {
    imports: imports,
  };

  return importMap;
}
async function bundleLibrary(projectRoot: string, name: string) {
  return await createCadlBundle(resolve(projectRoot, "node_modules", name));
}
async function watchBundleLibrary(
  projectRoot: string,
  name: string,
  onChange: (bundle: CadlBundle) => void
) {
  return await watchCadlBundle(resolve(projectRoot, "node_modules", name), onChange);
}
