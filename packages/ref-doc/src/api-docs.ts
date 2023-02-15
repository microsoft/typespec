import { joinPaths } from "@typespec/compiler";
import { writeFile } from "fs/promises";
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
    name: "JS Api",
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

  await writeFile(
    joinPaths(outputDir, "_category_.json"),
    JSON.stringify({
      label: "JS Api",
      link: {
        type: "doc",
        id: "index",
      },
    })
  );
}
