import { typespecBundlePlugin } from "@typespec/bundler";
import react from "@vitejs/plugin-react";
import { Plugin, ResolvedConfig, UserConfig } from "vite";
import { PlaygroundConfig } from "../index.js";

export function definePlaygroundViteConfig(config: PlaygroundConfig): UserConfig {
  return {
    base: "./",
    build: {
      target: "esnext",
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            monaco: ["monaco-editor"],
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

function playgroundManifestPlugin(config: PlaygroundConfig): Plugin {
  const { samples, ...manifest } = config;
  let viteConfig: ResolvedConfig;

  return {
    name: "playground-manifest",
    async configResolved(c) {
      viteConfig = c;
    },
    resolveId(id: string) {
      if (id === "playground-manifest.js") {
        return id;
      }
      return null;
    },
    load(id: string) {
      if (id === `playground-manifest.js`) {
        const sampleImport = Object.values(samples)
          .map(
            (sampleValue, index) =>
              `import s${index} from "${viteConfig.root}/${sampleValue.fileName}?raw"`
          )
          .join("\n");
        const sampleObj = [
          "{",
          ...Object.entries(samples).map(
            ([label, config], index) =>
              `${JSON.stringify(label)}: {
                fileName: ${JSON.stringify(config.fileName)},
                preferredEmitter: ${
                  config.preferredEmitter ? JSON.stringify(config.preferredEmitter) : "undefined"
                },
                content: s${index}
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
