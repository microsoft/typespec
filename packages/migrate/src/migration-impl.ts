import { NodePackage, TextRange } from "@typespec/compiler";
import * as fs from "fs";
import { readFile, writeFile } from "fs/promises";
import prettier from "prettier";
import { TypeSpecCompilers } from "./migration-config.js";
import {
  ContentMigrateAction,
  ContentMigration,
  FileRenameMigration,
  MigrationKind,
  PackageVersionUpdateMigration,
  TypeSpecCompiler,
  TypeSpecCompilerVersion,
} from "./migration-types.js";

export interface MigrationResult {
  fileChanged: string[];
}

/** Main function for migrating typespec file content */
export async function migrateTypeSpecFiles(files: string[], migration: ContentMigration<any>) {
  const fromCompiler = await loadCompiler(migration.from);
  const toCompiler = await loadCompiler(migration.to);
  return migrateTypeSpecFilesInternal(fromCompiler, toCompiler, files, migration);
}

/** Main function for rename files */
export async function migrateFileRename(files: string[], migration: FileRenameMigration) {
  const renameActions = migration.migrate(files);
  if (renameActions.length === 0) return;

  console.log(`Renaming ${renameActions.length} file(s):`);
  for (const action of renameActions) {
    console.log(` - ${action.sourceFileName} -> ${action.targetFileName}`);
    fs.rename(action.sourceFileName, action.targetFileName, (err) => {
      if (err) {
        console.error(
          `Error renaming file from ${action.sourceFileName} to ${action.targetFileName}`,
          err
        );
      }
    });
  }
}

/** Main function for migrating package versions in the package.json */
export async function migratePackageVersion(
  pkgFile: string,
  migration: PackageVersionUpdateMigration
) {
  const packageJson: NodePackage = JSON.parse(await readFile(pkgFile, "utf-8"));
  const actions = migration.migrate(packageJson);
  if (actions.length === 0) return;

  console.log(`Updating ${actions.length} package(s):`);

  let changeMade = false;
  for (const action of actions) {
    if (
      packageJson.dependencies !== undefined &&
      packageJson.dependencies[action.packageName] !== undefined
    ) {
      if (action.renamePackageName !== undefined) {
        delete packageJson.dependencies[action.packageName];
        packageJson.dependencies[action.renamePackageName] = action.toVersion;
      } else packageJson.dependencies[action.packageName] = action.toVersion;

      console.log(` - dependencies: ${action.renamePackageName} -> ${action.toVersion}.`);
      changeMade = true;
    }
    if (
      packageJson.devDependencies !== undefined &&
      packageJson.devDependencies[action.packageName] !== undefined
    ) {
      if (action.renamePackageName !== undefined) {
        delete packageJson.devDependencies[action.packageName];
        packageJson.devDependencies[action.renamePackageName] = action.toVersion;
      } else packageJson.devDependencies[action.packageName] = action.toVersion;

      console.log(` - devDependencies: ${action.renamePackageName} -> ${action.toVersion}.`);
      changeMade = true;
    }
  }
  if (changeMade) {
    const prettyJsonString = prettier.format(JSON.stringify(packageJson), { parser: "json" });
    fs.writeFileSync(pkgFile, prettyJsonString);
  }
}

/** This is used by test code to migrate single file content */
export async function migrateTypeSpecContent(content: string, migration: ContentMigration<any>) {
  const fromCompiler = await loadCompiler(migration.from);
  const toCompiler = await loadCompiler(migration.to);
  return migrateTypeSpecContentInternal(fromCompiler, toCompiler, content, migration);
}

async function loadCompiler<V extends TypeSpecCompilerVersion>(
  version: V
): Promise<TypeSpecCompilers[V]> {
  try {
    return await import(`@typespec/compiler-v${version}`);
  } catch {
    return (await import("@typespec/compiler")) as any;
  }
}

async function migrateTypeSpecFilesInternal(
  fromCompiler: TypeSpecCompiler,
  toCompiler: TypeSpecCompiler,
  files: string[],
  migration: ContentMigration<any>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    fileChanged: [],
  };
  for (const file of files) {
    if (await migrateTypeSpecFile(fromCompiler, toCompiler, file, migration)) {
      result.fileChanged.push(file);
    }
  }
  return result;
}

async function migrateTypeSpecFile(
  fromCompiler: TypeSpecCompiler,
  toCompiler: TypeSpecCompiler,
  filename: string,
  migration: ContentMigration<any>
): Promise<boolean> {
  const buffer = await readFile(filename);
  const content = buffer.toString();
  const [newContent, changed] = migrateTypeSpecContentInternal(
    fromCompiler,
    toCompiler,
    content,
    migration
  );

  await writeFile(filename, newContent);
  return changed;
}

function migrateTypeSpecContentInternal(
  fromCompiler: TypeSpecCompiler,
  toCompiler: TypeSpecCompiler,
  content: string,
  migration: ContentMigration<any>
): [string, boolean] {
  const parsed = fromCompiler.parse(content);
  const actions = migration
    .migrate(createMigrationContext(parsed), fromCompiler, parsed as any)
    .filter((action): action is ContentMigrateAction => action.kind === MigrationKind.Content)
    .sort((a, b) => a.target.pos - b.target.pos);

  return ContentMigration(toCompiler, content, actions);
}

function ContentMigration(
  toCompiler: TypeSpecCompiler,
  content: string,
  actions: ContentMigrateAction[]
): [string, boolean] {
  if (actions.length === 0) {
    return [content, false];
  }
  const segments = [];
  let last = 0;
  for (const action of actions) {
    segments.push(content.slice(last, action.target.pos));
    segments.push(action.content);
    last = action.target.end;
  }
  segments.push(content.slice(last, -1));

  const newContent = segments.join("");

  try {
    return [(toCompiler as any).formatTypeSpec(newContent), true];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to format new code", e);
    return [newContent, true];
  }
}

function createMigrationContext(root: any) {
  function printNode(node: TextRange) {
    return root.file.text.slice(node.pos, node.end);
  }
  function printNodes(nodes: readonly TextRange[]): string {
    if (nodes.length === 0) {
      return "";
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    return root.file.text.slice(first.pos, last.end);
  }

  return { printNode, printNodes };
}
