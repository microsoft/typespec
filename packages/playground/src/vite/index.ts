import { typespecBundlePlugin } from "@typespec/bundler";
import react from "@vitejs/plugin-react";
import { Plugin, ResolvedConfig, UserConfig } from "vite";
import { PlaygroundUserConfig } from "./types.js";

export function definePlaygroundViteConfig(config: PlaygroundUserConfig): UserConfig {
  return {
    base: "./",
    build: {
      target: "esnext",
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/node_modules/monaco-editor/esm/vs/editor")) {
              return "monaco";
            }
            return undefined;
          },
        },
      },
    },
    esbuild: {
      logOverride: { "this-is-undefined-in-esm": "silent" },
    },
    assetsInclude: [/\.tsp$/],
    optimizeDeps: {
      exclude: ["swagger-ui"],
    },
    plugins: [
      (react as any)({
        jsxImportSource: "@emotion/react",
        babel: {
          plugins: ["@emotion/babel-plugin"],
        },
      }),
      playgroundManifestPlugin(config),
      typespecBundlePlugin({
        folderName: "libs",
        libraries: config.libraries,
      }),
    ],
    server: {
      fs: {
        strict: false,
      },
    },
  };
}

function playgroundManifestPlugin(config: PlaygroundUserConfig): Plugin {
  const { samples, ...manifest } = config;
  let viteConfig: ResolvedConfig;

  return {
    name: "playground-manifest",
    enforce: "pre", // Need to run before resolving library imports to stub `@typespec/playground/manifest`
    async configResolved(c) {
      viteConfig = c;
    },
    resolveId(id: string) {
      if (id === "@typespec/playground/manifest") {
        return id;
      }
      return null;
    },
    load(id: string) {
      if (id === `@typespec/playground/manifest`) {
        const sampleImport = Object.values(samples)
          .map(
            (sampleValue, index) =>
              `import s${index} from "${viteConfig.root}/${sampleValue.filename}?raw"`
          )
          .join("\n");
        const sampleObj = [
          "{",
          ...Object.entries(samples).map(
            ([label, config], index) =>
              `${JSON.stringify(label)}: {
                fileName: ${JSON.stringify(config.filename)},
                preferredEmitter: ${
                  config.preferredEmitter ? JSON.stringify(config.preferredEmitter) : "undefined"
                },
                content: s${index},
                ${
                  config.compilerOptions
                    ? `compilerOptions: ${JSON.stringify(config.compilerOptions)},`
                    : ""
                }

              }, `
          ),
          "}",
        ].join("\n");

        const file = `
        ${sampleImport};
        
        export default {
           ...${JSON.stringify(manifest)},
          samples: ${sampleObj}
        };`;

        return file;
      }
      return undefined;
    },
  };
}
