import { TextRange } from "@cadl-lang/compiler";
import { readFile, writeFile } from "fs/promises";
import { CadlCompiler, Migration } from "./migrations/migration.js";

export interface MigrationResult {
  fileChanged: string[];
}
export async function migrateCadlFiles(
  compiler: CadlCompiler,
  files: string[],
  migration: Migration<any>
): Promise<MigrationResult> {
  const result: MigrationResult = {
    fileChanged: [],
  };
  for (const file of files) {
    if (await migrateCadlFile(compiler, file, migration)) {
      result.fileChanged.push(file);
    }
  }
  return result;
}

export async function migrateCadlFile(
  compiler: CadlCompiler,
  filename: string,
  migration: Migration<any>
): Promise<boolean> {
  const buffer = await readFile(filename);
  const content = buffer.toString();
  const [newContent, changed] = migrateCadlContent(compiler, content, migration);

  await writeFile(filename, newContent);
  return changed;
}

export function migrateCadlContent(
  compiler: CadlCompiler,
  content: string,
  migration: Migration<any>
): [string, boolean] {
  const parsed = compiler.parse(content);
  const actions = migration
    .migrate(createMigrationContext(parsed), compiler, parsed as any)
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
  return [segments.join(""), true];
}

function createMigrationContext(root: any) {
  function printNode(node: TextRange) {
    return root.file.text.slice(node.pos, node.end);
  }
  function printNodes(nodes: readonly TextRange[]) {
    return nodes.map((x) => printNode(x)).join("");
  }

  return { printNode, printNodes };
}
