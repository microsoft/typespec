import { readFile } from "fs/promises";
import { loadWASM, OnigRegExp } from "onigasm";
import { dirname, resolve } from "path";
import plist from "plist";

export const schema =
  "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json";

/**
 * Special scope that indicates a larger construct that doesn't get a single color.
 * Expanded to meta.<key>.<grammar name> during emit.
 */
export const meta = Symbol("meta");

export interface RuleKey {
  /** Rule's unique key through which identifies the rule in the repository. */
  key: string;
}

export interface RuleScope<Scope extends string = string> {
  /**
   * The TextMate scope that gets assigned to a match and colored by a theme.
   * See https://macromates.com/manual/en/language_grammars#naming_conventions
   */
  scope: Scope | typeof meta;
}

export interface RulePatterns<Scope extends string = string> {
  patterns: Rule<Scope>[];
}

export type Captures<Scope extends string = string> = Record<
  string,
  RuleScope<Scope> | RulePatterns<Scope>
>;

export type Rule<Scope extends string = string> =
  | MatchRule<Scope>
  | BeginEndRule<Scope>
  | IncludeRule<Scope>;

export interface MatchRule<Scope extends string = string> extends RuleScope<Scope>, RuleKey {
  match: string;
  captures?: Captures<Scope>;
}

export interface BeginEndRule<Scope extends string = string>
  extends RuleKey,
    RuleScope<Scope>,
    Partial<RulePatterns<Scope>> {
  begin: string;
  end: string;
  beginCaptures?: Captures<Scope>;
  endCaptures?: Captures<Scope>;
}

export interface IncludeRule<Scope extends string = string> extends RuleKey, RulePatterns<Scope> {}

export interface Grammar<Scope extends string = string> extends RulePatterns<Scope> {
  $schema: typeof schema;
  name: string;
  scopeName: string;
  fileTypes: string[];
}

let initialized = false;
async function initialize() {
  if (!initialized) {
    const onigasmPath = require.resolve("onigasm");
    const wasmPath = resolve(dirname(onigasmPath), "onigasm.wasm");
    const wasm = await readFile(wasmPath);
    await loadWASM(wasm.buffer as any);
    initialized = true;
  }
}

export interface EmitOptions {
  errorSourceFilePath?: string;
}

/**
 * Emit the given grammar to JSON.
 */
export async function emitJSON(grammar: Grammar, options: EmitOptions = {}): Promise<string> {
  await initialize();
  const indent = 2;
  const processed = await processGrammar(grammar, options);
  return JSON.stringify(processed, undefined, indent);
}

/**
 * Emit the given grammar to PList XML
 */
export async function emitPList(grammar: Grammar, options: EmitOptions = {}): Promise<string> {
  await initialize();
  const processed = await processGrammar(grammar, options);
  return plist.build(processed);
}

/**
 * Convert the grammar from our more convenient representation to the
 * tmlanguage schema. Perform some validation in the process.
 */
async function processGrammar(grammar: Grammar, options: EmitOptions): Promise<any> {
  await initialize();

  // key is rule.key, value is [unprocessed rule, processed rule]. unprocessed
  // rule is used for its identity to check for duplicates and deal with cycles.
  const repository = new Map<string, [Rule, any]>();
  const output = processNode(grammar, options);
  output.repository = processRepository();
  return output;

  function processNode(node: any, options: EmitOptions): any {
    if (typeof node !== "object") {
      return node;
    }
    if (Array.isArray(node)) {
      return node.map((n) => processNode(n, options));
    }
    const output: any = {};
    for (const key in node) {
      const value = node[key];
      switch (key) {
        case "key":
          // Drop it. It was used to place the node in the repository, and does
          // not need to be retained on the node in the final structure.
          break;
        case "scope":
          // tmlanguage uses "name" confusingly for scope. We avoid "name" which
          // can be confused with the repository key.
          output.name = value === meta ? `meta.${node.key}.${grammar.name.toLowerCase()}` : value;
          break;
        case "begin":
        case "end":
        case "match":
          validateRegexp(value, node, key, options);
          output[key] = value;
          break;
        case "patterns":
          output[key] = processPatterns(value, options);
          break;
        default:
          output[key] = processNode(value, options);
          break;
      }
    }
    return output;
  }

  function processPatterns(rules: Rule[], options: EmitOptions) {
    for (const rule of rules) {
      if (!repository.has(rule.key)) {
        // put placeholder first to prevent cycles
        const entry: [Rule, any] = [rule, undefined];
        repository.set(rule.key, entry);
        // fill placeholder with processed node.
        entry[1] = processNode(rule, options);
      } else if (repository.get(rule.key)![0] !== rule) {
        throw new Error("Duplicate key: " + rule.key);
      }
    }

    return rules.map((r) => ({ include: `#${r.key}` }));
  }

  function processRepository() {
    const output: any = {};
    for (const key of [...repository.keys()].sort()) {
      output[key] = repository.get(key)![1];
    }
    return output;
  }

  function validateRegexp(regexp: string, node: any, prop: string, options: EmitOptions) {
    try {
      new OnigRegExp(regexp).testSync("");
    } catch (err: any) {
      if (/^[0-9,]+$/.test(err.message)) {
        // Work around for https://github.com/NeekSandhu/onigasm/issues/26
        const array = new Uint8Array(err.message.split(",").map((s: string) => Number(s)));
        const buffer = Buffer.from(array);
        err = new Error(buffer.toString("utf-8"));
      }
      const sourceFile = options.errorSourceFilePath ?? "unknown_file";
      //prettier-ignore
      // eslint-disable-next-line no-console
      console.error(`${sourceFile}(1,1): error TM0001: Bad regex: ${JSON.stringify({[prop]: regexp})}: ${err.message}`);
      // eslint-disable-next-line no-console
      console.error(node);
      throw err;
    }
  }
}
