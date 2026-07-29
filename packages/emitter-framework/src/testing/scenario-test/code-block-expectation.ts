import type { SnippetExtractor } from "./snippet-extractor.js";

export interface ElementQuery {
  /** Type to query */
  type: string;

  /** Name of the type to query */
  name: string;
}

export interface CodeBlockQuery {
  /** Language */
  lang: string;

  /** File path */
  file: string;

  /** Query for content in the file */
  query?: ElementQuery;
}

export interface CodeBlockExpectation extends CodeBlockQuery {
  /** Expected content of the code block */
  expected: string;
}

/**
 * Parse a markdown code block following the expectation syntax
 */
export function parseCodeblockExpectation(heading: string, content: string): CodeBlockExpectation {
  const query = parseCodeBlockHeading(heading);
  return {
    ...query,
    expected: content,
  };
}

/**
 * Parse the codeblock heading for what it should validate.
 * Expected format
 * ```
 * ts path/to/file.ts {type} {name}
 * ```
 */
export function parseCodeBlockHeading(heading: string): CodeBlockQuery {
  const [lang, file, type, name] = heading.split(" ");
  if (!file) {
    throw new Error(
      `Invalid code block heading: "${heading}". Missing file path. Expected format: "<lang> <path>"`,
    );
  }

  if (type && !name) {
    throw new Error(
      `Invalid code block heading: "${heading}". Missing name when using type. Expected format: "<lang> <path> [type] [name]"`,
    );
  }

  return { lang, file, query: type ? { type, name } : undefined };
}

export function getExcerptForQuery(
  snippetExtractor: SnippetExtractor,
  expectation: CodeBlockQuery,
  outputs: Record<string, string>,
): string {
  const content = outputs[expectation.file];

  if (!content) {
    throw new Error(
      `File ${expectation.file} not found in emitted files:\n ${Object.keys(outputs).join("\n")}`,
    );
  }

  return getExcerptInFile(snippetExtractor, expectation, content);
}

function getExcerptInFile(
  snippetExtractor: SnippetExtractor,
  expectation: CodeBlockQuery,
  sourceFile: string,
): string {
  if (expectation.query) {
    const excerpt = tryGetExcerptInFile(snippetExtractor, expectation.query, sourceFile);
    if (!excerpt) {
      throw new Error(
        `Could not find ${expectation.query.type} "${expectation.query.name}" in file "${expectation.file}".`,
      );
    }
    return excerpt;
  } else {
    return sourceFile;
  }
}

function tryGetExcerptInFile(
  snippetExtractor: SnippetExtractor,
  query: ElementQuery,
  sourceFile: string,
): string | null {
  switch (query.type) {
    case "interface":
      return snippetExtractor.getInterface(sourceFile, query.name);
    case "type":
      return snippetExtractor.getTypeAlias(sourceFile, query.name);
    case "enum":
      return snippetExtractor.getEnum(sourceFile, query.name);
    case "function":
      return snippetExtractor.getFunction(sourceFile, query.name);
    case "class":
      return snippetExtractor.getClass(sourceFile, query.name);
    default:
      throw new Error("Unsupported type in code block expectation: " + query.type);
  }
}
