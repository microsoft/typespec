import express from "express";
import { basename } from "path";
import { CadlDevServer, CompilerHost } from "./types.js";
import { NodeHost, resolvePluginModule } from "./util.js";

export async function startDevServer(plugins: string[]): Promise<CadlDevServer> {
  const app = express();
  const outputs: Record<string, string> = {};

  app.get("/cadl-output/:file*", (req, res) => {
    const param = (req.params as any).file;
    const output = outputs[param];
    if (output === undefined) {
      console.log(
        `cannot find ${param} in outputs: [${Object.keys(outputs)
          .map((x) => ` - ${x}`)
          .join("\n")}]`
      );
      return res.status(404).end();
    }
    return res.status(200).send(output).end();
  });
  const server = app.listen(3000, () => {
    console.log("Started dev server");
  });

  const host: CompilerHost = {
    ...NodeHost,
    writeFile: (path, content) => {
      outputs[basename(path)] = content;
      return NodeHost.writeFile(path, content);
    },
  };

  const onCompiledCallbacks: Function[] = [];
  function onCompiled(callback: () => void) {
    onCompiledCallbacks.push(callback);
  }

  function notifyCompiled() {
    for (const callback of onCompiledCallbacks) {
      callback();
    }
  }

  const devServer: CadlDevServer = {
    host,
    app,
    server,
    onCompiled,
    notifyCompiled,
  };
  await loadPlugins(plugins, devServer);

  return devServer;
}

async function loadPlugins(plugins: string[], devServer: CadlDevServer) {
  for (const pluginName of plugins) {
    const importPath = await resolvePluginModule(
      NodeHost,
      pluginName,
      process.cwd(),
      (pkg) => pkg.main
    );
    const plugin = await import(importPath);
    if (plugin.$onDevServer) {
      await plugin.$onDevServer(devServer);
    }
  }
}
