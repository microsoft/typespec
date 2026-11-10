import {
  getDoc,
  getLocationContext,
  getSourceLocation,
  isTemplateInstance,
  navigateProgram,
  type Decorator,
  type DiagnosticReport,
  type DiagnosticTarget,
  type Enum,
  type Interface,
  type Model,
  type ModelProperty,
  type Namespace,
  type Operation,
  type Program,
  type Scalar,
  type Type,
  type Union,
  type UnionVariant,
} from "@typespec/compiler";
import { SyntaxKind, type DocTag, type DocTextNode, type Node } from "@typespec/compiler/ast";
import { libDef, reportDiagnostic } from "./lib.js";

/**
 * Locations already reported in the current run. Template instantiations make the compiler hand us
 * the same declaration many times over; without this the same source line is reported repeatedly.
 */
let reported = new Set<string>();

type Diagnostics = {
  [C in keyof (typeof libDef)["diagnostics"]]: (typeof libDef)["diagnostics"][C]["messages"];
};

function report<C extends keyof Diagnostics, M extends keyof Diagnostics[C]>(
  program: Program,
  diagnostic: DiagnosticReport<Diagnostics, C, M>,
) {
  const location = getSourceLocation(diagnostic.target as DiagnosticTarget);
  const key = [
    location?.file?.path,
    location?.pos,
    diagnostic.code,
    (diagnostic as any).messageId,
    JSON.stringify((diagnostic as any).format ?? null),
  ].join("|");
  if (reported.has(key)) return;
  reported.add(key);
  reportDiagnostic(program, diagnostic);
}

/**
 * Doc tags that have no structured meaning to the compiler but are recognized conventions.
 * Anything outside this list is most likely a typo or an unescaped code reference.
 */
const knownFreeformTags = new Set(["example", "see", "dev"]);

const emptyNames: ReadonlySet<string> = new Set();

/** Which structured tags each kind of declaration accepts. */
interface TagSupport {
  /** Names that `@param` may reference, or `undefined` if `@param` is not applicable. */
  readonly params?: ReadonlySet<string>;
  /** Names that `@prop` may reference, or `undefined` if `@prop` is not applicable. */
  readonly props?: ReadonlySet<string>;
  /** Names that `@template` may reference. Always applicable, may be empty. */
  readonly templateParams: ReadonlySet<string>;
  /** Whether `@returns` and `@errors` are applicable. */
  readonly returns: boolean;
}

export function validateDocumentation(program: Program) {
  // Operation parameters are emitted through the `modelProperty` listener too. They are handled by
  // the `operation` listener so they can be reported as parameters, so keep track of them here.
  const operationParameters = new Set<ModelProperty>();
  const visitedOperations = new Set<Node>();
  reported = new Set();

  navigateProgram(
    program,
    {
      model: (model) => checkDeclaration(program, model, "model"),
      modelProperty: (property) => {
        if (operationParameters.has(property)) return;
        // Inherited/spread properties should be documented on the model they originate from.
        if (property.sourceProperty !== undefined) return;
        checkMember(
          program,
          property,
          "property",
          property.model,
          collectTagNames(property.model?.node, SyntaxKind.DocPropTag),
        );
      },
      enum: (target) => {
        checkDeclaration(program, target, "enum");
        // `navigateProgram` does not emit enum members, so walk them here.
        for (const member of target.members.values()) {
          checkMember(program, member, "enum member", target, emptyNames);
        }
      },
      union: (target) => checkDeclaration(program, target, "union"),
      unionVariant: (variant) => checkUnionVariant(program, variant),
      scalar: (target) => checkDeclaration(program, target, "scalar"),
      interface: (target) => {
        checkDeclaration(program, target, "interface");
        // Operations of an uninstantiated interface template are not visited by `navigateProgram`.
        for (const operation of target.operations.values()) {
          checkOperation(program, operation);
        }
      },
      decorator: (target) => checkDecorator(program, target),
      operation: (operation) => checkOperation(program, operation),
    },
    { includeTemplateDeclaration: true },
  );

  function checkOperation(program: Program, operation: Operation) {
    if (operation.node === undefined || visitedOperations.has(operation.node)) return;
    visitedOperations.add(operation.node);

    checkDeclaration(program, operation, "operation");
    const documented = collectTagNames(operation.node, SyntaxKind.DocParamTag);
    for (const parameter of operation.parameters.properties.values()) {
      operationParameters.add(parameter);
      checkMember(program, parameter, "parameter", operation, documented);
    }
  }
}

function checkDeclaration(
  program: Program,
  type: Model | Enum | Union | Scalar | Interface | Operation,
  kind: string,
) {
  // Anonymous types (union expressions, anonymous models, ...) have nothing to document.
  if (!type.name) return;
  if (!isPublicLibraryType(program, type)) return;

  if (!getDocumentation(program, type)) {
    report(program, {
      code: "missing-documentation",
      messageId: "default",
      format: { kind, name: type.name ?? "" },
      target: type,
    });
  }
  checkTemplateParameterDocs(program, type, kind);
  checkDocTags(program, type, kind, type.name ?? "", getTagSupport(program, type));
}

