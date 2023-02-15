import { TextRange } from "@typespec/compiler";
import { readFile, writeFile } from "fs/promises";
import {
  Migration,
  TypeSpecCompiler,
  TypeSpecCompilers,
  TypeSpecCompilerVersion,
} from "./migrations/migration.js";
export interface MigrationResult {
  fileChanged: string[];
}

export async function migrateTypeSpecFiles(files: string[], migration: Migration<any>) {
  const fromCompiler = await loadCompiler(migration.from);
  const toCompiler = await loadCompiler(migration.to);
  return migrateTypeSpecFilesInternal(fromCompiler, toCompiler, files, migration);
}

export async function migrateTypeSpecContent(content: string, migration: Migration<any>) {
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
  migration: Migration<any>
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
  migration: Migration<any>
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
  migration: Migration<any>
): [string, boolean] {
  const parsed = fromCompiler.parse(content);
  const actions = migration
    .migrate(createMigrationContext(parsed), fromCompiler, parsed as any)
    .sort((a, b) => a.target.pos - b.target.pos);

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
