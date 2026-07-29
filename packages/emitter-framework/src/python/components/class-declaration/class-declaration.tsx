import * as py from "@alloy-js/python";
import { type Interface, type Model } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { reportDiagnostic } from "../../../lib.js";
import { declarationRefkeys } from "../../utils/refkey.js";
import { DocElement } from "../doc-element/doc-element.js";
import { ClassBases } from "./class-bases.js";
import { ClassBody } from "./class-body.js";
import { MethodProvider } from "./class-method.js";

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

  const type = "type" in props ? props.type : undefined;
  const docSource = props.doc ?? (type ? $.type.getDoc(type) : undefined);
  const docElement = docSource ? <DocElement doc={docSource} component={py.ClassDoc} /> : undefined;

  // TODO: When TypeSpec adds true generics support, pass extraBases with Generic[T, ...] here.
  // Currently, TypeSpec templates are macros that expand to concrete types, so we don't
  // generate Python generics (TypeVar/Generic) for template declarations.
  const basesType = ClassBases({
    type: "type" in props ? props.type : undefined,
    bases: props.bases,
    abstract,
  });

  if (!isTypedClassDeclarationProps(props)) {
    return (
      <py.ClassDeclaration
        {...props}
        doc={docElement}
        {...(basesType.length ? { bases: basesType } : {})}
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
  // Similarly, interfaces should use regular classes (ABC) not dataclasses, since interfaces
  // only define abstract methods, not fields.
  const isArrayModel = $.model.is(props.type) && $.array.is(props.type);
  const isInterface = props.type.kind === "Interface";
  const useDataclass = !isArrayModel && !isInterface;

  const ClassComponent = useDataclass ? py.DataclassDeclaration : py.ClassDeclaration;

  return (
    <MethodProvider value={props.methodType}>
      <ClassComponent
        doc={docElement}
        name={name}
        {...(basesType.length ? { bases: basesType } : {})}
        refkey={refkeys}
        kwOnly={useDataclass ? true : undefined}
      >
        <ClassBody type={props.type} abstract={abstract} methodType={props.methodType}>
          {props.children}
        </ClassBody>
      </ClassComponent>
    </MethodProvider>
  );
}
