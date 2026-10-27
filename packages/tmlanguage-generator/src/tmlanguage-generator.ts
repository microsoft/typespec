import { readFile } from "fs/promises";
import { createRequire } from "module";
import { dirname, resolve } from "path";
import * as plist from "plist";
import vscodeOniguruma from "vscode-oniguruma";

const require = createRequire(import.meta.url);

const { loadWASM, createOnigScanner } = vscodeOniguruma;

/** TextMate grammar schema URL to use for {@link Grammar.$schema}. */
export const schema =
  "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json";

/**
 * Marks a larger construct that groups tokens without assigning them a single color.
 * Emitted as `meta.<rule key>.<lowercase grammar name>` using the containing rule's
 * {@link RuleKey.key} and {@link Grammar.name}.
 */
export const meta = Symbol("meta");

/** Gives a rule its identity in the emitted grammar's shared repository. */
export interface RuleKey {
  /**
   * Repository key used to generate `#<key>` include references.
   * Reusing the same rule object is supported, including cycles; distinct rule
   * objects with the same key cause emission to fail.
   */
  key: string;
}

/** Assigns a TextMate scope to a rule's match or a captured group. */
export interface RuleScope<Scope extends string = string> {
  /**
   * Scope emitted as the TextMate `name` property, which themes use for coloring.
   * Use {@link meta} on keyed rules to derive a grouping scope from the rule key.
   * See https://macromates.com/manual/en/language_grammars#naming_conventions
   */
  scope: Scope | typeof meta;
}

/** Supplies child rules to a grammar, region, rule group, or capture. */
export interface RulePatterns<Scope extends string = string> {
  /**
   * Rules to try in array order. Emission registers each rule in the repository
   * and replaces each array entry with an include reference to its key.
   */
  patterns: Rule<Scope>[];
}

/**
 * Maps capture group numbers, as strings, to scopes or nested pattern lists.
 * `"0"` addresses the entire match; other entries address numbered groups.
 * Omitted groups receive no capture-specific scope or patterns.
 */
export type Captures<Scope extends string = string> = Record<
  string,
  RuleScope<Scope> | RulePatterns<Scope>
>;

/**
 * A keyed match, begin/end region, or reusable group of rules.
 * Pattern lists refer to these objects directly rather than to repository-key strings.
 */
export type Rule<Scope extends string = string> =
  MatchRule<Scope> | BeginEndRule<Scope> | IncludeRule<Scope>;

/** Applies a scope to a single regex match, optionally refining its capture groups. */
export interface MatchRule<Scope extends string = string> extends RuleScope<Scope>, RuleKey {
  /** Oniguruma regular expression source, not a JavaScript `RegExp` or slash-delimited literal. */
  match: string;
  /** Optional scope or nested-pattern overrides for groups matched by {@link MatchRule.match}. */
  captures?: Captures<Scope>;
}

/**
 * Applies a scope to a region delimited by two Oniguruma regular expressions.
 * Optional inherited `patterns` define rules active within the region.
 */
export interface BeginEndRule<Scope extends string = string>
  extends RuleKey, RuleScope<Scope>, Partial<RulePatterns<Scope>> {
  /** Oniguruma regular expression source that starts the region. */
  begin: string;
  /** Oniguruma regular expression source that terminates the region. */
  end: string;
  /** Optional capture mappings for the opening delimiter, separate from the region's scope. */
  beginCaptures?: Captures<Scope>;
  /** Optional capture mappings for the closing delimiter, separate from the region's scope. */
  endCaptures?: Captures<Scope>;
}

/**
 * Groups a pattern list under a repository key without adding a match or scope.
 * Reuse the group object in other pattern lists to include its rules, including recursively.
 */
export interface IncludeRule<Scope extends string = string> extends RuleKey, RulePatterns<Scope> {}

/**
 * Root grammar metadata and ordered entry rules for {@link emitJSON} or {@link emitPList}.
 * Only rules reachable through pattern lists are added to the generated repository.
 */
export interface Grammar<Scope extends string = string> extends RulePatterns<Scope> {
  /** Schema annotation copied to the output; use the exported {@link schema} URL. */
  $schema: typeof schema;
  /** Display name, also lowercased when expanding {@link meta} scopes. */
  name: string;
  /** Root TextMate scope for the language, such as `source.tsp`; copied unchanged. */
  scopeName: string;
  /** File extensions associated with the grammar, conventionally without a leading dot. */
  fileTypes: string[];
}

let initialized = false;
async function initialize() {
  if (!initialized) {
    const onigurumaPath = require.resolve("vscode-oniguruma");
    const wasmPath = resolve(dirname(onigurumaPath), "onig.wasm");
    const wasm = await readFile(wasmPath);
    await loadWASM({ data: wasm.buffer as ArrayBuffer });
    initialized = true;
  }
}

/** Controls diagnostics shared by the JSON and PList emitters. */
export interface EmitOptions {
  /**
   * File path printed in invalid-regex diagnostics, with line and column fixed at `(1,1)`.
   * Defaults to `unknown_file`; this path is not read or used as an output destination.
   */
  errorSourceFilePath?: string;
}

/**
 * Returns a TextMate grammar as JSON with two-space indentation, without writing a file.
 * Builds a key-sorted repository and ordered include references without mutating the input.
 *
 * Oniguruma validates each `match`, `begin`, and `end` expression. Invalid expressions
 * are logged using {@link EmitOptions.errorSourceFilePath} and reject the promise;
 * duplicate keys on distinct rule objects also reject it.
 */
export async function emitJSON(grammar: Grammar, options: EmitOptions = {}): Promise<string> {
  await initialize();
  const indent = 2;
  const processed = await processGrammar(grammar, options);
  return JSON.stringify(processed, undefined, indent);
}

/**
 * Returns a TextMate grammar as PList XML, without writing a file.
 * Uses the same repository conversion and validation as {@link emitJSON}.
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
      const scanner = createOnigScanner([regexp]);
      scanner.findNextMatchSync("", 0);
    } catch (err: any) {
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