function checkDecorator(program: Program, decorator: Decorator) {
  if (!isPublicLibraryType(program, decorator)) return;

  if (!getDocumentation(program, decorator)) {
    report(program, {
      code: "missing-documentation",
      messageId: "default",
      format: { kind: "decorator", name: decorator.name },
      target: decorator,
    });
  }

  const documented = collectTagNames(decorator.node, SyntaxKind.DocParamTag);
  for (const parameter of decorator.parameters) {
    if (!documented.has(parameter.name)) {
      report(program, {
        code: "missing-documentation",
        messageId: "member",
        format: { kind: "parameter", name: parameter.name, container: decorator.name },
        target: parameter,
      });
    }
  }

  checkDocTags(program, decorator, "decorator", decorator.name, getTagSupport(program, decorator));
}

function checkMember(
  program: Program,
  member: Type & { name: string | symbol },
  kind: string,
  container: Model | Enum | Operation | undefined,
  documentedByTag: ReadonlySet<string>,
) {
  if (typeof member.name !== "string") return;
  if (!container?.name) return;
  if (!isPublicLibraryType(program, container)) return;
  if (!isPublicLibraryType(program, member)) return;

  if (!documentedByTag.has(member.name) && !getDocumentation(program, member)) {
    report(program, {
      code: "missing-documentation",
      messageId: "member",
      format: { kind, name: member.name, container: container.name ?? "" },
      target: member,
    });
  }

  // A member takes no structured tags of its own: it has no parameters, properties or template
  // parameters, and only operations can return. Anything but a known freeform tag is extraneous.
  checkDocTags(program, member, kind, member.name, {
    templateParams: emptyNames,
    returns: false,
  });
}

function checkUnionVariant(program: Program, variant: UnionVariant) {
  // Anonymous variants (`string | int32`) carry no name of their own to document.
  if (typeof variant.name !== "string" || variant.node === undefined) return;
  checkMember(program, variant as any, "variant", variant.union as any, emptyNames);
}

/** Report template parameters of a templated declaration that have no `@template` tag. */
function checkTemplateParameterDocs(program: Program, type: Type, kind: string) {
  const node = type.node;
  if (node === undefined || !("templateParameters" in node)) return;
  if (node.templateParameters.length === 0) return;

  const documented = collectTagNames(node, SyntaxKind.DocTemplateTag);
  for (const templateParameter of node.templateParameters) {
    if (!documented.has(templateParameter.id.sv)) {
      report(program, {
        code: "missing-documentation",
        messageId: "member",
        format: {
          kind: "template parameter",
          name: templateParameter.id.sv,
          container: (type as any).name ?? "",
        },
        target: templateParameter,
      });
    }
  }
}

/** Report doc tags that reference something that doesn't exist, or that don't apply here. */
function checkDocTags(
  program: Program,
  type: Type,
  kind: string,
  container: string,
  support: TagSupport,
) {
  for (const tag of getDocTags(type.node)) {
    switch (tag.kind) {
      case SyntaxKind.DocParamTag:
        if (support.params === undefined) {
          reportNotApplicable(program, tag, kind, container);
        } else if (!support.params.has(tag.paramName.sv)) {
          report(program, {
            code: "extraneous-documentation",
            messageId: "param",
            format: { name: tag.paramName.sv, kind, container },
            target: tag.paramName,
          });
        }
        break;
      case SyntaxKind.DocPropTag:
        if (support.props === undefined) {
          reportNotApplicable(program, tag, kind, container);
        } else if (!support.props.has(tag.propName.sv)) {
          report(program, {
            code: "extraneous-documentation",
            messageId: "prop",
            format: { name: tag.propName.sv, kind, container },
            target: tag.propName,
          });
        }
        break;
      case SyntaxKind.DocTemplateTag:
        if (!support.templateParams.has(tag.paramName.sv)) {
          report(program, {
            code: "extraneous-documentation",
            messageId: "templateParam",
            format: { name: tag.paramName.sv, kind, container },
            target: tag.paramName,
          });
        }
        break;
      case SyntaxKind.DocReturnsTag:
      case SyntaxKind.DocErrorsTag:
        if (!support.returns) {
          reportNotApplicable(program, tag, kind, container);
        }
        break;
      case SyntaxKind.DocUnknownTag:
        if (!knownFreeformTags.has(tag.tagName.sv)) {
          report(program, {
            code: "extraneous-documentation",
            messageId: "unknownTag",
            format: { tagName: tag.tagName.sv },
            target: tag.tagName,
          });
        }
        break;
    }
  }
}

