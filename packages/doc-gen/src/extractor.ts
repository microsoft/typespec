import {
  compilerAssert,
  Decorator,
  DocContent,
  DocUnknownTagNode,
  Enum,
  getSourceLocation,
  Model,
  navigateProgram,
  Operation,
  Program,
  Projection,
  StringLiteral,
  SyntaxKind,
  Type,
} from "@cadl-lang/compiler";
import { CadlRefDoc, ExampleRefDoc, FunctionParameterRefDoc } from "./types.js";
import { getTypeSignature } from "./utils/type-signature.js";

export function extractRefDocs(program: Program): CadlRefDoc {
  const result = {
    models: [] as Model[],
    enums: [] as Enum[],
    operations: [] as Operation[],
    decorators: [] as Decorator[],
    projections: [] as Projection[],
    strings: [] as StringLiteral[],
  };

  navigateProgram(
    program,
    {
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
      },
    },
    { includeTemplateDeclaration: true }
  );

  const refDoc: CadlRefDoc = {
    decorators: [],
  };
  for (const dec of result.decorators) {
    let mainDoc: string = "";
    const paramDoc = getParameterDocumentation(dec);
    const parameters: FunctionParameterRefDoc[] = dec.parameters.map((x) => {
      return {
        type: x,
        doc: paramDoc.get(x.name) ?? "",
        name: x.name,
        optional: x.optional,
        rest: x.rest,
      };
    });
    const examples: ExampleRefDoc[] = [];
    for (const doc of dec.node.docs ?? []) {
      for (const dContent of doc.content) {
        mainDoc += dContent.text + "\n";
      }

      for (const dTag of doc.tags) {
        switch (dTag.kind) {
          case SyntaxKind.DocUnknownTag:
            if (dTag.tagName.sv === "example") {
              examples.push(extractExample(dTag));
            }
            break;
          case SyntaxKind.DocParamTag:
            break;
        }
      }
    }

    refDoc.decorators.push({
      name: dec.name,
      type: dec,
      signature: getTypeSignature(dec),
      doc: mainDoc,
      parameters,
      examples,
      otherTags: [],
      target: {
        type: dec.target,
        doc: paramDoc.get(dec.target.name) ?? "",
        name: dec.target.name,
        optional: dec.target.optional,
        rest: dec.target.rest,
      },
    });
  }

  return refDoc;
}

function checkIfTagHasDocOnSameLine(tag: DocUnknownTagNode): boolean {
  const start = tag.content[0]?.pos;
  const end = tag.content[0]?.end;
  const file = getSourceLocation(tag.content[0]).file;

  let hasFirstLine = false;
  for (let i = start; i < end; i++) {
    const ch = file.text[i];
    if (ch === "\n") {
      break;
    }
    // Todo reuse compiler whitespace logic or have a way to get this info from the parser.
    if (ch !== " ") {
      hasFirstLine = true;
    }
  }
  return hasFirstLine;
}
function extractExample(tag: DocUnknownTagNode): ExampleRefDoc {
  const content = getDocContent(tag.content);
  const hasInfoOnFirstLine = checkIfTagHasDocOnSameLine(tag);
  if (hasInfoOnFirstLine) {
    const [title, ...contents] = content.split("\n");
    return { title, content: contents.join("\n") };
  } else {
    return { content };
  }
}

function getParameterDocumentation(type: Type): Map<string, string> {
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
