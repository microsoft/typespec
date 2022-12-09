import { cadlBundlePlugin } from "@cadl-lang/bundler";
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
    assetsInclude: [/\.cadl$/],
    optimizeDeps: {
      exclude: ["node-fetch", "swagger-ui"],
    },
    plugins: [
      react({
        jsxImportSource: "@emotion/react",
        babel: {
          plugins: ["@emotion/babel-plugin"],
        },
      }),
      playgroundManifestPlugin(config),
      cadlBundlePlugin({
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
          .map((path, index) => `import s${index} from "${viteConfig.root}/${path}?raw"`)
          .join("\n");
        const sampleObj = [
          "{",
          ...Object.keys(samples).map((label, index) => `${JSON.stringify(label)}: s${index}, `),
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
