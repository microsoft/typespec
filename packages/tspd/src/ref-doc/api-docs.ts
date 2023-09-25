import { joinPaths } from "@typespec/compiler";
import { writeFile } from "fs/promises";
import { Application, DeclarationReflection, PageEvent, ReflectionKind } from "typedoc";
import { PluginOptions, load } from "typedoc-plugin-markdown";
import { stringify } from "yaml";
export async function generateJsApiDocs(libraryPath: string, outputDir: string) {
  const markdownPluginOptions: Partial<PluginOptions> = {
    entryFileName: "index.md",
    propertiesFormat: "table",
    enumMembersFormat: "table",
    typeDeclarationFormat: "table",
    hidePageTitle: true,
    hideBreadcrumbs: true,
    titleTemplate: "{name}",
    hideInPageTOC: true,
    hidePageHeader: true,

    tocFormat: "list",
    flattenOutputFiles: true,
    identifiersAsCodeBlocks: true,
  };

  const app = await Application.bootstrapWithPlugins({
    entryPoints: [joinPaths(libraryPath, "src/index.ts")],
    tsconfig: joinPaths(libraryPath, "tsconfig.json"),
    entryPointStrategy: "resolve",
  });

  loadRenderer(app);
  load(app);

  setOptions(app, {
    name: "JS Api",
    githubPages: false,
    readme: "none",
    hideGenerator: true,
    disableSources: true,
    ...markdownPluginOptions,
  });

  const project = await app.convert();

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

function setOptions(app: Application, options: any, reportErrors = true) {
  for (const [key, val] of Object.entries(options)) {
    app.options.setValue(key as never, val as never);
  }
}

export function loadRenderer(app: Application) {
  app.renderer.on(PageEvent.END, (page: PageEvent<DeclarationReflection>) => {
    if (page.contents) {
      const frontMatter = createFrontMatter(page.model);
      page.contents = frontMatter + page.contents.replace(/\\</g, "<");
    }
  });
}

function createFrontMatter(model: DeclarationReflection) {
  return ["---", stringify(createFrontMatterData(model)), "---", ""].join("\n");
}

function createFrontMatterData(model: DeclarationReflection) {
  const kind = ReflectionKind.singularString(model.kind)[0];

  return {
    jsApi: true,
    title: `[${kind}] ${model.name}`,
  };
}
