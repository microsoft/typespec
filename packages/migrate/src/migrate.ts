import { TextRange } from "@cadl-lang/compiler";
import { readFile, writeFile } from "fs/promises";
import {
  CadlCompiler,
  CadlCompilers,
  CadlCompilerVersion,
  Migration,
} from "./migrations/migration.js";
export interface MigrationResult {
  fileChanged: string[];
}

export async function migrateCadlFiles(files: string[], migration: Migration<any>) {
  const fromCompiler = await loadCompiler(migration.from);
  const toCompiler = await loadCompiler(migration.to);
  return migrateCadlFilesInternal(fromCompiler, toCompiler, files, migration);
}

export async function migrateCadlContent(content: string, migration: Migration<any>) {
  const fromCompiler = await loadCompiler(migration.from);
  const toCompiler = await loadCompiler(migration.to);
  return migrateCadlContentInternal(fromCompiler, toCompiler, content, migration);
}

async function loadCompiler<V extends CadlCompilerVersion>(version: V): Promise<CadlCompilers[V]> {
  try {
    return await import(`@cadl-lang/compiler-v${version}`);
  } catch {
    return (await import("@cadl-lang/compiler")) as any;
  }
}

async function migrateCadlFilesInternal(
  fromCompiler: CadlCompiler,
  toCompiler: CadlCompiler,
  files: string[],
  migration: Migration<any>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    fileChanged: [],
  };
  for (const file of files) {
    if (await migrateCadlFile(fromCompiler, toCompiler, file, migration)) {
      result.fileChanged.push(file);
    }
  }
  return result;
}

async function migrateCadlFile(
  fromCompiler: CadlCompiler,
  toCompiler: CadlCompiler,
  filename: string,
  migration: Migration<any>
): Promise<boolean> {
  const buffer = await readFile(filename);
  const content = buffer.toString();
  const [newContent, changed] = migrateCadlContentInternal(
    fromCompiler,
    toCompiler,
    content,
    migration
  );

  await writeFile(filename, newContent);
  return changed;
}

function migrateCadlContentInternal(
  fromCompiler: CadlCompiler,
  toCompiler: CadlCompiler,
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
    return [(toCompiler as any).formatCadl(newContent), true];
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
