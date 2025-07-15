import { format } from "prettier";
import { Language, Node, Parser } from "web-tree-sitter";

// Interface for SnippetExtractor
export interface SnippetExtractor {
  getClass(fileContent: string, name: string): string | null;
  getFunction(fileContent: string, name: string): string | null;
  getInterface(fileContent: string, name: string): string | null;
  getTypeAlias(fileContent: string, name: string): string | null;
  getEnum(fileContent: string, name: string): string | null;
}

const wasmMap = {
  "tree-sitter-c-sharp": "tree-sitter-c-sharp/tree-sitter-c_sharp.wasm",
  "tree-sitter-java": "tree-sitter-java/tree-sitter-java.wasm",
  "tree-sitter-python": "tree-sitter-python/tree-sitter-python.wasm",
  "tree-sitter-typescript": "tree-sitter-typescript/tree-sitter-typescript.wasm",
};

function loadLanguage(name: keyof typeof wasmMap): Promise<Language> {
  const path = require.resolve(wasmMap[name]);
  return Language.load(path);
}

export async function createCSharpExtractorConfig(): Promise<LanguageConfiguration> {
  return {
    codeBlockTypes: ["cs", "csharp"],
    format: async (content: string) => content,
    language: await loadLanguage("tree-sitter-c-sharp"),
    nodeKindMapping: {
      classNodeType: "class_declaration",
      functionNodeType: "local_function_statement",
      interfaceNodeType: "interface_declaration",
      enumNodeType: "enum_declaration",
    },
  };
}

export async function createJavaExtractorConfig(): Promise<LanguageConfiguration> {
  return {
    codeBlockTypes: ["java"],
    format: async (content: string) => content,
    language: await loadLanguage("tree-sitter-java"),
    nodeKindMapping: {
      classNodeType: "class_declaration",
      functionNodeType: "method_declaration",
      interfaceNodeType: "interface_declaration",
      enumNodeType: "enum_declaration",
    },
  };
}

export async function createPythonExtractorConfig(): Promise<LanguageConfiguration> {
  return {
    codeBlockTypes: ["py", "python"],
    format: async (content: string) => content,
    language: await loadLanguage("tree-sitter-python"),
    nodeKindMapping: {
      classNodeType: "class_definition",
      functionNodeType: "function_definition",
    },
  };
}

export async function createTypeScriptExtractorConfig(): Promise<LanguageConfiguration> {
  return {
    codeBlockTypes: ["ts", "typescript"],
    language: await loadLanguage("tree-sitter-typescript"),
    format: async (content: string) => format(content, { parser: "typescript" }),
    nodeKindMapping: {
      classNodeType: "class_declaration",
      functionNodeType: "function_declaration",
      interfaceNodeType: "interface_declaration",
      typeAliasNodeType: "type_alias_declaration",
      enumNodeType: "enum_declaration",
    },
  };
}

export interface LanguageConfiguration {
  language: Language;
  format: (content: string) => Promise<string>;
  codeBlockTypes: string[];
  nodeKindMapping: {
    classNodeType?: string;
    functionNodeType?: string;
    interfaceNodeType?: string;
    typeAliasNodeType?: string;
    enumNodeType?: string;
  };
}

await Parser.init();

export function createSnippetExtractor(
  languageConfiguration: LanguageConfiguration,
): SnippetExtractor {
  return new SnippetExtractorImpl(languageConfiguration);
}

class SnippetExtractorImpl implements SnippetExtractor {
  private readonly languageConfiguration: LanguageConfiguration;
  private parser: Parser;

  constructor(languageConfiguration: LanguageConfiguration) {
    this.parser = new Parser();
    const languageConfig: Language = languageConfiguration.language;
    this.parser.setLanguage(languageConfig);
    this.languageConfiguration = languageConfiguration;
  }

  getClass(fileContent: string, name: string): string | null {
    const classNodeType = this.languageConfiguration.nodeKindMapping.classNodeType;
    if (!classNodeType) {
      throw new Error("Class node type is not defined in the language configuration");
    }
    const classNode = this.findNodeByTypeAndName(fileContent, classNodeType, name);
    return classNode ? this.getCodeFromNode(classNode) : null;
  }

  getFunction(fileContent: string, name: string): string | null {
    const functionNodeType = this.languageConfiguration.nodeKindMapping.functionNodeType;
    if (!functionNodeType) {
      throw new Error("Function node type is not defined in the language configuration");
    }
    const classNode = this.findNodeByTypeAndName(fileContent, functionNodeType, name);
    return classNode ? this.getCodeFromNode(classNode) : null;
  }

  getInterface(fileContent: string, name: string): string | null {
    const interfaceNodeType = this.languageConfiguration.nodeKindMapping.interfaceNodeType;
    if (!interfaceNodeType) {
      throw new Error("Interface node type is not defined in the language configuration");
    }
    const classNode = this.findNodeByTypeAndName(fileContent, interfaceNodeType, name);
    return classNode ? this.getCodeFromNode(classNode) : null;
  }

  getTypeAlias(fileContent: string, name: string): string | null {
    const typeAliasNodeType = this.languageConfiguration.nodeKindMapping.typeAliasNodeType;
    if (!typeAliasNodeType) {
      throw new Error("Type Alias node type is not defined in the language configuration");
    }
    const typeAliasNode = this.findNodeByTypeAndName(fileContent, typeAliasNodeType, name);
    return typeAliasNode ? this.getCodeFromNode(typeAliasNode) : null;
  }

  getEnum(fileContent: string, name: string): string | null {
    const enumNodeType = this.languageConfiguration.nodeKindMapping.enumNodeType;
    if (!enumNodeType) {
      throw new Error("Enum node type is not defined in the language configuration");
    }
    const enumNode = this.findNodeByTypeAndName(fileContent, enumNodeType, name);
    return enumNode ? this.getCodeFromNode(enumNode) : null;
  }

  // Helper function to extract code from a node
  private getCodeFromNode(node: Node): string {
    // Walk backward to include preceding nodes like 'export', 'public', etc.
    let startIndex = node.startIndex;
    let current = node.previousSibling;

    // Check for any modifiers (like 'export') that appear before the node
    while (
      current &&
      (current.type === "export" || current.type === "modifier" || current.type === "annotation")
    ) {
      startIndex = current.startIndex;
      current = current.previousSibling;
    }

    // Extract the full text from the adjusted start to the end of the node
    const code = node.tree.rootNode.text.slice(startIndex, node.endIndex);
    return code;
  }

  // Helper function to find a node by type and name in AST
  private findNodeByTypeAndName(fileContent: string, type: string, name: string): Node | null {
    const tree = this.parser.parse(fileContent);
    if (!tree) return null;
    const rootNode = tree.rootNode; // Start from the root node

    const traverse = (node: Node): Node | null => {
      if (node.type === type && node.childForFieldName("name")?.text === name) {
        return node;
      }

      for (let i = 0; i < node.childCount; i++) {
        const childNode = node.child(i);
        if (childNode) {
          // Ensure the childNode is not null
          const found = traverse(childNode);
          if (found) return found;
        }
      }

      return null;
    };

    return traverse(rootNode); // Start traversal from the root node
  }
}