function reportNotApplicable(program: Program, tag: DocTag, kind: string, container: string) {
  report(program, {
    code: "extraneous-documentation",
    messageId: "tagNotApplicable",
    format: { tagName: tag.tagName.sv, kind, container },
    target: tag.tagName,
  });
}

function getTagSupport(program: Program, type: Type): TagSupport {
  const templateParams = new Set<string>(
    type.node && "templateParameters" in type.node
      ? type.node.templateParameters.map((x) => x.id.sv)
      : [],
  );

  switch (type.kind) {
    case "Model":
      return { props: new Set(type.properties.keys()), templateParams, returns: false };
    case "Operation":
      return {
        params: new Set(type.parameters.properties.keys()),
        templateParams,
        returns: true,
      };
    case "Decorator":
      return {
        params: new Set([type.target.name, ...type.parameters.map((x) => x.name)]),
        templateParams,
        returns: false,
      };
    default:
      return { templateParams, returns: false };
  }
}

function getDocTags(node: Node | undefined): readonly DocTag[] {
  if (node === undefined || node.docs === undefined) return [];
  return node.docs.flatMap((doc) => doc.tags);
}

/**
 * Resolve the documentation of a type, from either an explicit `@doc` or a doc comment.
 *
 * The doc comment fallback is needed because a few declaration kinds, notably `extern dec`, never
 * get the comment applied as a `@doc` decorator, so {@link getDoc} alone reports them undocumented.
 */
function getDocumentation(program: Program, type: Type): string | undefined {
  const explicit = getDoc(program, type);
  if (explicit) return explicit;

  const node = type.node;
  if (node === undefined) return undefined;

  const comment = (node.docs ?? []).map((doc) => getDocContent(doc.content)).join("");
  if (comment.trim()) return comment.trim();

  // `getDoc` only sees `@doc` once decorators have run, which never happens for `extern dec`
  // declarations or for the declaration form of a template. Read the argument off the AST instead.
  return getDocDecoratorArgument(node);
}

/** Read the argument of an `@doc("...")` decorator straight from the syntax tree. */
function getDocDecoratorArgument(node: Node): string | undefined {
  if (!("decorators" in node) || node.decorators === undefined) return undefined;
  for (const decorator of node.decorators) {
    const name = decorator.target;
    const simpleName =
      name.kind === SyntaxKind.Identifier
        ? name.sv
        : name.kind === SyntaxKind.MemberExpression
          ? name.id.sv
          : undefined;
    if (simpleName !== "doc") continue;
    const argument = decorator.arguments[0];
    if (argument?.kind === SyntaxKind.StringLiteral && argument.value.trim()) {
      return argument.value;
    }
  }
  return undefined;
}

function getDocContent(content: readonly DocTextNode[]): string {
  return content.map((node) => node.text).join("");
}

function collectTagNames(node: Node | undefined, kind: SyntaxKind): Set<string> {
  const names = new Set<string>();
  for (const tag of getDocTags(node)) {
    if (tag.kind !== kind) continue;
    if (tag.kind === SyntaxKind.DocParamTag || tag.kind === SyntaxKind.DocTemplateTag) {
      names.add(tag.paramName.sv);
    } else if (tag.kind === SyntaxKind.DocPropTag) {
      names.add(tag.propName.sv);
    }
  }
  return names;
}

/**
 * A type is part of the library's public surface when it is declared in the project being compiled
 * (as opposed to one of its dependencies or the standard library), is not hidden behind a `Private`
 * namespace, and is not marked `internal`.
 */
function isPublicLibraryType(program: Program, type: Type): boolean {
  if (isTemplateInstance(type as any)) return false;
  if (type.node === undefined) return false;
  if (getSourceLocation(type.node).isSynthetic) return false;
  if (getLocationContext(program, type as DiagnosticTarget).type !== "project") return false;
  if (hasInternalModifier(type.node)) return false;
  return !isInPrivateNamespace(type);
}

function hasInternalModifier(node: Node): boolean {
  if (!("modifiers" in node) || node.modifiers === undefined) return false;
  return node.modifiers.some((modifier) => modifier.kind === SyntaxKind.InternalKeyword);
}

function isInPrivateNamespace(type: Type): boolean {
  let namespace: Namespace | undefined = getContainingNamespace(type);
  while (namespace) {
    if (namespace.name === "Private") return true;
    namespace = namespace.namespace;
  }
  return false;
}

function getContainingNamespace(type: Type): Namespace | undefined {
  switch (type.kind) {
    case "Model":
    case "Enum":
    case "Union":
    case "Scalar":
    case "Interface":
    case "Operation":
    case "Decorator":
      return type.namespace;
    case "ModelProperty":
      return type.model?.namespace;
    case "EnumMember":
      return type.enum.namespace;
    case "UnionVariant":
      return type.union.namespace;
    default:
      return undefined;
  }
}
