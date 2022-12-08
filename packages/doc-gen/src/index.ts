import {
  compile,
  compilerAssert,
  Decorator,
  DocContent,
  DocParamTagNode,
  Enum,
  getTypeName,
  navigateProgram,
  NodeHost,
  Model,
  Operation,
  Program,
  Projection,
  IdentifierNode,
  StringLiteral,
  SyntaxKind,
  Type,
  TypeReferenceNode
} from "@cadl-lang/compiler";
import * as fs from 'fs';

export async function generateDocs(mainfile: string) {
  const result = {
    models: [] as Model[],
    enums: [] as Enum[],
    operations: [] as Operation[],
    decorators: [] as Decorator[],
    projections: [] as Projection[],
    strings: [] as StringLiteral[],
  };

  const cadlprogram = await compile(NodeHost, mainfile, {parseOptions:{comments: true, docs: true}});
  navigateProgram(cadlprogram, {
    model(m) {
      result.models.push(m);
    },
    enum(e) {
      result.enums.push(e);
    },
    operation(o) {
      result.operations.push(o);
    },
    decorator(d) {
      result.decorators.push(d);
    },

    projection(p) {
      result.projections.push(p);
    },
    string(s) {
      result.strings.push(s);
    }
  }, {includeTemplateDeclaration: true});

  const sourceFile = cadlprogram.sourceFiles;
  let markdownString = "";
  for (const dec of result.decorators) {
    markdownString += "## `" + dec.node.symbol.name + "`\n\n";
    for (const doc of dec.node.docs ?? []) {
      for (const dContent of doc.content) {
        markdownString += dContent.text + "\n";
      }

      markdownString += "\n\n```cadl\n";
      markdownString += "dec " + dec.node.id.sv + " (target: ";
      markdownString += ((dec.node.target.type as TypeReferenceNode).target as IdentifierNode)?.sv;

      for (const dTag of doc.tags as DocParamTagNode[]) {
        if (dTag.tagName.sv !== "param") continue;
        let optional = false;
        let rest = false;
        let type = undefined;
        for (const param of dec.parameters) {
          if (param.name === dTag.paramName.sv) {
            optional = param.optional;
            type = param.type;
            rest = param.rest;
          }
        }
        markdownString += rest ? ", ..." : ", ";
        markdownString += dTag.paramName.sv;
        markdownString += optional ? "?" : "";
        markdownString += ": " + getTypeName(type as Type).split(".").splice(-1);
      }

      markdownString += ") \n```\n\n";
      markdownString += "Target: `";
      markdownString += ((dec.node.target.type as TypeReferenceNode).target as IdentifierNode)?.sv;

      markdownString += "`\nParameters:";
      for (const dTag of doc.tags as DocParamTagNode[]) {
        if (dTag.tagName.sv !== "param") continue;
        markdownString += "\n-`" + dTag.paramName.sv + "` ";
        let optional = false;
        for (const param of dec.parameters) {
          if (param.name === dTag.paramName.sv) {
            optional = param.optional;
          }
        }
        
        if (optional) markdownString += "(optional) "
        for (const dtContent of dTag.content) {
          markdownString += dtContent.text + "\n";
        }
      }

      markdownString += "\n\n### Examples:\n\n";
      for (const dTag of doc.tags) {
        if (dTag.tagName.sv !== "example") continue;
        for (const dtContent of dTag.content) {
          markdownString += dtContent.text + "\n";
        }
      }
    }
  }
  fs.writeFileSync(mainfile.substring(0, mainfile.lastIndexOf("/")) + "/REFDOC.md", markdownString);
  console.log(markdownString);
}

function getParameterDocumentation(program: Program, type: Type): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of type?.node?.docs ?? []) {
    for (const tag of d.tags) {
      if (tag.kind === SyntaxKind.DocParamTag) {
        map.set(tag.paramName.sv, getDocContent(tag.content));
      }
    }
  }
  return map;
}

function getDocContent(content: readonly DocContent[]) {
  const docs = [];
  for (const node of content) {
    compilerAssert(
      node.kind === SyntaxKind.DocText,
      "No other doc content node kinds exist yet. Update this code appropriately when more are added."
    );
    docs.push(node.text);
  }
  return docs.join("");
}

generateDocs("C:/Git/cadl/packages/compiler/lib/main.cadl");
