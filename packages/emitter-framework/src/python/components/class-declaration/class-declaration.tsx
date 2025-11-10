import { abcModule, typingModule } from "#python/builtins.js";
import { code, createContentSlot, For, mapJoin, Show, type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import {
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  type Interface,
  type Model,
  type ModelProperty,
  type Operation,
} from "@typespec/compiler";
import type { TemplateDeclarationNode } from "@typespec/compiler/ast";
import type { Typekit } from "@typespec/compiler/typekit";
import { createRekeyableMap } from "@typespec/compiler/utils";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../../lib.js";
import { createDocElement } from "../../utils/doc.jsx";
import { declarationRefkeys, efRefkey } from "../../utils/refkey.js";
import { TypeExpression } from "../type-expression/type-expression.jsx";
import { ClassMember } from "./class-member.jsx";
import { MethodProvider } from "./class-method.jsx";

export interface ClassDeclarationPropsWithType extends Omit<py.ClassDeclarationProps, "name"> {
  type: Model | Interface;
  name?: string;
  abstract?: boolean; // Global override for the abstract flag
  methodType?: "method" | "class" | "static"; // Global override for the method type
}

export type ClassDeclarationProps = ClassDeclarationPropsWithType | py.ClassDeclarationProps;

function isTypedClassDeclarationProps(
  props: ClassDeclarationProps,
): props is ClassDeclarationPropsWithType {
  return "type" in props;
}

/**
 * Gets type members (properties or operations) from a Model or Interface.
 * @param $ - The Typekit.
 * @param type - The model or interface type.
 * @returns Array of model properties or operations.
 */
function getTypeMembers($: Typekit, type: Model | Interface): (ModelProperty | Operation)[] {
  if ($.model.is(type)) {
    // For models, extract properties to render as dataclass fields
    return Array.from($.model.getProperties(type).values());
  } else if (type.kind === "Interface") {
    // For interfaces, extract operations to render as abstract methods
    return Array.from(createRekeyableMap(type.operations).values());
  } else {
    throw new Error("Expected Model or Interface type");
  }
}

/**
 * Creates the class body for the class declaration.
 * Returns a ClassBody component if there are members or children to render,
 * otherwise returns undefined (which will render "pass" in Python).
 *
 * @param $ - The Typekit.
 * @param props - The props for the class declaration.
 * @param abstract - Whether the class is abstract.
 * @returns The class body component, or undefined for an empty class.
 */
function createClassBody($: Typekit, props: ClassDeclarationProps, abstract: boolean) {
  if (!isTypedClassDeclarationProps(props)) {
    const ContentSlot = createContentSlot();
    return (
      <>
        <ContentSlot>{props.children}</ContentSlot>
        <ContentSlot.WhenEmpty>{undefined}</ContentSlot.WhenEmpty>
      </>
    );
  }

  const validTypeMembers = getTypeMembers($, props.type);

  return <ClassBody {...props} validTypeMembers={validTypeMembers} abstract={abstract} />;
}

/**
 * Creates the extends types for the class declaration.
 *
 * - Template instances (e.g., `Response<string>` → `Response[str]`) - Use TypeExpression to render with type args
 * - Partial templates (e.g., `Response<T> -> Response[T]`) - Use TypeExpression to render with type args
 * - Regular models (e.g., `BaseWidget`) - Use py.Reference for simple name resolution
 * - Arrays - Use TypeExpression for `typing.Sequence[T]` rendering
 * - Records - Not supported, ignored
 *
 * @param $ - The Typekit.
 * @param type - The type to create the extends type for.
 * @returns The extends types for the class declaration, or undefined for interfaces.
 */
function getExtendsType($: Typekit, type: Model | Interface): Children | undefined {
  // For interfaces, return undefined because inheritance is flattened by TypeSpec
  if (!$.model.is(type)) {
    return undefined;
  }

  const extending: Children[] = [];

  if (type.baseModel) {
    if ($.array.is(type.baseModel)) {
      extending.push(<TypeExpression type={type.baseModel} />);
    } else if ($.record.is(type.baseModel)) {
      // Record-based scenarios are not supported, do nothing here
    } else if (isTemplateDeclarationOrInstance(type.baseModel)) {
      // Template type (declaration or instance) - needs TypeExpression for type parameter handling
      // This covers: Response<string>, Response<T>, and other templated scenarios
      extending.push(<TypeExpression type={type.baseModel} />);
    } else {
      // Regular model - use py.Reference for proper symbol resolution
      extending.push(<py.Reference refkey={efRefkey(type.baseModel)} />);
    }
  }

  // Handle index types: Arrays (int indexes) are supported, while Records (string indexes) are not
  // Note: TypeSpec prevents array models from having properties, so indexType is only for empty arrays
  const indexType = $.model.getIndexType(type);
  if (indexType && !$.record.is(indexType)) {
    extending.push(<TypeExpression type={indexType} />);
  }

  return extending.length > 0
    ? mapJoin(
        () => extending,
        (ext) => ext,
        { joiner: "," },
      )
    : undefined;
}

/**
 * Creates the bases (inheritance) list for the class declaration.
 * Combines explicit bases from props, inherited bases from the type, and ABC if abstract.
 * ABC is always added last to maintain proper Python MRO.
 *
 * @param $ - The Typekit.
 * @param props - The props for the class declaration.
 * @param abstract - Whether the class is abstract.
 * @param extraBases - Additional bases to include (e.g., Generic[T]). Will be mutated.
 * @returns The bases type for the class declaration, or undefined if no bases.
 */
function createBasesType(
  $: Typekit,
  props: ClassDeclarationProps,
  abstract: boolean,
  extraBases: Children[] = [],
) {
  // Add extends/inheritance from the TypeSpec type if present
  if (isTypedClassDeclarationProps(props)) {
    const extend = getExtendsType($, props.type);
    if (extend) {
      extraBases.push(extend);
    }
  }

  // Combine explicit bases from props with extraBases (Generic, extends, etc.)
  const allBases = (props.bases ?? []).concat(extraBases);

  // For non-abstract classes, return bases or undefined
  if (!abstract) {
    return allBases.length > 0 ? allBases : undefined;
  }

  // For abstract classes, add ABC (always last for proper MRO)
  const abcBase = abcModule["."]["ABC"];
  return allBases.length > 0 ? [...allBases, abcBase] : [abcBase];
}

/**
 * Builds TypeVar declarations and the Generic[...] base for templated types.
 *
 * **Template Detection Logic**:
 * Only generates TypeVars for true template declarations (e.g., `model Response<T>` or `interface Foo<T>`).
 *
 * Skips TypeVars for:
 * - **Template Instances** - e.g., `Response<string>` (concrete type instantiation)
 * - **Operations in Template Interfaces** - e.g., `interface Foo<T> { op(item: T): T }` (operations inherit parent's template params)
 * - **Regular Types** - e.g., `model Widget` (no template parameters)
 *
 * @param $ - The Typekit
 * @param type - The model or interface type to analyze
 * @returns TypeVar declarations and Generic base, or null if not a template declaration
 */
function buildTypeVarsAndGenericBase(
  $: Typekit,
  type: Model | Interface,
): { typeVars: Children | null; genericBase?: Children } {
  // Only generate TypeVars for true template declarations
  // (skips template instances, operations in template interfaces, and regular types)
  if (!isTemplateDeclaration(type)) {
    return { typeVars: null };
  }

  // Get template parameters from the validated template declaration
  const templateParameters = (type.node as TemplateDeclarationNode).templateParameters;

  // Generate TypeVars for the template declaration
  const typeVars = (
    <>
      <For each={templateParameters} hardline>
        {(node) => {
          // Build TypeVar arguments: name + optional bound
          const typeVarArgs: Children[] = [<py.Atom jsValue={node.id.sv} />];

          // Check if template parameter has a constraint (bound)
          if (node.constraint) {
            // Converts the AST node to a TypeSpec type
            const constraintType = $.program.checker.getTypeForNode(node.constraint);
            typeVarArgs.push(
              <>
                bound=
                <TypeExpression type={constraintType} />
              </>,
            );
          }

          const typeVar = (
            <py.FunctionCallExpression target={typingModule["."].TypeVar} args={typeVarArgs} />
          );
          return <py.VariableDeclaration name={node.id.sv} initializer={typeVar} />;
        }}
      </For>
    </>
  );

  const typeArgs: Children[] = [];
  for (const templateParameter of templateParameters) {
    typeArgs.push(code`${templateParameter.id.sv}`);
  }

  const genericBase = <py.TypeReference refkey={typingModule["."].Generic} typeArgs={typeArgs} />;

  return { typeVars, genericBase };
}

/**
 * Converts TypeSpec Models and Interfaces to Python classes.
 *
 * - **Models** are converted into Dataclasses with `@dataclass(kw_only=True)` + fields
 * - **Interfaces** are converted into Abstract classes (ABC) with abstract methods
 * - For models that extends another model, we convert that into Python class inheritance
 * - For interfaces that extends another interface, there's no inheritance, since
 *   TypeSpec flattens the inheritance
 *
 * @param props - The props for the class declaration.
 * @returns The class declaration.
 */
export function ClassDeclaration(props: ClassDeclarationProps) {
  const { $ } = useTsp();

  // Interfaces are rendered as abstract classes (ABC) with abstract methods
  // Models are rendered as concrete dataclasses with fields
  // If we are explicitly overriding the class as abstract or the type is not a model, we need to create an abstract class
  const abstract =
    ("abstract" in props && props.abstract) || ("type" in props && !$.model.is(props.type));

  const docSource = props.doc ?? ("type" in props ? $.type.getDoc(props.type) : undefined);
  const docElement = createDocElement(docSource, py.ClassDoc);

  // Build template-related bases (Generic[T, ...]) if this is a template declaration
  const extraBases: Children[] = [];
  let typeVars: Children | null = null;
  if (isTypedClassDeclarationProps(props)) {
    const generic = buildTypeVarsAndGenericBase($, props.type);
    typeVars = generic.typeVars;
    if (generic.genericBase) {
      extraBases.push(generic.genericBase);
    }
  }

  const basesType = createBasesType($, props, abstract, extraBases);

  if (!isTypedClassDeclarationProps(props)) {
    return (
      <py.ClassDeclaration
        {...props}
        doc={docElement}
        bases={basesType as Children[] | undefined}
      />
    );
  }

  const namePolicy = py.usePythonNamePolicy();

  let name = props.name ?? props.type.name;
  if (!name) {
    reportDiagnostic($.program, { code: "type-declaration-missing-name", target: props.type });
  }
  name = namePolicy.getName(name, "class");

  const refkeys = declarationRefkeys(props.refkey, props.type);

  // Check for models with additional properties (Record-based scenarios)
  // This check must happen here (in addition to ClassBody) because models with no properties
  // (e.g., `model Foo is Record<string>`) won't render a ClassBody, so the error would never be thrown
  if ($.model.is(props.type)) {
    const additionalPropsRecord = $.model.getAdditionalPropertiesRecord(props.type);
    if (additionalPropsRecord) {
      throw new Error("Models with additional properties (Record[…]) are not supported");
    }
  }

  // Array-based models (e.g., model Foo is Array<T>) use regular classes, not dataclasses,
  // since Array models in TypeSpec can't have properties, so they behave more like a class
  // that inherits from a list.
  const isArrayModel = $.model.is(props.type) && $.array.is(props.type);
  const useDataclass = !isArrayModel;

  const classBody = createClassBody($, props, abstract);
  const ClassComponent = useDataclass ? py.DataclassDeclaration : py.ClassDeclaration;

  return (
    <>
      <Show when={typeVars !== null}>
        {typeVars}
        <hbr />
        <line />
      </Show>
      <MethodProvider value={props.methodType}>
        <ClassComponent
          doc={docElement}
          name={name}
          bases={basesType as Children[] | undefined}
          refkey={refkeys}
          kwOnly={useDataclass ? true : undefined}
        >
          {classBody}
        </ClassComponent>
      </MethodProvider>
    </>
  );
}

interface ClassBodyProps extends ClassDeclarationPropsWithType {
  abstract?: boolean; // Global override for the abstract flag
  methodType?: "method" | "class" | "static"; // Global override for the method type
}

/**
 * Renders the body of a class declaration.
 * For models, renders properties as dataclass fields.
 * For interfaces, renders operations as abstract methods.
 * Includes any additional children provided.
 */
function ClassBody(
  props: ClassBodyProps & { validTypeMembers?: (ModelProperty | Operation)[] },
): Children {
  const { $ } = useTsp();
  const validTypeMembers = props.validTypeMembers ?? getTypeMembers($, props.type);
  const ContentSlot = createContentSlot();

  // Throw error for models with additional properties (Record-based scenarios)
  // This is checked in ClassDeclaration before calling createClassBody, but kept here
  // as a safety measure in case ClassBody is called directly
  if ($.model.is(props.type)) {
    const additionalPropsRecord = $.model.getAdditionalPropertiesRecord(props.type);
    if (additionalPropsRecord) {
      // Python dataclasses don't support dynamic properties, so an additionalProperties
      // field would just be another fixed field, not a "catch-all" for arbitrary properties.
      throw new Error("Models with additional properties (Record[…]) are not supported");
    }
  }

  return (
    <>
      <ContentSlot>
        <For each={validTypeMembers} line>
          {(typeMember) => (
            <ClassMember
              type={typeMember}
              abstract={props.abstract}
              methodType={props.methodType}
            />
          )}
        </For>
        {props.children}
      </ContentSlot>
      <ContentSlot.WhenEmpty>{undefined}</ContentSlot.WhenEmpty>
    </>
  );
}
