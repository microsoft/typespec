import { joinPaths } from "@typespec/compiler";
import { writeFile } from "fs/promises";
import { Application, DeclarationReflection, PageEvent, ReflectionKind } from "typedoc";
import { PluginOptions, load } from "typedoc-plugin-markdown";
import { stringify } from "yaml";
export async function generateJsApiDocs(libraryPath: string, outputDir: string) {
  const app = new Application();

  loadRenderer(app);
  load(app);

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

  app.bootstrap({
    name: "JS Api",
    entryPoints: [libraryPath],
    entryPointStrategy: "legacy-packages",
    githubPages: false,
    readme: "none",
    hideGenerator: true,
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
