import { Application } from "typedoc";
import { load } from "typedoc-plugin-markdown";
export async function generateJsApiDocs(libraryPath: string, outputDir: string) {
  const app = new Application();

  load(app);

  const markdownPluginOptions: any = {
    entryDocument: "index.md",
    readme: "none",
  };

  app.bootstrap({
    entryPoints: [libraryPath],
    entryPointStrategy: "packages",
    githubPages: false,
    readme: false,
    disableSources: true,
    ...markdownPluginOptions,
  });
  const project = app.convert();

  // if project is undefined typedoc has a problem - error logging will be supplied by typedoc.
  if (!project) {
    return;
  }

  await app.generateDocs(project, outputDir);
}
